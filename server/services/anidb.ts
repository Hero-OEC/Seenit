import { db } from "../db";
import { content, importStatus } from "@shared/schema";
import type { InsertContent } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { XMLParser } from "fast-xml-parser";

// AniDB API types based on XML response structure
interface AniDBEpisode {
  id: string;
  type: string; // "1" = regular, "2" = special, "3" = credit, "4" = trailer, "5" = parody, "6" = other
  epno: {
    type: string;
    "#text": string;
  } | string;
  length: string | number;
  airdate?: string;
  rating?: {
    votes: string;
    "#text": string;
  };
  title: AniDBTitle | AniDBTitle[];
}

interface AniDBTitle {
  "xml:lang": string;
  "#text": string;
}

interface AniDBAnime {
  id: string;
  type: string;
  episodecount: string;
  startdate?: string;
  enddate?: string;
  titles?: {
    title: AniDBTitle | AniDBTitle[];
  };
  episodes?: {
    episode: AniDBEpisode | AniDBEpisode[];
  };
  ratings?: {
    permanent?: {
      "#text": string;
      count: string;
    };
    temporary?: {
      "#text": string;
      count: string;
    };
  };
  picture?: string;
  categories?: {
    category: any | any[];
  };
  tags?: {
    tag: any | any[];
  };
  creators?: {
    name: any | any[];
  };
  description?: string;
}

interface AniDBResponse {
  anime: AniDBAnime;
}

// Episode data structure for our schema
interface ProcessedEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  titleJapanese?: string;
  length?: number;
  airdate?: string; // Fixed: use airdate to match schedule route expectations
  rating?: number;
  type: 'regular' | 'special' | 'credit' | 'trailer' | 'parody' | 'other';
}

export class AniDBService {
  private baseUrl = 'http://api.anidb.net:9001/httpapi';
  private isSyncing = false;
  private xmlParser: XMLParser;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_MS = 2000; // 2 seconds between requests

  constructor() {
    // Configure XML parser for AniDB response format
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "#text",
      parseAttributeValue: true,
      trimValues: true
    });
  }

  // Rate limiting to prevent bans
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`[AniDB] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Make authenticated request to AniDB API
  private async makeRequest(params: Record<string, string>): Promise<string> {
    await this.waitForRateLimit();

    const clientName = process.env.ANIDB_CLIENT_NAME;
    const clientVersion = process.env.ANIDB_CLIENT_VERSION;
    const username = process.env.ANIDB_USERNAME;
    const password = process.env.ANIDB_PASSWORD;

    if (!clientName || !clientVersion || !username || !password) {
      throw new Error('AniDB credentials not configured');
    }

    const requestParams = new URLSearchParams({
      client: clientName,
      clientver: clientVersion,
      protover: '1',
      user: username,
      pass: password,
      ...params
    });

    const url = `${this.baseUrl}?${requestParams.toString()}`;
    
    console.log(`[AniDB] Making request: ${params.request} (AID: ${params.aid || 'N/A'})`);
    console.log(`[AniDB] Request URL (credentials redacted): ${url.replace(/user=[^&]*/, 'user=[REDACTED]').replace(/pass=[^&]*/, 'pass=[REDACTED]')}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': `${clientName}/${clientVersion}`,
          'Accept': 'application/xml, text/xml',
          'Accept-Encoding': 'gzip, deflate'
        }
      });

      if (!response.ok) {
        throw new Error(`AniDB API error: ${response.status} ${response.statusText}`);
      }

      const xmlData = await response.text();
      console.log(`[AniDB] Response length: ${xmlData.length} characters`);
      console.log(`[AniDB] Response preview: ${xmlData.substring(0, 200)}...`);
      
      // Check for API errors in XML response
      if (xmlData.includes('<error>') || xmlData.includes('BANNED') || xmlData.includes('ACCESS DENIED')) {
        // Redact credentials from logs for security
        const safeError = xmlData.replace(new RegExp(username, 'g'), '[REDACTED_USER]').replace(new RegExp(password, 'g'), '[REDACTED_PASS]');
        console.error('[AniDB] API Error Response:', safeError);
        throw new Error(`AniDB API returned error: ${safeError.substring(0, 200)}...`);
      }

      return xmlData;
    } catch (error) {
      // Ensure no credentials leak in error logs
      const errorMsg = error instanceof Error ? error.message.replace(new RegExp(username, 'g'), '[REDACTED_USER]').replace(new RegExp(password, 'g'), '[REDACTED_PASS]') : 'Unknown error';
      console.error('[AniDB] Request failed:', errorMsg);
      console.error('[AniDB] Original error:', error);
      throw new Error(errorMsg);
    }
  }

  // Get anime details by AniDB ID (AID)
  async getAnimeByAid(aid: string): Promise<AniDBAnime | null> {
    try {
      const xmlData = await this.makeRequest({
        request: 'anime',
        aid: aid
      });

      const parsed = this.xmlParser.parse(xmlData);
      
      if (parsed.anime) {
        return parsed.anime as AniDBAnime;
      }

      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[AniDB] Failed to fetch anime ${aid}:`, errorMessage);
      console.error(`[AniDB] Full error details:`, error);
      return null;
    }
  }

  // Process episode data from AniDB format
  private processEpisodes(episodes: AniDBEpisode | AniDBEpisode[]): ProcessedEpisode[] {
    const episodeArray = Array.isArray(episodes) ? episodes : [episodes];
    const processedEpisodes: ProcessedEpisode[] = [];

    for (const episode of episodeArray) {
      try {
        // Extract episode number
        let episodeNumber: number;
        if (typeof episode.epno === 'string') {
          episodeNumber = parseInt(episode.epno) || 0;
        } else {
          episodeNumber = parseInt(episode.epno["#text"]) || 0;
        }

        // Get episode type
        const typeMap: Record<string, ProcessedEpisode['type']> = {
          '1': 'regular',
          '2': 'special',
          '3': 'credit',
          '4': 'trailer',
          '5': 'parody',
          '6': 'other'
        };
        const episodeType = typeMap[episode.type] || 'other';

        // Extract titles (English and Japanese)
        let title = `Episode ${episodeNumber}`;
        let titleJapanese: string | undefined;

        if (episode.title) {
          const titles = Array.isArray(episode.title) ? episode.title : [episode.title];
          
          for (const titleObj of titles) {
            if (titleObj["xml:lang"] === 'en') {
              title = titleObj["#text"];
            } else if (titleObj["xml:lang"] === 'ja') {
              titleJapanese = titleObj["#text"];
            }
          }
        }

        // Extract other metadata
        const length = typeof episode.length === 'number' ? episode.length : parseInt(episode.length?.toString() || '0') || undefined;
        const rating = episode.rating ? parseFloat(episode.rating["#text"]) : undefined;

        processedEpisodes.push({
          id: episode.id,
          episodeNumber,
          title,
          titleJapanese,
          length,
          airdate: episode.airdate, // Fixed: use airdate consistently 
          rating,
          type: episodeType
        });

      } catch (error) {
        console.warn(`[AniDB] Failed to process episode:`, error, episode);
      }
    }

    // Sort episodes by episode number
    return processedEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  // Extract preferred title from AniDB titles
  private extractTitle(titles: { title: AniDBTitle | AniDBTitle[] } | undefined): string {
    if (!titles?.title) return 'Unknown Title';

    const titleArray = Array.isArray(titles.title) ? titles.title : [titles.title];
    
    // Prefer English, then Romaji, then Japanese
    const englishTitle = titleArray.find(t => t["xml:lang"] === 'en');
    if (englishTitle) return englishTitle["#text"];

    const romajiTitle = titleArray.find(t => t["xml:lang"] === 'x-jat');
    if (romajiTitle) return romajiTitle["#text"];

    const japaneseTitle = titleArray.find(t => t["xml:lang"] === 'ja');
    if (japaneseTitle) return japaneseTitle["#text"];

    // Fallback to first available title
    return titleArray[0]?.["#text"] || 'Unknown Title';
  }

  // Extract genres from categories and tags
  private extractGenres(anime: AniDBAnime): string[] {
    const genres: string[] = [];

    // Extract from categories
    if (anime.categories?.category) {
      const categories = Array.isArray(anime.categories.category) ? anime.categories.category : [anime.categories.category];
      for (const cat of categories) {
        if (cat.name && typeof cat.name === 'string') {
          genres.push(cat.name);
        }
      }
    }

    // Extract from tags (limit to avoid too many)
    if (anime.tags?.tag) {
      const tags = Array.isArray(anime.tags.tag) ? anime.tags.tag : [anime.tags.tag];
      for (const tag of tags.slice(0, 5)) { // Limit to 5 most relevant tags
        if (tag.name && typeof tag.name === 'string') {
          genres.push(tag.name);
        }
      }
    }

    return Array.from(new Set(genres)); // Remove duplicates
  }

  // Map AniDB data to our content schema
  private mapAniDBToContent(anime: AniDBAnime): InsertContent {
    const title = this.extractTitle(anime.titles);
    
    // Extract year from start date
    const startYear = anime.startdate ? parseInt(anime.startdate.substring(0, 4)) : null;
    const endYear = anime.enddate ? parseInt(anime.enddate.substring(0, 4)) : null;

    // Process episodes
    let episodeData: { episodes: ProcessedEpisode[] } | null = null;
    let totalEpisodes = 0;

    if (anime.episodes?.episode) {
      const processedEpisodes = this.processEpisodes(anime.episodes.episode);
      episodeData = { episodes: processedEpisodes };
      
      // Count regular episodes for totalEpisodes
      totalEpisodes = processedEpisodes.filter(ep => ep.type === 'regular').length;
    }

    // Extract rating
    let rating: number | null = null;
    if (anime.ratings?.permanent) {
      rating = parseFloat(anime.ratings.permanent["#text"]) / 100; // Convert to 0-10 scale
    }

    // Extract genres
    const genres = this.extractGenres(anime);

    // Determine status based on dates and episode count
    let status = 'completed';
    const now = new Date();
    const endDate = anime.enddate ? new Date(anime.enddate) : null;
    
    if (!endDate || endDate > now) {
      status = 'airing';
    }

    return {
      title,
      type: 'anime',
      source: 'anidb',
      sourceId: anime.id,
      overview: anime.description || null,
      genres,
      year: startYear,
      endYear,
      rating,
      poster: anime.picture || null,
      backdrop: null, // AniDB doesn't provide backdrop images
      status,
      
      // Anime-specific fields
      episodes: totalEpisodes || parseInt(anime.episodecount) || null,
      season: startYear, // Use start year as season
      studio: null, // Extract from creators if needed
      sourceMaterial: null, // Would need additional mapping
      runtime: null, // Average episode length could be calculated
      
      // Episode data - comprehensive episode tracking from AniDB!
      episodeData,
      
      // Not used for anime
      totalSeasons: null,
      totalEpisodes,
      network: null,
      airTime: null,
      airDays: null,
      releaseDate: anime.startdate || null,
      
      // Additional metadata
      tags: [],
      popularity: null,
      voteCount: anime.ratings?.permanent?.count ? parseInt(anime.ratings.permanent.count) : null,
      
      // Rating fields
      imdbRating: null,
      rottenTomatoesRating: null,
      malRating: rating, // Use AniDB rating as MAL rating equivalent
      
      // Streaming (not available from AniDB)
      streamingPlatforms: null,
      affiliateLinks: null
    };
  }

  // Start AniDB import process
  async startImport(): Promise<{ imported: number; updated: number; errors: string[] }> {
    if (this.isSyncing) {
      throw new Error('AniDB import already in progress');
    }

    this.isSyncing = true;
    console.log('[AniDB] Starting AniDB import...');

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    try {
      // Get or create import status
      let [importStatusRecord] = await db
        .select()
        .from(importStatus)
        .where(eq(importStatus.source, 'anidb'));

      if (!importStatusRecord) {
        [importStatusRecord] = await db
          .insert(importStatus)
          .values({
            source: 'anidb',
            isActive: true,
            totalImported: 0,
            totalAvailable: 0,
            currentPage: 1
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
      }

      // For now, test with a few popular anime AIDs
      // In a full implementation, you'd use the anime titles dump to get all AIDs
      const testAids = ['1', '5', '6', '7', '8']; // Popular anime AIDs for testing

      for (const aid of testAids) {
        try {
          // Check if import is still active
          const [currentStatus] = await db
            .select()
            .from(importStatus)
            .where(eq(importStatus.source, 'anidb'));
          
          if (!currentStatus?.isActive) {
            console.log('[AniDB] Import paused by user');
            break;
          }

          console.log(`[AniDB] Processing anime AID: ${aid}`);

          const animeData = await this.getAnimeByAid(aid);
          if (!animeData) {
            errors.push(`Failed to fetch anime data for AID: ${aid}`);
            continue;
          }

          const contentData = this.mapAniDBToContent(animeData);

          // Check if already exists
          const [existingContent] = await db
            .select()
            .from(content)
            .where(and(
              eq(content.source, 'anidb'),
              eq(content.sourceId, aid)
            ));

          if (existingContent) {
            // Update existing
            await db
              .update(content)
              .set({
                ...contentData,
                lastUpdated: new Date()
              })
              .where(eq(content.id, existingContent.id));
            
            updated++;
            console.log(`[AniDB] Updated: ${contentData.title}`);
          } else {
            // Insert new
            await db
              .insert(content)
              .values(contentData);
            
            imported++;
            const episodeCount = contentData.episodeData && typeof contentData.episodeData === 'object' && 'episodes' in contentData.episodeData 
              ? (contentData.episodeData.episodes as ProcessedEpisode[]).length 
              : 0;
            console.log(`[AniDB] Imported: ${contentData.title} (${episodeCount} episodes)`);
          }

          // Update progress
          await db
            .update(importStatus)
            .set({
              totalImported: imported + updated,
              updatedAt: new Date()
            })
            .where(eq(importStatus.id, importStatusRecord.id));

        } catch (error) {
          const errorMsg = `Failed to process AID ${aid}: ${error}`;
          console.error(`[AniDB] ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Mark as complete
      await db
        .update(importStatus)
        .set({
          isActive: false,
          lastSyncAt: new Date(),
          totalImported: imported + updated,
          errors,
          updatedAt: new Date()
        })
        .where(eq(importStatus.id, importStatusRecord.id));

      console.log(`[AniDB] Import complete: ${imported} imported, ${updated} updated, ${errors.length} errors`);

    } catch (error) {
      console.error('[AniDB] Import failed:', error);
      errors.push(`Import failed: ${error}`);
    } finally {
      this.isSyncing = false;
    }

    return { imported, updated, errors };
  }

  // Pause AniDB import
  async pauseImport(): Promise<void> {
    console.log('[AniDB] Pausing import...');
    
    await db
      .update(importStatus)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(importStatus.source, 'anidb'));
  }

  // Get current import status
  async getImportStatus() {
    const [status] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'anidb'));

    return status || null;
  }

  // Get imported content count
  async getContentCount(): Promise<number> {
    const result = await db
      .select()
      .from(content)
      .where(eq(content.source, 'anidb'));

    return result.length;
  }

  // Get sample content for display
  async getSampleContent(limit: number = 10) {
    const results = await db
      .select()
      .from(content)
      .where(eq(content.source, 'anidb'))
      .limit(limit);

    return results.map(item => ({
      id: item.id,
      title: item.title,
      year: item.year,
      episodes: item.episodes,
      rating: item.rating,
      episodeCount: item.episodeData ? (item.episodeData as any).episodes?.length || 0 : 0
    }));
  }

  // Resume AniDB sync (for sync manager compatibility)
  async resumeSync(): Promise<{ imported: number; updated: number; errors: string[] }> {
    console.log('[AniDB] Resuming sync...');
    return await this.importAnime();
  }

  // Pause AniDB sync (alias for compatibility)
  async pauseSync(): Promise<void> {
    console.log('[AniDB] Pausing sync...');
    await this.pauseImport();
  }

  // Sync all anime (alias for sync manager compatibility)
  async syncAllAnime(): Promise<{ imported: number; updated: number; errors: string[] }> {
    return await this.importAnime();
  }

  // Clean up and delete all AniDB data
  async deleteAllData(): Promise<void> {
    console.log('[AniDB] Deleting all AniDB data...');
    
    await db
      .delete(content)
      .where(eq(content.source, 'anidb'));

    await db
      .delete(importStatus)
      .where(eq(importStatus.source, 'anidb'));

    console.log('[AniDB] All AniDB data deleted');
  }
}

// Export singleton instance
export const anidbService = new AniDBService();