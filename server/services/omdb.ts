import type { InsertContent } from "@shared/schema";

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
  private baseUrl = 'http://www.omdbapi.com/';
  private requestCount = 0;
  private dailyLimit = 1000;
  private lastResetDate: string;

  constructor() {
    this.apiKey = process.env.OMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[OMDb] API key not configured. Rating updates will be skipped.');
    }
    this.lastResetDate = new Date().toDateString();
  }

  private checkDailyLimit(): boolean {
    const currentDate = new Date().toDateString();
    
    // Reset counter if it's a new day
    if (currentDate !== this.lastResetDate) {
      this.requestCount = 0;
      this.lastResetDate = currentDate;
    }

    if (this.requestCount >= this.dailyLimit) {
      console.warn('[OMDb] Daily API limit reached. Skipping request.');
      return false;
    }

    return true;
  }

  async getByImdbId(imdbId: string): Promise<OMDbResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    if (!this.checkDailyLimit()) {
      return null;
    }

    try {
      const url = `${this.baseUrl}?apikey=${this.apiKey}&i=${imdbId}&plot=full`;
      const response = await fetch(url);
      
      this.requestCount++;
      console.log(`[OMDb] Request ${this.requestCount}/${this.dailyLimit} for IMDb ID: ${imdbId}`);

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

  getRemainingRequests(): number {
    return Math.max(0, this.dailyLimit - this.requestCount);
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

// Singleton instance
export const omdbService = new OMDbService();
