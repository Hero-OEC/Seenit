import { db } from "../db";
import { content, importStatus, type Content, type InsertContent, type ImportStatus } from "@shared/schema";
import { eq, and } from "drizzle-orm";

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

  private mapTVMazeToContent(show: TVMazeShow): InsertContent {
    const network = show.network?.name || show.webChannel?.name;
    const episodes = show._embedded?.episodes || [];
    const totalEpisodes = episodes.length;
    
    // Calculate total seasons
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

    return {
      title: show.name,
      type: 'tv',
      source: 'tvmaze',
      sourceId: show.id.toString(),
      overview: show.summary ? this.stripHtmlTags(show.summary) : null,
      genres: show.genres || [],
      year: show.premiered ? new Date(show.premiered).getFullYear() : null,
      endYear: show.ended ? new Date(show.ended).getFullYear() : null,
      rating: show.rating?.average || null,
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
      voteCount: null,
      
      // Not applicable
      imdbRating: null,
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
          break;
        }

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
            const mappedContent = this.mapTVMazeToContent(detailedShow);

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
            }
          } catch (error) {
            const errorMsg = `Error processing show ${show.name} (ID: ${show.id}): ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Update progress
        await db
          .update(importStatus)
          .set({
            currentPage: page + 1,
            totalImported: imported + updated,
            lastSyncAt: new Date(),
            errors: errors.slice(-10) // Keep last 10 errors
          })
          .where(eq(importStatus.id, importStatusRecord.id));

        page++;

        // Small delay between pages to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark as complete
      await db
        .update(importStatus)
        .set({
          isActive: false,
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

  async pauseSync(): Promise<void> {
    await db
      .update(importStatus)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(importStatus.source, 'tvmaze'));
  }

  async resumeSync(): Promise<void> {
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
}

export const tvmazeService = new TVMazeService();