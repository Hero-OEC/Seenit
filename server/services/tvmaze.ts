import { db } from "../db";
import { content, importStatus, type Content, type InsertContent, type ImportStatus } from "@shared/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { omdbService } from "./omdb";

interface TVMazeShow {
  id: number;
  name: string;
  summary?: string;
  genres: string[];
  premiered?: string;
  ended?: string;
  status: string;
  runtime?: number;
  network?: {
    name: string;
  };
  webChannel?: {
    name: string;
  };
  schedule: {
    time: string;
    days: string[];
  };
  rating?: {
    average?: number;
  };
  image?: {
    medium?: string;
    original?: string;
  };
  externals?: {
    tvrage?: number;
    thetvdb?: number;
    imdb?: string;
  };
  _embedded?: {
    episodes?: Array<{
      id: number;
      name: string;
      season: number;
      number: number;
      airdate?: string;
      summary?: string;
    }>;
  };
}

interface TVMazeScheduleResponse {
  id: number;
  name: string;
  season: number;
  number: number;
  show: TVMazeShow;
}

export class TVMazeService {
  private baseUrl = 'https://api.tvmaze.com';
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequests = 15; // 15 requests per 10 seconds
  private readonly windowMs = 10000; // 10 seconds
  private isSyncing = false; // Instance-level lock to prevent multiple sync processes

  private async makeRequest<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const response = await fetch(`${this.baseUrl}${url}`);
          if (!response.ok) {
            throw new Error(`TVMaze API error: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.rateLimitQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      const now = Date.now();
      
      // Reset window if 10 seconds have passed
      if (now - this.windowStart >= this.windowMs) {
        this.requestCount = 0;
        this.windowStart = now;
      }

      // Wait if we've hit the rate limit
      if (this.requestCount >= this.maxRequests) {
        const waitTime = this.windowMs - (now - this.windowStart);
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          this.requestCount = 0;
          this.windowStart = Date.now();
        }
      }

      const request = this.rateLimitQueue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.isProcessingQueue = false;
  }

  async getAllShows(page: number = 0): Promise<TVMazeShow[]> {
    try {
      return await this.makeRequest<TVMazeShow[]>(`/shows?page=${page}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        // No more pages
        return [];
      }
      throw error;
    }
  }

  async getShowWithEpisodes(id: number): Promise<TVMazeShow> {
    return await this.makeRequest<TVMazeShow>(`/shows/${id}?embed=episodes`);
  }

  async getShowById(id: number): Promise<TVMazeShow> {
    return await this.makeRequest<TVMazeShow>(`/shows/${id}?embed=episodes`);
  }

  async getSchedule(date?: string): Promise<TVMazeScheduleResponse[]> {
    const dateParam = date ? `?date=${date}` : '';
    return await this.makeRequest<TVMazeScheduleResponse[]>(`/schedule${dateParam}`);
  }

  async getUpdatedShows(since: 'day' | 'week' | 'month' = 'day'): Promise<{[key: string]: number}> {
    return await this.makeRequest<{[key: string]: number}>(`/updates/shows?since=${since}`);
  }

  private async mapTVMazeToContent(show: TVMazeShow): Promise<InsertContent> {
    const network = show.network?.name || show.webChannel?.name;
    const episodes = show._embedded?.episodes || [];
    const totalEpisodes = episodes.length;
    
    // Calculate total seasons using the maximum season number (keep original numbering)
    const seasons = episodes.reduce((acc, ep) => {
      return Math.max(acc, ep.season);
    }, 0) || 0;

    // Process episode data into structured format
    const episodeData = episodes.length > 0 ? {
      episodes: episodes.map(ep => ({
        id: ep.id,
        name: ep.name,
        season: ep.season,
        number: ep.number,
        airdate: ep.airdate,
        summary: ep.summary ? this.stripHtmlTags(ep.summary) : null
      })),
      seasonCount: seasons,
      totalEpisodes: totalEpisodes,
      lastUpdated: new Date().toISOString()
    } : null;

    // Map TVMaze status to our schema
    let status = 'completed';
    if (show.status === 'Running') status = 'airing';
    else if (show.status === 'To Be Determined') status = 'upcoming';
    else if (show.status === 'In Development') status = 'upcoming';
    else if (show.status === 'Ended') status = 'completed';

    // Fetch IMDb rating via OMDb using external IDs
    let imdbRating = null;
    let imdbId = null;
    let imdbVotes = null;

    if (show.externals?.imdb) {
      imdbId = show.externals.imdb;
      try {
        // Check if OMDb quota is exhausted before making request
        if (await omdbService.isExhausted()) {
          console.log(`[TVMaze] OMDb quota exhausted, will rate "${show.name}" later via backfill`);
        } else {
          const omdbData = await omdbService.getImdbRating(imdbId);
          if (omdbData.rating !== null) {
            imdbRating = omdbData.rating;
            imdbVotes = omdbData.votes;
            console.log(`[TVMaze] Got IMDb rating for "${show.name}": ${imdbRating} (${imdbVotes} votes)`);
          } else {
            console.warn(`[TVMaze] No IMDb rating available for "${show.name}" (${imdbId})`);
          }
        }
      } catch (error) {
        console.error(`[TVMaze] Error fetching IMDb rating for "${show.name}":`, error);
      }
    } else {
      console.warn(`[TVMaze] No IMDb ID found for "${show.name}"`);
    }

    return {
      title: show.name,
      type: 'tv',
      source: 'tvmaze',
      sourceId: show.id.toString(),
      overview: show.summary ? this.stripHtmlTags(show.summary) : null,
      genres: show.genres || [],
      year: show.premiered ? new Date(show.premiered).getFullYear() : null,
      endYear: show.ended ? new Date(show.ended).getFullYear() : null,
      rating: imdbRating, // Use IMDb rating from OMDb instead of TVMaze rating
      poster: show.image?.medium || null,
      backdrop: show.image?.original || null,
      status,
      
      // TV-specific fields
      totalSeasons: seasons > 0 ? seasons : null,
      totalEpisodes: totalEpisodes > 0 ? totalEpisodes : null,
      network,
      airTime: show.schedule?.time || null,
      airDays: show.schedule?.days?.length ? show.schedule.days : null,
      episodeData: episodeData as any, // Store full episode details
      
      // Not used for TV
      episodes: null,
      season: null,
      runtime: show.runtime || null,
      releaseDate: null,
      studio: null,
      sourceMaterial: null,
      
      // Metadata
      tags: [show.status?.toLowerCase().replace(/\s+/g, '-')].filter(Boolean),
      popularity: show.rating?.average || null,
      voteCount: imdbVotes || null,
      
      // Store IMDb data
      imdbId: imdbId || undefined,
      imdbRating: imdbRating,
      rottenTomatoesRating: null,
      malRating: null,
      streamingPlatforms: null,
      affiliateLinks: null
    };
  }

  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  async syncAllShows(): Promise<{ imported: number; updated: number; errors: string[] }> {
    // Prevent multiple concurrent sync processes
    if (this.isSyncing) {
      console.log('TVmaze sync already in progress, ignoring duplicate request');
      return { imported: 0, updated: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    console.log('TVmaze sync started - instance lock acquired');

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    let page = 0;

    // Get or create import status
    let [importStatusRecord] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tvmaze'));

    if (!importStatusRecord) {
      [importStatusRecord] = await db
        .insert(importStatus)
        .values({
          source: 'tvmaze',
          isActive: true,
          totalImported: 0,
          totalAvailable: 0,
          currentPage: 0
        })
        .returning();
    } else {
      // Update to active
      await db
        .update(importStatus)
        .set({ 
          isActive: true, 
          updatedAt: new Date(),
          errors: [] 
        })
        .where(eq(importStatus.id, importStatusRecord.id));
      
      // Continue from last page
      page = importStatusRecord.currentPage || 0;
    }

    try {
      // Health Check: Detect and fix count disparities automatically
      await this.performHealthCheck(importStatusRecord);

      // Phase 1: Update existing airing/upcoming shows first (for new episodes/seasons)
      if (page === 0 || page === (importStatusRecord.currentPage || 0)) {
        console.log('Phase 1: Updating existing airing/upcoming shows for new episodes/seasons...');
        await this.updateExistingActiveShows();
        console.log('Phase 1 complete: Existing active shows updated');
      }

      // Phase 2: Continue importing from where we left off
      console.log(`Phase 2: Starting import from page ${page + 1}...`);
      let totalPagesProcessed = 0;
      let totalShowsInPhase2 = 0;
      
      while (true) {
        // Check if sync is still active (might be paused)
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'tvmaze'));
        
        if (!currentStatus?.isActive) {
          console.log('TVMaze sync paused by user');
          break;
        }

        const shows = await this.getAllShows(page);
        
        if (shows.length === 0) {
          console.log(`No more shows found at page ${page}, sync complete`);
          // Mark Phase 2 as complete
          await db
            .update(importStatus)
            .set({
              phase2Progress: `Phase 2 Complete: ${totalPagesProcessed} pages processed, ${totalShowsInPhase2} shows imported`,
              updatedAt: new Date()
            })
            .where(eq(importStatus.id, currentStatus.id));
          break;
        }

        totalPagesProcessed++;
        console.log(`Processing page ${page} with ${shows.length} shows`);

        for (const show of shows) {
          try {
            // Check if show already exists
            const [existingContent] = await db
              .select()
              .from(content)
              .where(
                and(
                  eq(content.source, 'tvmaze'),
                  eq(content.sourceId, show.id.toString())
                )
              );

            // Fetch detailed show data with episodes
            const detailedShow = await this.getShowWithEpisodes(show.id);
            const mappedContent = await this.mapTVMazeToContent(detailedShow);

            if (existingContent) {
              // Update existing content
              await db
                .update(content)
                .set({
                  ...mappedContent,
                  lastUpdated: new Date()
                })
                .where(eq(content.id, existingContent.id));
              updated++;
            } else {
              // Create new content
              await db
                .insert(content)
                .values(mappedContent);
              imported++;
              totalShowsInPhase2++;
            }
          } catch (error) {
            const errorMsg = `Error processing show ${show.name} (ID: ${show.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Update Phase 2 progress after each page
        const phase2ProgressText = `Page ${page + 1} processed: ${totalShowsInPhase2} new shows imported (${totalPagesProcessed} pages total)`;
        
        // Get actual count from database for accurate total
        const [actualCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(content)
          .where(and(eq(content.source, 'tvmaze'), eq(content.type, 'tv')));
        
        await db
          .update(importStatus)
          .set({
            currentPage: page + 1,
            totalImported: actualCount.count,
            phase2Progress: phase2ProgressText,
            lastSyncAt: new Date(),
            errors: errors.slice(-10) // Keep last 10 errors
          })
          .where(eq(importStatus.id, importStatusRecord.id));

        console.log(`Phase 2 Progress: ${phase2ProgressText}`);

        page++;

        // Small delay between pages to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as complete and update final count
      const [finalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(content)
        .where(and(eq(content.source, 'tvmaze'), eq(content.type, 'tv')));
      
      await db
        .update(importStatus)
        .set({
          isActive: false,
          totalImported: finalCount.count,
          lastSyncAt: new Date(),
          errors: errors.slice(-10)
        })
        .where(eq(importStatus.id, importStatusRecord.id));

    } catch (error) {
      const errorMsg = `Critical sync error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      errors.push(errorMsg);

      // Mark as inactive and log error
      await db
        .update(importStatus)
        .set({
          isActive: false,
          errors: errors.slice(-10)
        })
        .where(eq(importStatus.id, importStatusRecord.id));
    } finally {
      // Always release the instance lock
      this.isSyncing = false;
      console.log('TVmaze sync completed - instance lock released');
    }

    return { imported, updated, errors };
  }

  async getImportStatus(): Promise<ImportStatus | null> {
    const [status] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tvmaze'));
    
    return status || null;
  }

  private async updateExistingActiveShows(): Promise<void> {
    console.log('Checking existing shows for updates...');
    
    // Get all existing shows that are airing or upcoming
    const existingActiveShows = await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.source, 'tvmaze'),
          or(
            eq(content.status, 'airing'),
            eq(content.status, 'upcoming')
          )
        )
      );

    console.log(`Found ${existingActiveShows.length} existing airing/upcoming shows to update`);

    let updated = 0;
    for (const show of existingActiveShows) {
      try {
        // Check if sync is still active (might be paused)
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'tvmaze'));
        
        if (!currentStatus?.isActive) {
          console.log('TVMaze sync paused during existing show updates');
          break;
        }

        // Fetch latest data for this show
        const tvmazeId = parseInt(show.sourceId);
        const detailedShow = await this.getShowWithEpisodes(tvmazeId);
        const mappedContent = await this.mapTVMazeToContent(detailedShow);

        // Update existing show with latest data
        await db
          .update(content)
          .set({
            ...mappedContent,
            lastUpdated: new Date()
          })
          .where(eq(content.id, show.id));
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`Updated ${updated}/${existingActiveShows.length} existing shows`);
          
          // Update status with Phase 1 progress
          await db
            .update(importStatus)
            .set({
              phase1Progress: `${updated}/${existingActiveShows.length}`,
              updatedAt: new Date()
            })
            .where(eq(importStatus.id, currentStatus.id));
        }
        
      } catch (error) {
        console.error(`Error updating existing show ${show.title} (ID: ${show.sourceId}):`, error);
      }
    }
    
    // Mark Phase 1 as complete
    const [currentStatus] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tvmaze'));
    
    if (currentStatus) {
      await db
        .update(importStatus)
        .set({
          phase1Progress: `${updated}/${existingActiveShows.length} (Phase 1 Complete)`,
          updatedAt: new Date()
        })
        .where(eq(importStatus.id, currentStatus.id));
    }
    
    console.log(`Completed updating ${updated} existing airing/upcoming shows`);
  }

  async pauseSync(): Promise<void> {
    await db
      .update(importStatus)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(importStatus.source, 'tvmaze'));
    
    // Reset the instance lock immediately to allow restart
    this.isSyncing = false;
    console.log('TVmaze sync paused - instance lock released');
  }

  async resumeSync(): Promise<void> {
    // Check instance-level lock first (faster check)
    if (this.isSyncing) {
      console.log('TVmaze sync already running in this instance, ignoring start request');
      return;
    }

    // Check if sync is already active in database
    const [currentStatus] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tvmaze'));

    if (currentStatus?.isActive) {
      console.log('TVmaze sync already active in database, ignoring start request');
      return;
    }

    await db
      .update(importStatus)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(importStatus.source, 'tvmaze'));

    // Start sync in background
    this.syncAllShows().catch(console.error);
  }

  private async performHealthCheck(importStatusRecord: ImportStatus): Promise<void> {
    console.log('Performing sync health check...');
    
    // Get actual count from database
    const [actualCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(content)
      .where(and(eq(content.source, 'tvmaze'), eq(content.type, 'tv')));
    
    const trackedCount = importStatusRecord.totalImported || 0;
    const disparity = Math.abs(actualCount.count - trackedCount);
    const disparityPercent = trackedCount > 0 ? (disparity / trackedCount) * 100 : 100;
    
    console.log(`Health Check: Database=${actualCount.count}, Tracked=${trackedCount}, Disparity=${disparity} (${disparityPercent.toFixed(1)}%)`);
    
    // If disparity is > 10% or > 100 shows, auto-correct it
    if (disparityPercent > 10 || disparity > 100) {
      console.log(`🔧 Auto-correcting large disparity: ${trackedCount} → ${actualCount.count}`);
      
      await db
        .update(importStatus)
        .set({
          totalImported: actualCount.count,
          updatedAt: new Date()
        })
        .where(eq(importStatus.id, importStatusRecord.id));
      
      // Update our local record
      importStatusRecord.totalImported = actualCount.count;
      
      console.log('✅ Count disparity auto-corrected');
    } else {
      console.log('✅ Health check passed - counts are in sync');
    }
  }

  async resetImportStatus(): Promise<void> {
    console.log('Resetting TVmaze import status...');
    
    // Delete the import status record so it starts fresh
    await db
      .delete(importStatus)
      .where(eq(importStatus.source, 'tvmaze'));
    
    console.log('✅ TVmaze import status reset - next import will start from the beginning');
  }
}

export const tvmazeService = new TVMazeService();