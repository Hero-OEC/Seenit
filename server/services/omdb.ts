import type { InsertContent } from "@shared/schema";
import { QuotaProvider } from "./quotaProvider";

interface OMDbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{
    Source: string;
    Value: string;
  }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

class OMDbService {
  private apiKey: string;
  private baseUrl = 'https://www.omdbapi.com/';
  private quotaProvider: QuotaProvider;

  constructor() {
    this.apiKey = process.env.OMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[OMDb] API key not configured. Rating updates will be skipped.');
    }
    this.quotaProvider = new QuotaProvider(1000); // 1000 requests per day
  }

  async isExhausted(): Promise<boolean> {
    return await this.quotaProvider.isExhausted();
  }

  async getByImdbId(imdbId: string): Promise<OMDbResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    // Check if quota is exhausted
    if (await this.quotaProvider.isExhausted()) {
      const stats = await this.quotaProvider.getStats();
      console.warn(`[OMDb] Daily API limit reached. Next reset: ${stats.nextReset}`);
      return null;
    }

    try {
      const url = `${this.baseUrl}?apikey=${this.apiKey}&i=${imdbId}&plot=full`;
      const response = await fetch(url);
      
      // Increment quota counter
      const used = await this.quotaProvider.increment();
      const remaining = await this.quotaProvider.getRemaining();
      console.log(`[OMDb] Request ${used}/1000 for IMDb ID: ${imdbId} (${remaining} remaining)`);

      if (!response.ok) {
        console.error(`[OMDb] HTTP error: ${response.status}`);
        return null;
      }

      const data: OMDbResponse = await response.json();

      if (data.Response === 'False') {
        console.warn(`[OMDb] No data found for IMDb ID: ${imdbId} - ${data.Error}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[OMDb] Error fetching data for IMDb ID ${imdbId}:`, error);
      return null;
    }
  }

  async getImdbRating(imdbId: string): Promise<{ rating: number | null; votes: number | null }> {
    const data = await this.getByImdbId(imdbId);

    if (!data) {
      return { rating: null, votes: null };
    }

    // Parse IMDb rating (e.g., "8.9" -> 8.9)
    const rating = data.imdbRating && data.imdbRating !== 'N/A' 
      ? parseFloat(data.imdbRating) 
      : null;

    // Parse vote count (e.g., "2,500,000" -> 2500000)
    const votes = data.imdbVotes && data.imdbVotes !== 'N/A'
      ? parseInt(data.imdbVotes.replace(/,/g, ''))
      : null;

    return { rating, votes };
  }

  async getQuotaStats() {
    return await this.quotaProvider.getStats();
  }

  async getRemainingRequests(): Promise<number> {
    return await this.quotaProvider.getRemaining();
  }

  async getRequestCount(): Promise<number> {
    const stats = await this.quotaProvider.getStats();
    return stats.used;
  }
}

// Singleton instance
export const omdbService = new OMDbService();
