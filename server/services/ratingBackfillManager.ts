import { db } from "../db";
import { content, importStatus } from "@shared/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { omdbService } from "./omdb";
import { tmdbService } from "./tmdb";
import { tvmazeService } from "./tvmaze";

interface BackfillState {
  isRunning: boolean;
  lastRun: string | null;
  lastError: string | null;
  lockUntil: string | null;
}

export class RatingBackfillManager {
  private static readonly STATE_SOURCE = 'rating_backfill_state';
  private static readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly BATCH_SIZE = 200;
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  async start() {
    // Run immediately on startup
    console.log('[RatingBackfill] Starting rating backfill manager');
    setTimeout(() => this.tick(), 5000); // Wait 5 seconds for server to fully start
    
    // Then run every 5 minutes
    this.intervalId = setInterval(() => this.tick(), 5 * 60 * 1000);
    console.log('[RatingBackfill] Scheduler started - checking every 5 minutes');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[RatingBackfill] Scheduler stopped');
    }
  }

  private async getState(): Promise<BackfillState> {
    const [record] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, RatingBackfillManager.STATE_SOURCE));

    if (record && record.cursor) {
      return record.cursor as unknown as BackfillState;
    }

    // Initialize if not found
    const initialState: BackfillState = {
      isRunning: false,
      lastRun: null,
      lastError: null,
      lockUntil: null,
    };

    await db.insert(importStatus).values({
      source: RatingBackfillManager.STATE_SOURCE,
      cursor: initialState as any,
      totalImported: 0,
      totalAvailable: 0,
    });

    return initialState;
  }

  private async setState(state: Partial<BackfillState>): Promise<void> {
    const current = await this.getState();
    const updated: BackfillState = { ...current, ...state };

    await db
      .update(importStatus)
      .set({
        cursor: updated as any,
        updatedAt: new Date(),
      })
      .where(eq(importStatus.source, RatingBackfillManager.STATE_SOURCE));
  }

  private async acquireLock(): Promise<boolean> {
    const state = await this.getState();
    
    // Check if lock is still valid
    if (state.lockUntil) {
      const lockExpiry = new Date(state.lockUntil);
      if (new Date() < lockExpiry) {
        console.log('[RatingBackfill] Lock already held, skipping this run');
        return false;
      }
    }

    // Acquire lock
    const lockUntil = new Date(Date.now() + RatingBackfillManager.LOCK_DURATION_MS);
    await this.setState({
      isRunning: true,
      lockUntil: lockUntil.toISOString(),
    });

    return true;
  }

  private async releaseLock(): Promise<void> {
    await this.setState({
      isRunning: false,
      lockUntil: null,
    });
  }

  async tick() {
    // Prevent concurrent processing
    if (this.isProcessing) {
      console.log('[RatingBackfill] Already processing, skipping this tick');
      return;
    }

    try {
      this.isProcessing = true;

      // Try to acquire lock
      if (!await this.acquireLock()) {
        return;
      }

      // Check if OMDb quota is available
      if (await omdbService.isExhausted()) {
        const stats = await omdbService.getQuotaStats();
        console.log(`[RatingBackfill] OMDb quota exhausted. Next reset: ${stats.nextReset}`);
        await this.releaseLock();
        return;
      }

      // Get unrated content counts
      const counts = await this.getUnratedCounts();
      const totalUnrated = counts.movie + counts.tv;

      if (totalUnrated === 0) {
        console.log('[RatingBackfill] No unrated content found');
        await this.releaseLock();
        return;
      }

      console.log(`[RatingBackfill] Found ${totalUnrated} unrated items (Movies: ${counts.movie}, TV: ${counts.tv})`);

      // Process a batch
      await this.processBatch();

      // Update last run time
      await this.setState({
        lastRun: new Date().toISOString(),
        lastError: null,
      });

    } catch (error) {
      console.error('[RatingBackfill] Error during tick:', error);
      await this.setState({
        lastError: String(error),
      });
    } finally {
      await this.releaseLock();
      this.isProcessing = false;
    }
  }

  private async getUnratedCounts(): Promise<{ movie: number; tv: number; total: number }> {
    // Count movies without IMDb ratings
    const movieResult = await db
      .select({ count: sql`count(*)` })
      .from(content)
      .where(
        and(
          eq(content.type, 'movie'),
          isNull(content.imdbRating)
        )
      );

    // Count TV shows without IMDb ratings
    const tvResult = await db
      .select({ count: sql`count(*)` })
      .from(content)
      .where(
        and(
          eq(content.type, 'tv'),
          isNull(content.imdbRating)
        )
      );

    const movieCount = Number(movieResult[0]?.count || 0);
    const tvCount = Number(tvResult[0]?.count || 0);

    return {
      movie: movieCount,
      tv: tvCount,
      total: movieCount + tvCount,
    };
  }

  async processBatch(): Promise<{
    updated: number;
    skipped: number;
    failed: number;
    exhausted: boolean;
  }> {
    const stats = await omdbService.getQuotaStats();
    const batchSize = Math.min(RatingBackfillManager.BATCH_SIZE, stats.remaining);

    if (batchSize === 0) {
      console.log('[RatingBackfill] No OMDb quota remaining');
      return { updated: 0, skipped: 0, failed: 0, exhausted: true };
    }

    console.log(`[RatingBackfill] Processing batch of ${batchSize} items`);

    // Get unrated content, prioritizing by popularity and recency
    const unratedContent = await db
      .select()
      .from(content)
      .where(
        and(
          sql`${content.type} IN ('movie', 'tv')`,
          isNull(content.imdbRating)
        )
      )
      .orderBy(
        desc(content.popularity),
        desc(content.createdAt)
      )
      .limit(batchSize);

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let exhausted = false;

    for (const item of unratedContent) {
      // Check quota before each request
      if (await omdbService.isExhausted()) {
        console.log('[RatingBackfill] OMDb quota exhausted during batch processing');
        exhausted = true;
        break;
      }

      try {
        let imdbId = item.imdbId;

        // Get IMDb ID if we don't have it
        if (!imdbId) {
          if (item.source === 'tmdb' && item.type === 'movie') {
            const externalIds = await tmdbService.getMovieExternalIds(parseInt(item.sourceId));
            imdbId = externalIds.imdb_id || null;
          } else if (item.source === 'tvmaze' && item.type === 'tv') {
            const show = await tvmazeService.getShowById(parseInt(item.sourceId));
            imdbId = show.externals?.imdb || null;
          }
        }

        if (!imdbId) {
          // Mark as checked even without IMDb ID
          await db.update(content)
            .set({
              imdbId: null,
              lastUpdated: new Date(),
            })
            .where(eq(content.id, item.id));
          skipped++;
          continue;
        }

        // Fetch IMDb rating from OMDb
        const omdbData = await omdbService.getImdbRating(imdbId);

        const updateData: any = {
          imdbId: imdbId,
          lastUpdated: new Date(),
        };

        if (omdbData.rating !== null) {
          updateData.rating = omdbData.rating;
          updateData.imdbRating = omdbData.rating;
          updateData.voteCount = omdbData.votes;
        }

        await db.update(content)
          .set(updateData)
          .where(eq(content.id, item.id));

        updated++;
        
        if (omdbData.rating !== null) {
          console.log(`[RatingBackfill] ✓ Updated "${item.title}" with IMDb rating: ${omdbData.rating}`);
        } else {
          console.log(`[RatingBackfill] ○ Stored IMDb ID for "${item.title}" (no rating available)`);
        }

      } catch (error) {
        failed++;
        console.error(`[RatingBackfill] Failed to update ${item.title}:`, error);
      }
    }

    const quotaStatsAfter = await omdbService.getQuotaStats();
    console.log(`[RatingBackfill] Batch complete: ${updated} updated, ${skipped} skipped, ${failed} failed. OMDb: ${quotaStatsAfter.remaining} remaining`);

    return { updated, skipped, failed, exhausted };
  }

  async getStatus() {
    const state = await this.getState();
    const counts = await this.getUnratedCounts();
    const quotaStats = await omdbService.getQuotaStats();

    return {
      isRunning: state.isRunning,
      lastRun: state.lastRun,
      lastError: state.lastError,
      unratedCounts: counts,
      omdbQuota: quotaStats,
      nextRunIn: this.intervalId ? '5 minutes' : 'not scheduled',
    };
  }
}

// Singleton instance
export const ratingBackfillManager = new RatingBackfillManager();
