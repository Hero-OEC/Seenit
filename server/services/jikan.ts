import { db } from "../db";
import { content, importStatus } from "@shared/schema";
import type { InsertContent } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

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

// Jikan Relations API types
interface JikanRelationEntry {
  mal_id: number;
  type: string; // "anime", "manga"
  name: string;
  url: string;
}

interface JikanRelationGroup {
  relation: string; // "Sequel", "Prequel", "Side story", "Alternative version", etc.
  entry: JikanRelationEntry[];
}

interface JikanRelationsResponse {
  data: JikanRelationGroup[];
}

// Series info for grouping seasons
export interface AnimeSeriesInfo {
  seriesKey: string;
  seriesRootSourceId: string;
  seasonNumber: number;
  seasonTitle: string | null;
}

export class JikanService {
  private baseUrl = 'https://api.jikan.moe/v4';
  private isSyncing = false;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 334; // ~333ms between requests (3 requests/second)
  
  // Memoization cache for relations data to avoid repeated API calls during imports
  private relationsCache = new Map<number, JikanRelationGroup[]>();
  private seriesInfoCache = new Map<number, AnimeSeriesInfo>();

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

  // Get episodes for an anime (single page)
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

  // Get ALL episodes for an anime (pagination helper)
  async getAllEpisodes(malId: number): Promise<ProcessedEpisode[]> {
    const allEpisodes: ProcessedEpisode[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await this.makeRequest<JikanResponse<JikanEpisode[]>>(`/anime/${malId}/episodes?page=${page}`);
        
        if (response.data && response.data.length > 0) {
          const episodes = response.data.map((episode, index) => ({
            id: episode.mal_id,
            episodeNumber: index + 1 + ((page - 1) * 100),
            title: episode.title,
            titleJapanese: episode.title_japanese,
            airdate: episode.aired,
            score: episode.score,
            filler: episode.filler,
            recap: episode.recap,
            synopsis: episode.synopsis,
            forumUrl: episode.forum_url
          }));
          
          allEpisodes.push(...episodes);
          
          // Check if we have more pages based on response pagination
          hasMore = response.pagination?.has_next_page || false;
          page++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`[Jikan] Failed to fetch episodes page ${page} for anime ${malId}:`, error);
        hasMore = false;
      }
    }

    console.log(`[Jikan] Fetched ${allEpisodes.length} episodes for anime ${malId}`);
    return allEpisodes;
  }

  // Paginated anime fetcher for different endpoints
  async getPaginatedAnime(endpoint: string, maxPages: number = 50): Promise<JikanAnime[]> {
    const allAnime: JikanAnime[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      try {
        // Ensure SFW parameter is included in all paginated requests
        let url: string;
        if (endpoint.includes('?')) {
          // Endpoint already has query params, add both page and sfw
          url = `${endpoint}&page=${page}&sfw=true`;
        } else {
          // No query params, add page and sfw
          url = `${endpoint}?page=${page}&sfw=true`;
        }
        const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(url);
        
        if (response.data && response.data.length > 0) {
          allAnime.push(...response.data);
          
          // Check pagination
          hasMore = response.pagination?.has_next_page || false;
          
          console.log(`[Jikan] Fetched page ${page}: ${response.data.length} anime (total: ${allAnime.length})`);
          page++;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error(`[Jikan] Failed to fetch page ${page} from ${endpoint}:`, error);
        hasMore = false;
      }
    }

    return allAnime;
  }

  // Search anime by query
  async searchAnime(query: string, page: number = 1): Promise<JikanAnime[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/anime?q=${encodedQuery}&page=${page}&limit=25&sfw=true`);
      return response.data || [];
    } catch (error) {
      console.error(`[Jikan] Failed to search anime with query "${query}":`, error);
      return [];
    }
  }

  // Get seasonal anime
  async getSeasonalAnime(year: number, season: string): Promise<JikanAnime[]> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/seasons/${year}/${season}?sfw=true`);
      return response.data || [];
    } catch (error) {
      console.error(`[Jikan] Failed to fetch seasonal anime for ${season} ${year}:`, error);
      return [];
    }
  }

  // Get current season anime
  async getCurrentSeasonAnime(): Promise<JikanAnime[]> {
    try {
      const response = await this.makeRequest<JikanResponse<JikanAnime[]>>(`/seasons/now?sfw=true`);
      return response.data || [];
    } catch (error) {
      console.error('[Jikan] Failed to fetch current season anime:', error);
      return [];
    }
  }

  // Get anime relations from Jikan API
  async getAnimeRelations(malId: number): Promise<JikanRelationGroup[]> {
    // Check cache first
    if (this.relationsCache.has(malId)) {
      console.log(`[Jikan] Relations cache hit for anime ${malId}`);
      return this.relationsCache.get(malId)!;
    }

    try {
      console.log(`[Jikan] Fetching relations for anime ${malId}`);
      const response = await this.makeRequest<JikanRelationsResponse>(`/anime/${malId}/relations`);
      
      // Cache the result
      this.relationsCache.set(malId, response.data);
      return response.data;
    } catch (error) {
      console.error(`[Jikan] Failed to fetch relations for anime ${malId}:`, error);
      // Cache empty result to avoid repeated failures
      this.relationsCache.set(malId, []);
      return [];
    }
  }

  // Get series info by traversing prequel chain to find root anime
  async getSeriesInfo(malId: number): Promise<AnimeSeriesInfo> {
    // Check cache first
    if (this.seriesInfoCache.has(malId)) {
      console.log(`[Jikan] Series info cache hit for anime ${malId}`);
      return this.seriesInfoCache.get(malId)!;
    }

    console.log(`[Jikan] Calculating series info for anime ${malId}`);
    
    try {
      // Traverse prequel chain to find root
      const visitedIds = new Set<number>();
      let currentId = malId;
      let seasonNumber = 1;
      
      // Build the chain by following prequels
      const chainFromCurrent: number[] = [];
      
      while (!visitedIds.has(currentId)) {
        visitedIds.add(currentId);
        chainFromCurrent.push(currentId);
        
        // Get relations for current anime
        const relations = await this.getAnimeRelations(currentId);
        
        // Look for prequel relation
        const prequelGroup = relations.find(group => group.relation.toLowerCase() === 'prequel');
        if (!prequelGroup || prequelGroup.entry.length === 0) {
          // No prequel found, this is the root
          break;
        }
        
        // Find anime prequel (not manga)
        const animePrequel = prequelGroup.entry.find(entry => entry.type === 'anime');
        if (!animePrequel) {
          // No anime prequel, this is the root
          break;
        }
        
        currentId = animePrequel.mal_id;
      }
      
      // The last currentId is the root
      const rootId = currentId;
      
      // Now calculate season number by position in chain
      // chainFromCurrent goes from target -> ... -> root, so reverse it
      const chainFromRoot = chainFromCurrent.reverse();
      const targetSeasonNumber = chainFromRoot.indexOf(malId) + 1;
      
      // Generate season title based on season number
      let seasonTitle: string | null = null;
      if (targetSeasonNumber > 1) {
        // Try to extract season info from the anime title itself
        const anime = await this.getAnimeById(malId);
        const title = anime?.title || '';
        
        // Common patterns for season titles
        if (title.includes('Final')) {
          seasonTitle = 'Final Season';
        } else if (title.includes('Season')) {
          const match = title.match(/Season\s+(\d+|[IVX]+)/i);
          if (match) {
            seasonTitle = `Season ${match[1]}`;
          } else {
            seasonTitle = `Season ${targetSeasonNumber}`;
          }
        } else if (title.match(/\b([IVX]+|[0-9]+)(st|nd|rd|th)?\s*(Season|Series|Part)/i)) {
          const match = title.match(/\b([IVX]+|[0-9]+)(st|nd|rd|th)?\s*(Season|Series|Part)/i);
          if (match) {
            seasonTitle = `${match[3]} ${match[1]}`;
          } else {
            seasonTitle = `Season ${targetSeasonNumber}`;
          }
        } else {
          // Generic season title
          seasonTitle = `Season ${targetSeasonNumber}`;
        }
      }
      
      const seriesInfo: AnimeSeriesInfo = {
        seriesKey: `jikan:series:${rootId}`,
        seriesRootSourceId: rootId.toString(),
        seasonNumber: targetSeasonNumber,
        seasonTitle
      };
      
      // Cache the result
      this.seriesInfoCache.set(malId, seriesInfo);
      
      console.log(`[Jikan] Series info for ${malId}: root=${rootId}, season=${targetSeasonNumber}, title="${seasonTitle}"`);
      return seriesInfo;
      
    } catch (error) {
      console.error(`[Jikan] Failed to calculate series info for anime ${malId}:`, error);
      
      // Fallback: treat as standalone anime
      const fallbackInfo: AnimeSeriesInfo = {
        seriesKey: `jikan:series:${malId}`,
        seriesRootSourceId: malId.toString(),
        seasonNumber: 1,
        seasonTitle: null
      };
      
      // Cache the fallback
      this.seriesInfoCache.set(malId, fallbackInfo);
      return fallbackInfo;
    }
  }

  // Convert Jikan anime to our content format
  private async convertToContent(anime: JikanAnime, includeAllEpisodes: boolean = false): Promise<InsertContent> {
    // NSFW Content Filtering - Block adult content from entering database
    
    // Check rating for explicit adult content
    const blockedRatings = ['Rx - Hentai', 'R+ - Mild Nudity'];
    if (anime.rating && blockedRatings.some(blocked => anime.rating?.includes(blocked))) {
      throw new Error(`[Jikan] NSFW content blocked: ${anime.title} (Rating: ${anime.rating})`);
    }
    
    // Check genres and explicit_genres for adult content
    const blockedGenres = ['Hentai', 'Ecchi', 'Adult', 'Erotica'];
    const allGenres = [
      ...(anime.genres?.map(g => g.name) || []),
      ...(anime.explicit_genres?.map(g => g.name) || [])
    ];
    
    for (const genre of allGenres) {
      if (blockedGenres.some(blocked => genre.toLowerCase().includes(blocked.toLowerCase()))) {
        throw new Error(`[Jikan] NSFW content blocked: ${anime.title} (Genre: ${genre})`);
      }
    }
    
    console.log(`[Jikan] Content validation passed for: ${anime.title} (Rating: ${anime.rating || 'None'})`);
    
    // Get episodes - either single page or all episodes based on flag
    const episodes = includeAllEpisodes ? await this.getAllEpisodes(anime.mal_id) : await this.getAnimeEpisodes(anime.mal_id);
    
    // Get series information for season grouping
    const seriesInfo = await this.getSeriesInfo(anime.mal_id);
    
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
      
      // Series grouping fields
      seriesKey: seriesInfo.seriesKey,
      seriesRootSourceId: seriesInfo.seriesRootSourceId,
      seasonNumber: seriesInfo.seasonNumber,
      seasonTitle: seriesInfo.seasonTitle,
      
      episodeData: { episodes }, // Store episodes in expected structure for routes
    };
  }

  // Start comprehensive multi-phase import process
  async startImport(): Promise<void> {
    if (this.isSyncing) {
      console.log('[Jikan] Import already running');
      return;
    }

    this.isSyncing = true;
    console.log('[Jikan] Starting comprehensive Jikan import...');

    let importedCount = 0;
    let updatedCount = 0;
    let errorMessages: string[] = [];

    try {
      // Get or create import status
      const [existingStatus] = await db
        .select()
        .from(importStatus)
        .where(eq(importStatus.source, 'jikan'))
        .limit(1);

      // Initialize or resume cursor
      let cursor = existingStatus?.cursor as any || { phase: 1, step: 'start' };

      await this.updateImportStatus({
        isActive: true,
        totalImported: existingStatus?.totalImported || 0,
        errors: [],
        cursor,
        phase1Progress: 'Starting comprehensive import...'
      });

      // PHASE 1: Update existing active anime
      if (cursor.phase <= 1) {
        console.log('[Jikan] Phase 1: Updating existing active anime...');
        const result = await this.updateExistingActiveAnime();
        updatedCount += result.updated;
        errorMessages.push(...result.errors);
        
        cursor = { phase: 2, step: 'start', year: new Date().getFullYear() };
        await this.updateImportStatus({
          cursor,
          phase1Progress: `Phase 1 Complete: ${result.updated} anime updated`,
          phase2Progress: 'Starting seasonal backfill...'
        });
      }

      // PHASE 2: Seasonal backfill
      if (cursor.phase <= 2) {
        console.log('[Jikan] Phase 2: Starting seasonal backfill...');
        const result = await this.importSeasonalAnime(cursor);
        importedCount += result.imported;
        errorMessages.push(...result.errors);
        
        cursor = { phase: 3, step: 'start', page: 1 };
        await this.updateImportStatus({
          cursor,
          totalImported: (existingStatus?.totalImported || 0) + result.imported,
          phase2Progress: `Phase 2 Complete: ${result.imported} anime imported from seasons`,
          phase3Progress: 'Starting top anime import...'
        });
      }

      // PHASE 3: Top anime lists
      if (cursor.phase <= 3) {
        console.log('[Jikan] Phase 3: Importing top anime...');
        const result = await this.importTopAnime(cursor);
        importedCount += result.imported;
        errorMessages.push(...result.errors);
        
        cursor = { phase: 4, step: 'start', page: 0, offset: 0 };
        await this.updateImportStatus({
          cursor,
          totalImported: (existingStatus?.totalImported || 0) + importedCount,
          phase3Progress: `Phase 3 Complete: ${result.imported} top anime imported`,
          phase4Progress: 'Starting series enrichment backfill...'
        });
      }

      // PHASE 4: Series enrichment backfill (backfill existing anime with series info)
      if (cursor.phase <= 4) {
        console.log('[Jikan] Phase 4: Backfilling existing anime with series info...');
        const result = await this.backfillSeriesInfo(cursor);
        updatedCount += result.updated;
        errorMessages.push(...result.errors);
        
        cursor = { phase: 5, step: 'complete' };
        await this.updateImportStatus({
          cursor,
          phase4Progress: `Phase 4 Complete: ${result.updated} anime enriched with series info`
        });
      }

      // Complete import
      await this.updateImportStatus({
        isActive: false,
        cursor: { phase: 'complete' },
        lastSyncAt: new Date()
      });

      console.log(`[Jikan] Import complete: ${importedCount} imported, ${updatedCount} updated, ${errorMessages.length} errors`);

    } catch (error) {
      console.error('[Jikan] Import failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateImportStatus({
        isActive: false,
        errors: [errorMessage],
        phase1Progress: `Import failed: ${errorMessage}`
      });
    } finally {
      this.isSyncing = false;
    }
  }

  // PHASE 1: Update existing active anime
  private async updateExistingActiveAnime(): Promise<{ updated: number; errors: string[] }> {
    console.log('[Jikan] Checking existing anime for updates...');
    
    // Get all existing anime that are airing or upcoming
    const existingActiveAnime = await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.source, 'jikan'),
          or(
            eq(content.status, 'airing'),
            eq(content.status, 'upcoming')
          )
        )
      );

    console.log(`[Jikan] Found ${existingActiveAnime.length} existing airing/upcoming anime to update`);

    let updated = 0;
    const errors: string[] = [];

    for (const anime of existingActiveAnime) {
      try {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'jikan'))
          .limit(1);
        
        if (!currentStatus?.isActive) {
          console.log('[Jikan] Sync paused during existing anime updates');
          break;
        }

        // Fetch latest data for this anime
        const jikanId = parseInt(anime.sourceId);
        const detailedAnime = await this.getAnimeById(jikanId);
        
        if (detailedAnime) {
          const mappedContent = await this.convertToContent(detailedAnime, true); // Include all episodes

          // Update existing anime with latest data
          await db
            .update(content)
            .set({
              ...mappedContent,
              lastUpdated: new Date()
            })
            .where(eq(content.id, anime.id));
          
          updated++;
          
          if (updated % 5 === 0) {
            console.log(`[Jikan] Updated ${updated}/${existingActiveAnime.length} existing anime`);
            
            // Update status with Phase 1 progress
            await this.updateImportStatus({
              phase1Progress: `Updating: ${updated}/${existingActiveAnime.length} (${anime.title})`
            });
          }
        }
        
      } catch (error) {
        const errorMsg = `Error updating existing anime ${anime.title} (ID: ${anime.sourceId}): ${error}`;
        console.error(`[Jikan] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`[Jikan] Phase 1 complete: ${updated} anime updated`);
    return { updated, errors };
  }

  // PHASE 2: Import seasonal anime
  private async importSeasonalAnime(cursor: any): Promise<{ imported: number; errors: string[] }> {
    const currentYear = new Date().getFullYear();
    const seasons = ['winter', 'spring', 'summer', 'fall'];
    let imported = 0;
    const errors: string[] = [];
    
    const startYear = cursor.year || currentYear;
    const startSeason = cursor.season || 0;
    
    console.log(`[Jikan] Phase 2: Starting seasonal import from ${startYear}`);
    
    // Import anime from current year back to 2020 (reasonable range)
    for (let year = startYear; year >= 2020; year--) {
      const seasonStart = year === startYear ? startSeason : 0;
      
      for (let seasonIdx = seasonStart; seasonIdx < seasons.length; seasonIdx++) {
        const season = seasons[seasonIdx];
        
        try {
          console.log(`[Jikan] Importing ${season} ${year} anime...`);
          
          const seasonalAnime = await this.getPaginatedAnime(`/seasons/${year}/${season}`, 10); // Limit to 10 pages per season
          
          for (const anime of seasonalAnime) {
            // Check if sync is still active
            const [currentStatus] = await db
              .select()
              .from(importStatus)
              .where(eq(importStatus.source, 'jikan'))
              .limit(1);
            
            if (!currentStatus?.isActive) {
              console.log('[Jikan] Sync paused during seasonal import');
              return { imported, errors };
            }

            try {
              // Check if already exists (scoped by source)
              const [existing] = await db
                .select()
                .from(content)
                .where(
                  and(
                    eq(content.source, 'jikan'),
                    eq(content.sourceId, anime.mal_id.toString())
                  )
                )
                .limit(1);

              if (!existing) {
                const contentData = await this.convertToContent(anime);
                await db.insert(content).values(contentData);
                imported++;
                
                if (imported % 10 === 0) {
                  console.log(`[Jikan] Seasonal import progress: ${imported} anime imported`);
                  await this.updateImportStatus({
                    phase2Progress: `Importing ${season} ${year}: ${imported} total imported`,
                    cursor: { phase: 2, year, season: seasonIdx }
                  });
                }
              }
            } catch (error) {
              const errorMsg = `Error importing ${anime.title}: ${error}`;
              errors.push(errorMsg);
              console.error(`[Jikan] ${errorMsg}`);
            }
          }
          
        } catch (error) {
          const errorMsg = `Error importing ${season} ${year}: ${error}`;
          errors.push(errorMsg);
          console.error(`[Jikan] ${errorMsg}`);
        }
      }
    }
    
    console.log(`[Jikan] Phase 2 complete: ${imported} seasonal anime imported`);
    return { imported, errors };
  }

  // PHASE 3: Import top anime
  private async importTopAnime(cursor: any): Promise<{ imported: number; errors: string[] }> {
    let imported = 0;
    const errors: string[] = [];
    
    console.log('[Jikan] Phase 3: Starting top anime import...');
    
    try {
      // Get top anime with pagination (limit to 5 pages = ~125 top anime)
      const topAnime = await this.getPaginatedAnime('/top/anime', 5);
      
      for (const anime of topAnime) {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'jikan'))
          .limit(1);
        
        if (!currentStatus?.isActive) {
          console.log('[Jikan] Sync paused during top anime import');
          break;
        }

        try {
          // Check if already exists (scoped by source)
          const [existing] = await db
            .select()
            .from(content)
            .where(
              and(
                eq(content.source, 'jikan'),
                eq(content.sourceId, anime.mal_id.toString())
              )
            )
            .limit(1);

          if (!existing) {
            const contentData = await this.convertToContent(anime);
            await db.insert(content).values(contentData);
            imported++;
            
            if (imported % 10 === 0) {
              console.log(`[Jikan] Top anime import progress: ${imported} imported`);
              await this.updateImportStatus({
                phase3Progress: `Top anime import: ${imported} imported`
              });
            }
          }
        } catch (error) {
          const errorMsg = `Error importing top anime ${anime.title}: ${error}`;
          errors.push(errorMsg);
          console.error(`[Jikan] ${errorMsg}`);
        }
      }
      
    } catch (error) {
      const errorMsg = `Error importing top anime: ${error}`;
      errors.push(errorMsg);
      console.error(`[Jikan] ${errorMsg}`);
    }
    
    console.log(`[Jikan] Phase 3 complete: ${imported} top anime imported`);
    return { imported, errors };
  }

  // PHASE 4: Backfill existing anime with series info
  private async backfillSeriesInfo(cursor: any): Promise<{ updated: number; errors: string[] }> {
    console.log('[Jikan] Starting series info backfill for existing anime...');
    
    const BATCH_SIZE = 50; // Process in smaller batches to manage rate limits
    let updated = 0;
    const errors: string[] = [];
    let offset = cursor.offset || 0;

    try {
      while (true) {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'jikan'))
          .limit(1);
        
        if (!currentStatus?.isActive) {
          console.log('[Jikan] Sync paused during series info backfill');
          break;
        }

        // Get existing anime that need series info enrichment (missing seriesKey)
        const existingAnime = await db
          .select()
          .from(content)
          .where(
            and(
              eq(content.source, 'jikan'),
              eq(content.type, 'anime'),
              // Only get anime that don't have series info yet
              or(
                eq(content.seriesKey, null),
                eq(content.seriesKey, '')
              )
            )
          )
          .limit(BATCH_SIZE)
          .offset(offset);

        if (existingAnime.length === 0) {
          console.log('[Jikan] No more anime to process for series enrichment');
          break;
        }

        console.log(`[Jikan] Processing batch: ${existingAnime.length} anime (offset: ${offset})`);

        // Process each anime in the batch
        for (const anime of existingAnime) {
          try {
            const malId = parseInt(anime.sourceId);
            if (isNaN(malId)) {
              console.warn(`[Jikan] Invalid MAL ID for anime: ${anime.sourceId}`);
              continue;
            }

            // Get series info for this anime
            const seriesInfo = await this.getSeriesInfo(malId);
            
            // Update the anime record with series info
            await db
              .update(content)
              .set({
                seriesKey: seriesInfo.seriesKey,
                seriesRootSourceId: seriesInfo.seriesRootSourceId,
                seasonNumber: seriesInfo.seasonNumber,
                seasonTitle: seriesInfo.seasonTitle,
                lastUpdated: new Date()
              })
              .where(eq(content.id, anime.id));

            updated++;
            
            console.log(`[Jikan] Enriched ${anime.title} with series info: ${seriesInfo.seriesKey} (Season ${seriesInfo.seasonNumber})`);

          } catch (error) {
            const errorMsg = `Failed to enrich anime ${anime.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(`[Jikan] ${errorMsg}`);
            errors.push(errorMsg);
          }
        }

        // Update progress and cursor
        offset += BATCH_SIZE;
        await this.updateImportStatus({
          cursor: { phase: 4, step: 'backfill', offset },
          phase4Progress: `Processed ${updated} anime for series enrichment (offset: ${offset})`
        });

        // If we got less than BATCH_SIZE, we've processed all available anime
        if (existingAnime.length < BATCH_SIZE) {
          break;
        }
      }

      console.log(`[Jikan] Series enrichment backfill complete: ${updated} anime updated`);
      return { updated, errors };

    } catch (error) {
      const errorMsg = `Series enrichment backfill failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Jikan] ${errorMsg}`);
      errors.push(errorMsg);
      return { updated, errors };
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
    phase4Progress: string;
    errors: string[];
    cursor: any;
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
        .set({...updates, updatedAt: new Date()})
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