import { db } from "../db";
import { content, importStatus, type Content, type InsertContent, type ImportStatus } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

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

interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview?: string;
  first_air_date?: string;
  last_air_date?: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  original_language: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  status?: string;
  in_production?: boolean;
  networks?: Array<{
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
  private tvGenres: Map<number, string> = new Map();

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

      // Fetch TV genres  
      const tvGenresResponse = await this.makeRequest<{ genres: TMDBGenre[] }>('/genre/tv/list');
      tvGenresResponse.genres.forEach(genre => {
        this.tvGenres.set(genre.id, genre.name);
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

  async searchTVShows(query: string, page: number = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.makeRequest<TMDBSearchResponse<TMDBTVShow>>('/search/tv', {
      query,
      page: page.toString(),
      include_adult: 'false'
    });
  }

  // Detail methods
  async getMovieDetails(id: number): Promise<TMDBMovie> {
    return this.makeRequest<TMDBMovie>(`/movie/${id}`);
  }

  async getTVShowDetails(id: number): Promise<TMDBTVShow> {
    return this.makeRequest<TMDBTVShow>(`/tv/${id}`);
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

  async discoverTVShows(page: number = 1, filters: Record<string, string> = {}): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.makeRequest<TMDBSearchResponse<TMDBTVShow>>('/discover/tv', {
      page: page.toString(),
      include_adult: 'false', 
      sort_by: 'popularity.desc',
      ...filters
    });
  }

  // Popular content methods
  async getPopularMovies(page: number = 1): Promise<TMDBSearchResponse<TMDBMovie>> {
    return this.makeRequest<TMDBSearchResponse<TMDBMovie>>('/movie/popular', {
      page: page.toString()
    });
  }

  async getPopularTVShows(page: number = 1): Promise<TMDBSearchResponse<TMDBTVShow>> {
    return this.makeRequest<TMDBSearchResponse<TMDBTVShow>>('/tv/popular', {
      page: page.toString()
    });
  }

  // Conversion methods
  private convertMovieToContent(movie: TMDBMovie): InsertContent {
    const genres = movie.genre_ids?.map(id => this.movieGenres.get(id)).filter((genre): genre is string => Boolean(genre)) || 
                   movie.genres?.map(g => g.name) || [];

    return {
      title: movie.title,
      type: 'movie',
      source: 'tmdb',
      sourceId: movie.id.toString(),
      overview: movie.overview,
      genres,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : undefined,
      rating: movie.vote_average,
      poster: movie.poster_path ? `${this.imageBaseUrl}${movie.poster_path}` : undefined,
      backdrop: movie.backdrop_path ? `${this.largeImageBaseUrl}${movie.backdrop_path}` : undefined,
      status: movie.status || 'Released',
      runtime: movie.runtime
    };
  }

  private convertTVShowToContent(tvShow: TMDBTVShow): InsertContent {
    const genres = tvShow.genre_ids?.map(id => this.tvGenres.get(id)).filter((genre): genre is string => Boolean(genre)) || 
                   tvShow.genres?.map(g => g.name) || [];

    return {
      title: tvShow.name,
      type: 'tv',
      source: 'tmdb',
      sourceId: tvShow.id.toString(),
      overview: tvShow.overview,
      genres,
      year: tvShow.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : undefined,
      rating: tvShow.vote_average,
      poster: tvShow.poster_path ? `${this.imageBaseUrl}${tvShow.poster_path}` : undefined,
      backdrop: tvShow.backdrop_path ? `${this.largeImageBaseUrl}${tvShow.backdrop_path}` : undefined,
      status: tvShow.status || (tvShow.in_production ? 'In Production' : 'Ended'),
      episodes: tvShow.number_of_episodes,
      totalSeasons: tvShow.number_of_seasons,
      network: tvShow.networks?.[0]?.name
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
  async importPopularMovies(maxPages: number = 5): Promise<{ imported: number; errors: string[] }> {
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
                const contentData = this.convertMovieToContent(movie);
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

  async importPopularTVShows(maxPages: number = 5): Promise<{ imported: number; errors: string[] }> {
    if (this.isSyncing) {
      return { imported: 0, errors: ['Import already in progress'] };
    }

    this.isSyncing = true;
    let imported = 0;
    const errors: string[] = [];

    try {
      console.log('[TMDB] Starting popular TV shows import...');

      // Initialize import status
      await this.updateImportStatus({
        isActive: true,
        currentPage: 1,
        phase1Progress: 'Starting TMDB TV shows import...',
        errors: [],
        lastSyncAt: new Date()
      });

      for (let page = 1; page <= maxPages; page++) {
        // Check if import has been paused
        const currentStatus = await this.getImportStatus();
        if (!currentStatus?.isActive) {
          console.log('[TMDB] TV shows import paused by user');
          await this.updateImportStatus({
            phase1Progress: 'TV shows import paused'
          });
          break;
        }
        try {
          const response = await this.getPopularTVShows(page);
          
          for (const tvShow of response.results) {
            try {
              // Check if already exists
              const [existing] = await db
                .select()
                .from(content)
                .where(
                  and(
                    eq(content.source, 'tmdb'),
                    eq(content.sourceId, tvShow.id.toString())
                  )
                )
                .limit(1);

              if (!existing) {
                const contentData = this.convertTVShowToContent(tvShow);
                await db.insert(content).values(contentData);
                imported++;
              }
            } catch (error) {
              const errorMsg = `Failed to import TV show ${tvShow.name}: ${error}`;
              errors.push(errorMsg);
              console.error(`[TMDB] ${errorMsg}`);
            }
          }

          console.log(`[TMDB] Imported page ${page}: ${imported} TV shows total`);
          
          // Update progress
          await this.updateImportStatus({
            currentPage: page,
            totalImported: imported,
            totalAvailable: response.total_results,
            phase1Progress: `TV shows import: Page ${page}/${maxPages}, ${imported} TV shows imported`
          });
        } catch (error) {
          const errorMsg = `Failed to fetch TV shows page ${page}: ${error}`;
          errors.push(errorMsg);
          console.error(`[TMDB] ${errorMsg}`);
        }
      }

      console.log(`[TMDB] Popular TV shows import complete: ${imported} imported, ${errors.length} errors`);
      
      // Mark as complete
      await this.updateImportStatus({
        isActive: false,
        totalImported: imported,
        phase1Progress: `TV shows import complete: ${imported} TV shows imported`,
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