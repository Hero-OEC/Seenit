import { db } from "../db";
import { content, importStatus } from "@shared/schema";
import type { InsertContent } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

// AniList API types based on GraphQL schema
interface AniListTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

interface AniListDate {
  year?: number;
  month?: number;
  day?: number;
}

interface AniListCoverImage {
  large?: string;
  medium?: string;
}

interface AniListStudio {
  name: string;
}

interface AniListStudioConnection {
  nodes?: AniListStudio[];
}

interface AniListAnime {
  id: number;
  title: AniListTitle;
  description?: string;
  episodes?: number;
  genres?: string[];
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  trending?: number;
  coverImage?: AniListCoverImage;
  bannerImage?: string;
  status?: string; // 'FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'
  startDate?: AniListDate;
  endDate?: AniListDate;
  season?: string; // 'WINTER', 'SPRING', 'SUMMER', 'FALL'
  seasonYear?: number;
  studios?: AniListStudioConnection;
  source?: string; // 'MANGA', 'LIGHT_NOVEL', 'ORIGINAL', etc.
  format?: string; // 'TV', 'MOVIE', 'OVA', 'SPECIAL', etc.
  duration?: number; // Episode duration in minutes
  nextAiringEpisode?: {
    episode: number;
    timeUntilAiring: number;
  };
}

interface AniListPageInfo {
  currentPage: number;
  hasNextPage: boolean;
  total?: number;
  perPage?: number;
}

interface AniListPage {
  pageInfo: AniListPageInfo;
  media: AniListAnime[];
}

interface AniListResponse {
  data: {
    Page: AniListPage;
  };
}

export class AniListService {
  private baseUrl = 'https://graphql.anilist.co';
  private isSyncing = false;

  private async makeGraphQLRequest<T>(query: string, variables?: any): Promise<T> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: variables || {}
        })
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`AniList GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data;
    } catch (error) {
      console.error('AniList API request failed:', error);
      throw error;
    }
  }

  async getAllAnime(page: number = 1, perPage: number = 50): Promise<AniListAnime[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            total
            perPage
          }
          media(type: ANIME, sort: ID) {
            id
            title {
              romaji
              english
              native
            }
            description
            episodes
            genres
            averageScore
            meanScore
            popularity
            trending
            coverImage {
              large
              medium
            }
            bannerImage
            status
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            season
            seasonYear
            studios {
              nodes {
                name
              }
            }
            source
            format
            duration
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
          }
        }
      }
    `;

    const variables = { page, perPage };
    const response = await this.makeGraphQLRequest<AniListResponse>(query, variables);
    return response.data.Page.media;
  }

  async getTrendingAnime(page: number = 1, perPage: number = 50): Promise<AniListAnime[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            currentPage
            hasNextPage
            total
          }
          media(type: ANIME, status: RELEASING, sort: TRENDING_DESC) {
            id
            title {
              romaji
              english
              native
            }
            description
            episodes
            genres
            averageScore
            popularity
            trending
            coverImage {
              large
              medium
            }
            bannerImage
            status
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
            studios {
              nodes {
                name
              }
            }
            source
            format
            duration
          }
        }
      }
    `;

    const variables = { page, perPage };
    const response = await this.makeGraphQLRequest<AniListResponse>(query, variables);
    return response.data.Page.media;
  }

  async getAnimeById(id: number): Promise<AniListAnime> {
    const query = `
      query ($id: Int) {
        Page(page: 1, perPage: 1) {
          media(id: $id, type: ANIME) {
            id
            title {
              romaji
              english
              native
            }
            description
            episodes
            genres
            averageScore
            meanScore
            popularity
            trending
            coverImage {
              large
              medium
            }
            bannerImage
            status
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            season
            seasonYear
            studios {
              nodes {
                name
              }
            }
            source
            format
            duration
            nextAiringEpisode {
              episode
              timeUntilAiring
            }
          }
        }
      }
    `;

    const variables = { id };
    const response = await this.makeGraphQLRequest<AniListResponse>(query, variables);
    
    if (!response.data.Page.media.length) {
      throw new Error(`Anime with ID ${id} not found`);
    }
    
    return response.data.Page.media[0];
  }

  private stripHtmlTags(html: string): string {
    return html?.replace(/<[^>]*>/g, '') || '';
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple string similarity using Levenshtein distance
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i] + 1, // deletion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async findExistingTvShowMatch(anime: AniListAnime): Promise<any | null> {
    // Get all TV shows to check for matches
    const existingTvShows = await db
      .select()
      .from(content)
      .where(eq(content.type, 'tv'));

    const animeTitle = anime.title?.english || anime.title?.romaji || anime.title?.native || '';
    const animeYear = anime.startDate?.year;
    
    // Alternative titles to check against
    const titlesToCheck = [
      anime.title?.english,
      anime.title?.romaji,
      anime.title?.native
    ].filter(Boolean);

    for (const tvShow of existingTvShows) {
      // Skip if years don't match (allow 1 year difference for different release dates)
      if (animeYear && tvShow.year && Math.abs(animeYear - tvShow.year) > 1) {
        continue;
      }

      // Check title similarity
      for (const animeTestTitle of titlesToCheck) {
        const similarity = this.calculateStringSimilarity(animeTestTitle!, tvShow.title);
        
        // If similarity is high enough (80%+), consider it a match
        if (similarity >= 0.8) {
          console.log(`Found potential anime match: "${animeTestTitle}" (${animeYear}) matches TV show "${tvShow.title}" (${tvShow.year}) with ${(similarity * 100).toFixed(1)}% similarity`);
          return tvShow;
        }
      }
      
      // Also check for exact substring matches (common for anime with subtitles)
      for (const animeTestTitle of titlesToCheck) {
        const animeTitleLower = animeTestTitle!.toLowerCase();
        const tvTitleLower = tvShow.title.toLowerCase();
        
        if (animeTitleLower.includes(tvTitleLower) || tvTitleLower.includes(animeTitleLower)) {
          // Additional validation: check if genres overlap (anime should have some anime-like genres)
          const animeGenres = anime.genres?.map(g => g.toLowerCase()) || [];
          const tvGenres = tvShow.genres?.map(g => g.toLowerCase()) || [];
          const genreOverlap = animeGenres.some(g => tvGenres.includes(g));
          
          if (genreOverlap || animeGenres.some(g => ['action', 'adventure', 'drama', 'fantasy', 'science fiction'].includes(g))) {
            console.log(`Found exact substring match: "${animeTestTitle}" matches TV show "${tvShow.title}"`);
            return tvShow;
          }
        }
      }
    }

    return null;
  }

  private formatDate(anilistDate?: AniListDate): string | null {
    if (!anilistDate?.year) return null;
    
    const year = anilistDate.year;
    const month = anilistDate.month || 1;
    const day = anilistDate.day || 1;
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  private mapAniListToContent(anime: AniListAnime): InsertContent {
    // Get preferred title (English > Romaji > Native)
    const title = anime.title?.english || anime.title?.romaji || anime.title?.native || 'Unknown Title';
    
    // Get studio name (first studio if multiple)
    const studio = anime.studios?.nodes?.[0]?.name || null;
    
    // Map AniList status to our schema
    let status = 'completed';
    if (anime.status === 'RELEASING') status = 'airing';
    else if (anime.status === 'NOT_YET_RELEASED') status = 'upcoming';
    else if (anime.status === 'FINISHED') status = 'completed';
    else if (anime.status === 'CANCELLED') status = 'cancelled';
    else if (anime.status === 'HIATUS') status = 'airing'; // Still consider as airing

    // Map source material
    let sourceMaterial = null;
    if (anime.source) {
      sourceMaterial = anime.source.toLowerCase().replace('_', ' ');
    }

    // Get release year from start date
    const releaseYear = anime.startDate?.year || null;
    const endYear = anime.endDate?.year || null;

    return {
      title,
      type: 'anime',
      source: 'anilist',
      sourceId: anime.id.toString(),
      overview: anime.description ? this.stripHtmlTags(anime.description) : null,
      genres: anime.genres || [],
      year: releaseYear,
      endYear: endYear,
      rating: anime.averageScore ? anime.averageScore / 10 : null, // Convert from 0-100 to 0-10 scale
      poster: anime.coverImage?.large || anime.coverImage?.medium || null,
      backdrop: anime.bannerImage || null,
      status,
      
      // Anime-specific fields
      episodes: anime.episodes || null,
      season: anime.seasonYear || null, // Use season year as season identifier
      studio,
      sourceMaterial,
      runtime: anime.duration || null,
      
      // Not used for anime
      totalSeasons: null,
      totalEpisodes: null,
      network: null,
      airTime: null,
      airDays: null,
      episodeData: null,
      releaseDate: this.formatDate(anime.startDate),
      
      // Additional metadata
      tags: [
        anime.format?.toLowerCase(),
        anime.season?.toLowerCase(),
        anime.source?.toLowerCase().replace('_', '-')
      ].filter((tag): tag is string => Boolean(tag)),
      popularity: anime.popularity || null,
      voteCount: null,
      
      // Rating fields
      imdbRating: null,
      rottenTomatoesRating: null,
      malRating: anime.meanScore ? anime.meanScore / 10 : null,
      
      // Streaming (not available from AniList)
      streamingPlatforms: null,
      affiliateLinks: null
    };
  }

  async syncAllAnime(): Promise<{ imported: number; updated: number; errors: string[] }> {
    if (this.isSyncing) {
      console.log('AniList sync already in progress, ignoring duplicate request');
      return { imported: 0, updated: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    console.log('AniList sync started - instance lock acquired');

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    let migrated = 0; // Track TV shows migrated to anime
    let page = 1;

    // Get or create import status
    let [importStatusRecord] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'anilist'));

    if (!importStatusRecord) {
      [importStatusRecord] = await db
        .insert(importStatus)
        .values({
          source: 'anilist',
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
      
      // Continue from last page
      page = importStatusRecord.currentPage || 1;
    }

    try {
      // Phase 1: Update existing airing/upcoming anime
      if (page === 1 || page === (importStatusRecord.currentPage || 1)) {
        console.log('Phase 1: Updating existing airing/upcoming anime for new episodes...');
        await this.updateExistingActiveAnime();
        console.log('Phase 1 complete: Existing active anime updated');
      }

      // Phase 2: Continue importing from where we left off
      console.log(`Phase 2: Starting import from page ${page}...`);
      let totalPagesProcessed = 0;
      let totalAnimeInPhase2 = 0;
      
      while (true) {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'anilist'));
        
        if (!currentStatus?.isActive) {
          console.log('AniList sync paused by user');
          break;
        }

        const animeList = await this.getAllAnime(page, 50);
        
        if (animeList.length === 0) {
          console.log(`No more anime found at page ${page}, sync complete`);
          await db
            .update(importStatus)
            .set({
              phase2Progress: `Phase 2 Complete: ${totalPagesProcessed} pages processed, ${totalAnimeInPhase2} anime imported`,
              updatedAt: new Date()
            })
            .where(eq(importStatus.id, currentStatus.id));
          break;
        }

        totalPagesProcessed++;
        console.log(`Processing page ${page} with ${animeList.length} anime`);

        for (const anime of animeList) {
          try {
            // First check if anime already exists in AniList format
            const [existingAniListContent] = await db
              .select()
              .from(content)
              .where(
                and(
                  eq(content.source, 'anilist'),
                  eq(content.sourceId, anime.id.toString())
                )
              );

            const mappedContent = this.mapAniListToContent(anime);

            if (existingAniListContent) {
              // Update existing AniList content
              await db
                .update(content)
                .set({
                  ...mappedContent,
                  lastUpdated: new Date()
                })
                .where(eq(content.id, existingAniListContent.id));
              updated++;
            } else {
              // Phase 2: Only import new anime (migration will be handled in Phase 3)
              await db
                .insert(content)
                .values(mappedContent);
              imported++;
              totalAnimeInPhase2++;
            }
          } catch (error) {
            const errorMsg = `Error processing anime ${anime.title?.english || anime.title?.romaji} (ID: ${anime.id}): ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Update progress
        await db
          .update(importStatus)
          .set({
            currentPage: page,
            totalImported: imported + updated,
            phase2Progress: `Page ${page}: ${totalPagesProcessed} pages processed, ${totalAnimeInPhase2} anime imported`,
            updatedAt: new Date()
          })
          .where(eq(importStatus.id, currentStatus.id));

        page++;
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Phase 3: Migration phase - Find anime in TV shows and migrate them
      console.log('Phase 2 complete. Starting Phase 3: Migration phase...');
      const migratedCount = await this.performMigrationPhase();
      migrated = migratedCount;

    } catch (error) {
      const errorMsg = `AniList sync failed: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    } finally {
      // Mark sync as complete
      const [finalStatus] = await db
        .select()
        .from(importStatus)
        .where(eq(importStatus.source, 'anilist'));

      if (finalStatus) {
        await db
          .update(importStatus)
          .set({
            isActive: false,
            lastSyncAt: new Date(),
            errors: errors.length > 0 ? errors : [],
            updatedAt: new Date()
          })
          .where(eq(importStatus.id, finalStatus.id));
      }

      this.isSyncing = false;
      console.log('AniList sync completed - instance lock released');
    }

    console.log(`AniList sync completed: ${imported} new anime imported, ${updated} existing anime updated, ${migrated} TV shows migrated to anime`);
    return { imported, updated, errors, migrated };
  }

  private async updateExistingActiveAnime(): Promise<void> {
    console.log('Checking existing anime for updates...');
    
    // Get all existing anime that are airing or upcoming
    const existingActiveAnime = await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.source, 'anilist'),
          or(
            eq(content.status, 'airing'),
            eq(content.status, 'upcoming')
          )
        )
      );

    console.log(`Found ${existingActiveAnime.length} existing airing/upcoming anime to update`);

    let updated = 0;
    for (const anime of existingActiveAnime) {
      try {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'anilist'));
        
        if (!currentStatus?.isActive) {
          console.log('AniList sync paused during existing anime updates');
          break;
        }

        // Fetch latest data for this anime
        const anilistId = parseInt(anime.sourceId);
        const detailedAnime = await this.getAnimeById(anilistId);
        const mappedContent = this.mapAniListToContent(detailedAnime);

        // Update existing anime with latest data
        await db
          .update(content)
          .set({
            ...mappedContent,
            lastUpdated: new Date()
          })
          .where(eq(content.id, anime.id));
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`Updated ${updated}/${existingActiveAnime.length} existing anime`);
          
          // Update status with Phase 1 progress
          await db
            .update(importStatus)
            .set({
              phase1Progress: `${updated}/${existingActiveAnime.length}`,
              updatedAt: new Date()
            })
            .where(eq(importStatus.id, currentStatus.id));
        }
        
      } catch (error) {
        console.error(`Error updating existing anime ${anime.title} (ID: ${anime.sourceId}):`, error);
      }
    }
    
    // Mark Phase 1 as complete
    const [currentStatus] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'anilist'));
    
    if (currentStatus) {
      await db
        .update(importStatus)
        .set({
          phase1Progress: `${updated}/${existingActiveAnime.length} (Phase 1 Complete)`,
          updatedAt: new Date()
        })
        .where(eq(importStatus.id, currentStatus.id));
    }
    
    console.log(`Completed updating ${updated} existing airing/upcoming anime`);
  }

  // Phase 3: Migration phase - Find anime in TV shows and migrate them
  private async performMigrationPhase(): Promise<number> {
    console.log('Phase 3: Starting migration - searching for anime in TV shows...');
    
    let migrated = 0;
    
    // Get all existing anime from AniList
    const existingAnime = await db
      .select()
      .from(content)
      .where(eq(content.source, 'anilist'));
    
    console.log(`Checking ${existingAnime.length} anime against TV shows for potential migrations...`);
    
    for (const anime of existingAnime) {
      try {
        // Check if sync is still active
        const [currentStatus] = await db
          .select()
          .from(importStatus)
          .where(eq(importStatus.source, 'anilist'));
        
        if (!currentStatus?.isActive) {
          console.log('AniList sync paused during migration phase');
          break;
        }

        // Try to find a matching TV show for this anime
        const matchingTvShow = await this.findExistingTvShowByAnimeData(anime);
        
        if (matchingTvShow) {
          console.log(`🔄 Phase 3: Migrating TV show "${matchingTvShow.title}" to anime (matched with "${anime.title}")`);
          
          // Delete the TV show (it will be replaced by the anime)
          await db
            .delete(content)
            .where(eq(content.id, matchingTvShow.id));
          
          migrated++;
          console.log(`✅ Successfully migrated "${matchingTvShow.title}" from TV shows to anime`);
          
          // Update migration progress every 5 migrations
          if (migrated % 5 === 0) {
            await db
              .update(importStatus)
              .set({
                phase3Progress: `${migrated} TV shows migrated to anime`,
                updatedAt: new Date()
              })
              .where(eq(importStatus.id, currentStatus.id));
          }
        }
        
      } catch (error) {
        console.error(`Error during migration check for anime "${anime.title}":`, error);
      }
    }
    
    // Mark Phase 3 as complete
    const [currentStatus] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'anilist'));
    
    if (currentStatus) {
      await db
        .update(importStatus)
        .set({
          phase3Progress: `${migrated} TV shows migrated (Phase 3 Complete)`,
          updatedAt: new Date()
        })
        .where(eq(importStatus.id, currentStatus.id));
    }
    
    console.log(`Phase 3 complete: ${migrated} TV shows migrated to anime`);
    return migrated;
  }

  // Helper method to find TV show matches based on existing anime data
  private async findExistingTvShowByAnimeData(anime: any): Promise<any | null> {
    // Get all TV shows to check for matches
    const existingTvShows = await db
      .select()
      .from(content)
      .where(eq(content.type, 'tv'));

    const animeTitle = anime.title;
    const animeYear = anime.year;
    
    for (const tvShow of existingTvShows) {
      // Skip if years don't match (allow 1 year difference for different release dates)
      if (animeYear && tvShow.year && Math.abs(animeYear - tvShow.year) > 1) {
        continue;
      }

      // Check title similarity
      const similarity = this.calculateStringSimilarity(animeTitle, tvShow.title);
      
      // If similarity is high enough (80%+), consider it a match
      if (similarity >= 0.8) {
        console.log(`Found potential migration target: "${animeTitle}" (${animeYear}) matches TV show "${tvShow.title}" (${tvShow.year}) with ${(similarity * 100).toFixed(1)}% similarity`);
        return tvShow;
      }
      
      // Also check for exact substring matches (common for anime with subtitles)
      const animeTitleLower = animeTitle.toLowerCase();
      const tvTitleLower = tvShow.title.toLowerCase();
      
      if (animeTitleLower.includes(tvTitleLower) || tvTitleLower.includes(animeTitleLower)) {
        console.log(`Found exact substring migration target: "${animeTitle}" matches TV show "${tvShow.title}"`);
        return tvShow;
      }
    }
    
    return null;
  }

  async getImportStatus() {
    const [status] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'anilist'));
    
    return status;
  }

  async pauseSync(): Promise<void> {
    await db
      .update(importStatus)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(importStatus.source, 'anilist'));
    
    console.log('AniList sync paused');
  }

  async getImportedContent() {
    const animeContent = await db
      .select()
      .from(content)
      .where(eq(content.source, 'anilist'))
      .orderBy(content.createdAt);
    
    return {
      count: animeContent.length,
      content: animeContent
    };
  }

  async deleteAllContent(): Promise<{ deleted: number }> {
    // Delete all AniList content
    const deletedContent = await db
      .delete(content)
      .where(eq(content.source, 'anilist'))
      .returning();

    // Reset import status
    await db
      .delete(importStatus)
      .where(eq(importStatus.source, 'anilist'));

    console.log(`Deleted ${deletedContent.length} AniList anime records`);
    return { deleted: deletedContent.length };
  }

  async resetImportStatus(): Promise<void> {
    console.log('Resetting AniList import status...');
    
    // Delete the import status record so it starts fresh
    await db
      .delete(importStatus)
      .where(eq(importStatus.source, 'anilist'));
    
    console.log('✅ AniList import status reset - next import will start from the beginning');
  }
}

export const anilistService = new AniListService();