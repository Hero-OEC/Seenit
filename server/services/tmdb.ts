import { db } from "../db";
import { content, importStatus, type Content, type InsertContent, type ImportStatus } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { omdbService } from "./omdb";

// TMDB API types based on official documentation
interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview?: string;
  release_date?: string;
  genre_ids: number[];
  adult: boolean;
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  original_language: string;
  runtime?: number;
  status?: string;
  tagline?: string;
  production_companies?: Array<{
    id: number;
    name: string;
  }>;
  genres?: Array<{
    id: number;
    name: string;
  }>;
}


interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBVideo {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string; // YouTube video key
  name: string;
  site: string; // "YouTube" or "Vimeo"
  size: number;
  type: string; // "Trailer", "Teaser", "Clip", etc.
}

interface TMDBVideosResponse {
  id: number;
  results: TMDBVideo[];
}

interface TMDBExternalIds {
  imdb_id: string | null;
  facebook_id: string | null;
  instagram_id: string | null;
  twitter_id: string | null;
}

export class TMDBService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private apiKey = process.env.TMDB_API_KEY!;
  private imageBaseUrl = 'https://image.tmdb.org/t/p/w500';
  private largeImageBaseUrl = 'https://image.tmdb.org/t/p/original';

  // TMDB has generous rate limits (~40 req/sec), but let's be conservative
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequests = 35; // 35 requests per second 
  private readonly windowMs = 1000; // 1 second
  private isSyncing = false;

  // Cache for genre mappings
  private movieGenres: Map<number, string> = new Map();

  constructor() {
    // Validate API key at startup
    if (!this.apiKey) {
      console.error('[TMDB] TMDB_API_KEY environment variable is not set');
      throw new Error('TMDB_API_KEY is required');
    }

    this.initializeGenres();
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const url = new URL(`${this.baseUrl}${endpoint}`);
          url.searchParams.append('api_key', this.apiKey);

          // Add additional parameters
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
          });

          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
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

    try {
      while (this.rateLimitQueue.length > 0) {
        const now = Date.now();

        // Reset window if 1 second has passed
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
          try {
            await request();
          } catch (error) {
            console.error('[TMDB] Request failed in queue:', error);
            // Continue processing other requests even if one fails
          }
        }
      }
    } finally {
      // Always reset the processing flag even if an error occurs
      this.isProcessingQueue = false;
    }
  }

  private async initializeGenres() {
    try {
      // Fetch movie genres
      const movieGenresResponse = await this.makeRequest<{ genres: TMDBGenre[] }>('/genre/movie/list');
      movieGenresResponse.genres.forEach(genre => {
        this.movieGenres.set(genre.id, genre.name);
      });


      console.log('[TMDB] Genre cache initialized');
    } catch (error) {
      console.error('[TMDB] Failed to initialize genres:', error);
    }
  }

  // Search methods
  async searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/search/movie', {
      query,
      page: page.toString(),
      include_adult: 'false'
    });
  }


  // Detail methods
  async getMovieDetails(id: number): Promise<TMDBMovie> {
    return this.makeRequest<TMDBMovie>(`/movie/${id}`);
  }

  // Fetch videos/trailers for a movie
  async getMovieVideos(id: number): Promise<TMDBVideosResponse> {
    return this.makeRequest<TMDBVideosResponse>(`/movie/${id}/videos`);
  }

  // Fetch external IDs (IMDb, Facebook, etc.)
  async getMovieExternalIds(id: number): Promise<TMDBExternalIds> {
    return this.makeRequest<TMDBExternalIds>(`/movie/${id}/external_ids`);
  }

  // Get the primary trailer (YouTube trailer preferred)
  async getMovieTrailerKey(id: number): Promise<string | null> {
    try {
      const videos = await this.getMovieVideos(id);
      
      // Filter for YouTube trailers
      const youtubeTrailers = videos.results.filter(
        video => video.site === 'YouTube' && video.type === 'Trailer'
      );
      
      // Return the first official trailer, or the first video if no trailer exists
      if (youtubeTrailers.length > 0) {
        return youtubeTrailers[0].key;
      }
      
      // Fallback to any YouTube video
      const youtubeVideos = videos.results.filter(video => video.site === 'YouTube');
      if (youtubeVideos.length > 0) {
        return youtubeVideos[0].key;
      }
      
      return null;
    } catch (error) {
      console.error(`[TMDB] Failed to fetch trailer for movie ${id}:`, error);
      return null;
    }
  }


  // Discovery methods
  async discoverMovies(page: number = 1, filters: Record<string, string> = {}): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/discover/movie', {
      page: page.toString(),
      include_adult: 'false',
      sort_by: 'popularity.desc',
      ...filters
    });
  }


  // Popular content methods
  async getPopularMovies(page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/movie/popular', {
      page: page.toString(),
      include_adult: 'false'
    });
  }

  // Trending content methods
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>(`/trending/movie/${timeWindow}`, {
      page: page.toString(),
      include_adult: 'false'
    });
  }


  // Conversion methods
  async convertMovieToContent(movie: TMDBMovie): Promise<InsertContent> {
    const genres = movie.genre_ids?.map(id => this.movieGenres.get(id)).filter((genre): genre is string => Boolean(genre)) || 
                   movie.genres?.map(g => g.name) || [];

    // Fetch trailer key for the movie
    const trailerKey = await this.getMovieTrailerKey(movie.id);

    // Fetch IMDb rating via OMDb using external IDs
    let imdbRating = null;
    let imdbId = null;
    let imdbVotes = null;

    try {
      const externalIds = await this.getMovieExternalIds(movie.id);
      if (externalIds.imdb_id) {
        imdbId = externalIds.imdb_id;
        
        // Check if OMDb quota is exhausted before making request
        if (await omdbService.isExhausted()) {
          console.log(`[TMDB] OMDb quota exhausted, will rate "${movie.title}" later via backfill`);
        } else {
          const omdbData = await omdbService.getImdbRating(externalIds.imdb_id);
          if (omdbData.rating !== null) {
            imdbRating = omdbData.rating;
            imdbVotes = omdbData.votes;
            console.log(`[TMDB] Got IMDb rating for "${movie.title}": ${imdbRating} (${imdbVotes} votes)`);
          } else {
            console.warn(`[TMDB] No IMDb rating available for "${movie.title}" (${imdbId})`);
          }
        }
      } else {
        console.warn(`[TMDB] No IMDb ID found for "${movie.title}"`);
      }
    } catch (error) {
      console.error(`[TMDB] Error fetching IMDb rating for "${movie.title}":`, error);
    }

    // Determine status intelligently based on release date
    let status = movie.status;
    if (!status && movie.release_date) {
      const releaseDate = new Date(movie.release_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      status = releaseDate > today ? 'upcoming' : 'released';
    } else if (!status) {
      status = 'released'; // fallback for movies without release date
    }

    return {
      title: movie.title,
      type: 'movie',
      source: 'tmdb',
      sourceId: movie.id.toString(),
      overview: movie.overview,
      genres,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
      rating: imdbRating, // Use IMDb rating from OMDb instead of TMDB rating
      poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : undefined,
      backdrop: movie.backdrop_path ? `${this.largeImageBaseUrl}${movie.backdrop_path}` : undefined,
      status: status,
      runtime: movie.runtime,
      trailerKey: trailerKey || undefined,
      imdbId: imdbId || undefined,
      voteCount: imdbVotes || undefined,
      releaseDate: movie.release_date || undefined
    };
  }


  // Import status tracking methods
  private async updateImportStatus(updates: Partial<{
    isActive: boolean;
    currentPage: number;
    totalImported: number;
    totalAvailable: number;
    phase1Progress: string;
    errors: string[];
    lastSyncAt: Date;
  }>): Promise<void> {
    const existing = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tmdb'))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(importStatus).values({
        source: 'tmdb',
        ...updates
      });
    } else {
      await db
        .update(importStatus)
        .set({...updates, updatedAt: new Date()})
        .where(eq(importStatus.source, 'tmdb'));
    }
  }

  // Get import status
  async getImportStatus(): Promise<ImportStatus | null> {
    const [status] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, 'tmdb'))
      .limit(1);

    return status || null;
  }

  // Pause import
  async pauseImport(): Promise<void> {
    await this.updateImportStatus({
      isActive: false
    });
    console.log('[TMDB] Import paused');
  }

  // Import methods for populating database
  async importPopularMovies(maxPages: number = 20): Promise<{ imported: number; errors: string[] }> {
    if (this.isSyncing) {
      return { imported: 0, errors: ['Import already in progress'] };
    }

    this.isSyncing = true;
    let imported = 0;
    const errors: string[] = [];

    try {
      console.log('[TMDB] Starting popular movies import...');

      // Initialize import status
      await this.updateImportStatus({
        isActive: true,
        currentPage: 1,
        phase1Progress: 'Starting TMDB movies import...',
        errors: [],
        lastSyncAt: new Date()
      });

      for (let page = 1; page <= maxPages; page++) {
        // Check if import has been paused
        const currentStatus = await this.getImportStatus();
        if (!currentStatus?.isActive) {
          console.log('[TMDB] Movies import paused by user');
          await this.updateImportStatus({
            phase1Progress: 'Movies import paused'
          });
          break;
        }

        try {
          const response = await this.getPopularMovies(page);

          for (const movie of response.results) {
            try {
              // Check if already exists
              const [existing] = await db
                .select()
                .from(content)
                .where(
                  and(
                    eq(content.source, 'tmdb'),
                    eq(content.sourceId, movie.id.toString())
                  )
                )
                .limit(1);

              if (!existing) {
                const contentData = await this.convertMovieToContent(movie);
                await db.insert(content).values(contentData);
                imported++;
              }
            } catch (error) {
              const errorMsg = `Failed to import movie ${movie.title}: ${error}`;
              errors.push(errorMsg);
              console.error(`[TMDB] ${errorMsg}`);
            }
          }

          console.log(`[TMDB] Imported page ${page}: ${imported} movies total`);

          // Update progress
          await this.updateImportStatus({
            currentPage: page,
            totalImported: imported,
            totalAvailable: response.total_results,
            phase1Progress: `Movies import: Page ${page}/${maxPages}, ${imported} movies imported`
          });
        } catch (error) {
          const errorMsg = `Failed to fetch movies page ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(`[TMDB] ${errorMsg}`);
        }
      }

      console.log(`[TMDB] Popular movies import complete: ${imported} imported, ${errors.length} errors`);

      // Mark as complete
      await this.updateImportStatus({
        isActive: false,
        totalImported: imported,
        phase1Progress: `Movies import complete: ${imported} movies imported`,
        errors,
        lastSyncAt: new Date()
      });
    } catch (error) {
      errors.push(`Import failed: ${error}`);
      console.error('[TMDB] Import failed:', error);

      // Mark as failed
      await this.updateImportStatus({
        isActive: false,
        errors: [`Import failed: ${error}`]
      });
    } finally {
      this.isSyncing = false;
    }

    return { imported, errors };
  }

  // Get now playing movies (recent releases)
  async getNowPlayingMovies(page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/movie/now_playing', {
      page: page.toString()
    });
  }

  // Get upcoming movies
  async getUpcomingMovies(page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/movie/upcoming', {
      page: page.toString()
    });
  }

  // Import recent/new movies (now playing + upcoming)
  async importRecentMovies(maxPages: number = 50): Promise<{ imported: number; errors: string[] }> {
    if (this.isSyncing) {
      return { imported: 0, errors: ['Import already in progress'] };
    }

    this.isSyncing = true;
    let imported = 0;
    const errors: string[] = [];

    try {
      console.log('[TMDB] Starting recent movies import (now playing + upcoming)...');

      // Initialize import status
      await this.updateImportStatus({
        isActive: true,
        currentPage: 1,
        phase1Progress: 'Starting TMDB recent movies import...',
        errors: [],
        lastSyncAt: new Date()
      });

      // Import now playing movies
      for (let page = 1; page <= Math.ceil(maxPages / 2); page++) {
        const currentStatus = await this.getImportStatus();
        if (!currentStatus?.isActive) {
          console.log('[TMDB] Recent movies import paused by user');
          break;
        }

        try {
          const response = await this.getNowPlayingMovies(page);
          imported += await this.processMoviePage(response.results, `now playing page ${page}`);

          await this.updateImportStatus({
            currentPage: page,
            totalImported: imported,
            phase1Progress: `Now playing movies: Page ${page}, ${imported} movies imported`
          });
        } catch (error) {
          const errorMsg = `Failed to fetch now playing movies page ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(`[TMDB] ${errorMsg}`);
        }
      }

      // Import upcoming movies
      for (let page = 1; page <= Math.floor(maxPages / 2); page++) {
        const currentStatus = await this.getImportStatus();
        if (!currentStatus?.isActive) {
          console.log('[TMDB] Recent movies import paused by user');
          break;
        }

        try {
          const response = await this.getUpcomingMovies(page);
          imported += await this.processMoviePage(response.results, `upcoming page ${page}`);

          await this.updateImportStatus({
            currentPage: page,
            totalImported: imported,
            phase1Progress: `Upcoming movies: Page ${page}, ${imported} movies imported`
          });
        } catch (error) {
          const errorMsg = `Failed to fetch upcoming movies page ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(`[TMDB] ${errorMsg}`);
        }
      }

      console.log(`[TMDB] Recent movies import complete: ${imported} imported, ${errors.length} errors`);

      await this.updateImportStatus({
        isActive: false,
        totalImported: imported,
        phase1Progress: `Recent movies import complete: ${imported} movies imported`,
        errors,
        lastSyncAt: new Date()
      });
    } catch (error) {
      errors.push(`Recent import failed: ${error}`);
      console.error('[TMDB] Recent import failed:', error);

      await this.updateImportStatus({
        isActive: false,
        errors: [`Recent import failed: ${error}`]
      });
    } finally {
      this.isSyncing = false;
    }

    return { imported, errors };
  }

  // Hybrid import: popular + recent, then comprehensive (future)
  async importHybrid(popularPages: number = 20, recentPages: number = 10): Promise<{ imported: number; errors: string[] }> {
    if (this.isSyncing) {
      return { imported: 0, errors: ['Import already in progress'] };
    }

    let totalImported = 0;
    const allErrors: string[] = [];

    try {
      console.log('[TMDB] Starting hybrid import: popular + recent movies...');

      // Phase 1: Import popular movies
      const popularResult = await this.importPopularMovies(popularPages);
      totalImported += popularResult.imported;
      allErrors.push(...popularResult.errors);

      // Short delay between phases
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 2: Import recent movies (always run unless specifically paused by user)
      const recentResult = await this.importRecentMovies(recentPages);
      totalImported += recentResult.imported;
      allErrors.push(...recentResult.errors);

      console.log(`[TMDB] Hybrid import complete: ${totalImported} total movies imported`);

    } catch (error) {
      console.error('[TMDB] Hybrid import failed:', error);
      allErrors.push(`Hybrid import failed: ${error}`);
    }

    return { imported: totalImported, errors: allErrors };
  }

  // Import comprehensive: All movies (paginated) - Optimized for free tier
  async importComprehensive(maxPages: number = 47): Promise<{ imported: number; errors: string[] }> {
    if (this.isSyncing) {
      return { imported: 0, errors: ['Import already in progress'] };
    }

    this.isSyncing = true;
    let imported = 0;
    const errors: string[] = [];

    try {
      console.log('[TMDB] Starting comprehensive movies import...');

      // Initialize import status
      await this.updateImportStatus({
        isActive: true,
        currentPage: 1,
        phase1Progress: 'Starting TMDB comprehensive movies import...',
        errors: [],
        lastSyncAt: new Date()
      });

      // TMDB has ~1000 requests per day for free tier.
      // We'll fetch ~47 pages to be safe, leaving room for other requests.
      for (let page = 1; page <= maxPages; page++) {
        const currentStatus = await this.getImportStatus();
        if (!currentStatus?.isActive) {
          console.log('[TMDB] Comprehensive movies import paused by user');
          await this.updateImportStatus({
            phase1Progress: 'Comprehensive movies import paused'
          });
          break;
        }

        try {
          const response = await this.discoverMovies(page); // Use discover to get broader range
          imported += await this.processMoviePage(response.results, `discover page ${page}`);

          await this.updateImportStatus({
            currentPage: page,
            totalImported: imported,
            totalAvailable: response.total_results,
            phase1Progress: `Comprehensive movies: Page ${page}/${maxPages}, ${imported} movies imported`
          });
        } catch (error) {
          const errorMsg = `Failed to fetch discover movies page ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(`[TMDB] ${errorMsg}`);
        }
      }

      console.log(`[TMDB] Comprehensive movies import complete: ${imported} imported, ${errors.length} errors`);

      await this.updateImportStatus({
        isActive: false,
        totalImported: imported,
        phase1Progress: `Comprehensive movies import complete: ${imported} movies imported`,
        errors,
        lastSyncAt: new Date()
      });
    } catch (error) {
      errors.push(`Comprehensive import failed: ${error}`);
      console.error('[TMDB] Comprehensive import failed:', error);

      await this.updateImportStatus({
        isActive: false,
        errors: [`Comprehensive import failed: ${error}`]
      });
    } finally {
      this.isSyncing = false;
    }

    return { imported, errors };
  }


  // Helper method to process a page of movies (reduces duplication)
  private async processMoviePage(movies: TMDBMovie[], source: string): Promise<number> {
    let imported = 0;

    for (const movie of movies) {
      try {
        // Check if already exists
        const [existing] = await db
          .select()
          .from(content)
          .where(
            and(
              eq(content.source, 'tmdb'),
              eq(content.sourceId, movie.id.toString())
            )
          )
          .limit(1);

        if (!existing) {
          const contentData = await this.convertMovieToContent(movie);
          await db.insert(content).values(contentData);
          imported++;
        }
      } catch (error) {
        console.error(`[TMDB] Failed to import movie ${movie.title} from ${source}: ${error}`);
      }
    }

    return imported;
  }


  // Helper method to get formatted image URLs
  getImageUrl(path: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
    const baseUrls = {
      small: 'https://image.tmdb.org/t/p/w185',
      medium: 'https://image.tmdb.org/t/p/w500', 
      large: 'https://image.tmdb.org/t/p/original'
    };

    return `${baseUrls[size]}${path}`;
  }
}

// Export singleton instance
export const tmdbService = new TMDBService();