import { db } from "../db";
import { content, importStatus } from "@shared/schema";
import type { InsertContent } from "@shared/schema";
import { eq } from "drizzle-orm";

// Jikan API types based on JSON response structure
interface JikanAnime {
  mal_id: number;
  url: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp?: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer?: {
    youtube_id: string;
    url: string;
  };
  approved: boolean;
  titles: Array<{
    type: string; // "Default", "Synonym", "Japanese", "English"
    title: string;
  }>;
  title: string;
  title_english?: string;
  title_japanese?: string;
  title_synonyms?: string[];
  type: string; // "TV", "Movie", "OVA", "Special", "ONA", "Music"
  source: string; // "Manga", "Light novel", "Original", etc.
  episodes?: number;
  status: string; // "Finished Airing", "Currently Airing", "Not yet aired"
  airing: boolean;
  aired: {
    from?: string;
    to?: string;
    prop: {
      from: {
        day?: number;
        month?: number;
        year?: number;
      };
      to: {
        day?: number;
        month?: number;
        year?: number;
      };
    };
    string?: string;
  };
  duration?: string;
  rating?: string; // "PG-13", "R", etc.
  score?: number; // MAL rating
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  season?: string; // "spring", "summer", "fall", "winter"
  year?: number;
  broadcast?: {
    day?: string;
    time?: string;
    timezone?: string;
    string?: string;
  };
  producers?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  licensors?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  studios?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  genres?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  explicit_genres?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  themes?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
  demographics?: Array<{
    mal_id: number;
    type: string;
    name: string;
    url: string;
  }>;
}

interface JikanEpisode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  score?: number;
  filler: boolean;
  recap: boolean;
  forum_url?: string;
  synopsis?: string;
}

interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

// Processed episode data for our schema
interface ProcessedEpisode {
  id: number;
  episodeNumber: number;
  title: string;
  titleJapanese?: string;
  airdate?: string;
  score?: number;
  filler: boolean;
  recap: boolean;
  synopsis?: string;
  forumUrl?: string;
}

export class JikanService {
  private baseUrl = 'https://api.jikan.moe/v4';
  private isSyncing = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 1000; // 1 second between requests (60/minute)

  constructor() {
    console.log('[Jikan] Service initialized');
  }

  // Rate limiting to respect Jikan API limits
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`[Jikan] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Make request to Jikan API
  private async makeRequest<T>(endpoint: string): Promise<T> {
    await this.waitForRateLimit();
    
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[Jikan] Making request: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Seenit/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Jikan API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Jikan] Request failed:', error);
      throw error;
    }
  }

  // Get anime details by MAL ID
  async getAnimeById(malId: number): Promise<JikanAnime | null> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanAnime>>(`/anime/${malId}`);
      return response.data;
    } catch (error) {
      console.error(`[Jikan] Failed to fetch anime ${malId}:`, error);
      return null;
    }
  }

  // Get episodes for an anime
  async getAnimeEpisodes(malId: number, page: number = 1): Promise<ProcessedEpisode[]> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanEpisode[]>>(`/anime/${malId}/episodes?page=${page}`);
      
      return response.data.map((episode, index) => ({
        id: episode.mal_id,
        episodeNumber: index + 1 + ((page - 1) * 100), // Sequential episode numbering
        title: episode.title,
        titleJapanese: episode.title_japanese,
        airdate: episode.aired, // Map 'aired' to 'airdate' to match route expectations
        score: episode.score,
        filler: episode.filler,
        recap: episode.recap,
        synopsis: episode.synopsis,
        forumUrl: episode.forum_url
      }));
    } catch (error) {
      console.error(`[Jikan] Failed to fetch episodes for anime ${malId}:`, error);
      return [];
    }
  }

  // Search anime by query
  async searchAnime(query: string, page: number = 1): Promise<JikanAnime[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/anime?q=${encodedQuery}&page=${page}&limit=25`);
      return response.data || [];
    } catch (error) {
      console.error(`[Jikan] Failed to search anime with query "${query}":`, error);
      return [];
    }
  }

  // Get seasonal anime
  async getSeasonalAnime(year: number, season: string): Promise<JikanAnime[]> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/seasons/${year}/${season}`);
      return response.data || [];
    } catch (error) {
      console.error(`[Jikan] Failed to fetch seasonal anime for ${season} ${year}:`, error);
      return [];
    }
  }

  // Get current season anime
  async getCurrentSeasonAnime(): Promise<JikanAnime[]> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/seasons/now`);
      return response.data || [];
    } catch (error) {
      console.error('[Jikan] Failed to fetch current season anime:', error);
      return [];
    }
  }

  // Convert Jikan anime to our content format
  private async convertToContent(anime: JikanAnime): Promise<InsertContent> {
    // Get all episodes for detailed episode data
    const episodes = await this.getAnimeEpisodes(anime.mal_id);
    
    // Extract studio name
    const studioName = anime.studios?.[0]?.name || null;
    
    // Extract genres
    const genres = anime.genres?.map(g => g.name) || [];
    
    // Determine status
    let status = 'unknown';
    switch (anime.status) {
      case 'Finished Airing':
        status = 'completed';
        break;
      case 'Currently Airing':
        status = 'airing';
        break;
      case 'Not yet aired':
        status = 'upcoming';
        break;
    }

    return {
      title: anime.title,
      type: 'anime',
      source: 'jikan',
      sourceId: anime.mal_id.toString(),
      overview: anime.synopsis,
      genres,
      year: anime.year,
      rating: anime.score,
      poster: anime.images.jpg.image_url,
      backdrop: anime.images.jpg.large_image_url,
      status,
      malRating: anime.score,
      episodes: anime.episodes,
      studio: studioName,
      sourceMaterial: anime.source,
      episodeData: { episodes }, // Store episodes in expected structure for routes
    };
  }

  // Start import process
  async startImport(): Promise<void> {
    if (this.isSyncing) {
      console.log('[Jikan] Import already running');
      return;
    }

    this.isSyncing = true;
    console.log('[Jikan] Starting Jikan import...');

    try {
      // Update import status
      await this.updateImportStatus({
        isActive: true,
        currentPage: 1,
        totalImported: 0,
        errors: [],
        phase1Progress: 'Starting Jikan import...'
      });

      // Start with current season anime
      const currentSeasonAnime = await this.getCurrentSeasonAnime();
      let importedCount = 0;
      let errorMessages: string[] = [];

      for (const anime of currentSeasonAnime.slice(0, 50)) { // Limit to first 50 for testing
        try {
          await this.waitForRateLimit();
          
          console.log(`[Jikan] Processing anime: ${anime.title} (${anime.mal_id})`);
          
          // Check if already exists
          const existing = await db
            .select()
            .from(content)
            .where(eq(content.sourceId, anime.mal_id.toString()))
            .limit(1);

          if (existing.length === 0) {
            const contentData = await this.convertToContent(anime);
            await db.insert(content).values(contentData);
            importedCount++;
            console.log(`[Jikan] Imported: ${anime.title}`);
          } else {
            console.log(`[Jikan] Skipped (exists): ${anime.title}`);
          }

          // Update progress
          await this.updateImportStatus({
            isActive: true,
            currentPage: 1,
            totalImported: importedCount,
            errors: errorMessages,
            phase1Progress: `Processing: ${anime.title}`
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errorMessages.push(errorMessage);
          console.error(`[Jikan] Error processing ${anime.title}:`, error);
        }
      }

      // Complete import
      await this.updateImportStatus({
        isActive: false,
        currentPage: 1,
        totalImported: importedCount,
        errors: errorMessages,
        phase1Progress: `Import complete: ${importedCount} imported, ${errorMessages.length} errors`,
        lastSyncAt: new Date()
      });

      console.log(`[Jikan] Import complete: ${importedCount} imported, ${errorMessages.length} errors`);

    } catch (error) {
      console.error('[Jikan] Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateImportStatus({
        isActive: false,
        currentPage: 1,
        totalImported: 0,
        errors: [errorMessage],
        phase1Progress: `Import failed: ${errorMessage}`
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // Pause import
  async pauseImport(): Promise<void> {
    this.isSyncing = false;
    await this.updateImportStatus({
      isActive: false,
      phase1Progress: 'Import paused by user'
    });
    console.log('[Jikan] Import paused');
  }

  // Update import status
  private async updateImportStatus(updates: Partial<{
    isActive: boolean;
    currentPage: number;
    totalImported: number;
    totalAvailable: number;
    phase1Progress: string;
    phase2Progress: string;
    phase3Progress: string;
    errors: string[];
    lastSyncAt: Date | null;
  }>): Promise<void> {
    const existing = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'jikan'))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(importStatus).values({
        source: 'jikan',
        ...updates
      });
    } else {
      await db
        .update(importStatus)
        .set(updates)
        .where(eq(importStatus.source, 'jikan'));
    }
  }

  // Get import status
  async getImportStatus() {
    const status = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'jikan'))
      .limit(1);

    return status[0] || null;
  }

  // Get content count
  async getContentCount(): Promise<number> {
    const result = await db
      .select({ count: content.id })
      .from(content)
      .where(eq(content.source, 'jikan'));

    return result.length;
  }

  // Get sample content
  async getSampleContent(limit: number = 20) {
    return await db
      .select()
      .from(content)
      .where(eq(content.source, 'jikan'))
      .limit(limit);
  }

  // Delete all Jikan data
  async deleteAllData(): Promise<void> {
    console.log('[Jikan] Deleting all Jikan data...');
    
    await db
      .delete(content)
      .where(eq(content.source, 'jikan'));

    await db
      .delete(importStatus)
      .where(eq(importStatus.source, 'jikan'));

    console.log('[Jikan] All Jikan data deleted');
  }
}

// Export singleton instance
export const jikanService = new JikanService();