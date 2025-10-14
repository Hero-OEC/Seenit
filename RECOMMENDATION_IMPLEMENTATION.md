# Recommendation System Implementation Guide

## Overview
This document outlines the implementation strategy for Seenit's recommendation system using native API endpoints from TMDB and Jikan. The goal is to provide intelligent content recommendations while maintaining our existing multi-source content aggregation strategy.

## Core Principles

### Content Source Strategy (Unchanged)
- **Movies**: TMDB API
- **TV Shows**: TVMaze API  
- **Anime**: Jikan API (MyAnimeList)

### Recommendation Strategy (New)
- **Movies**: TMDB native recommendations
- **TV Shows**: TMDB native recommendations (with fallback handling)
- **Anime**: Jikan native recommendations

### Fallback Behavior
Shows from TVMaze that are **not recognized by TMDB** should:
1. **Not appear** in recommendation feeds
2. **Fall back to bottom** of general browsing lists
3. **Only appear** in search results when explicitly queried

---

## API Endpoints Reference

### TMDB Recommendations

#### Movies
```
GET https://api.themoviedb.org/3/movie/{movie_id}/recommendations
GET https://api.themoviedb.org/3/movie/{movie_id}/similar
```

**Parameters:**
- `api_key` (required): Your TMDB API key
- `language` (optional): ISO 639-1 code (default: en-US)
- `page` (optional): Page number for pagination

**Response Structure:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 12345,
      "title": "Movie Title",
      "overview": "Description...",
      "poster_path": "/path.jpg",
      "backdrop_path": "/path.jpg",
      "vote_average": 7.5,
      "release_date": "2023-01-01",
      "genre_ids": [18, 53]
    }
  ],
  "total_pages": 5,
  "total_results": 100
}
```

#### TV Shows
```
GET https://api.themoviedb.org/3/tv/{tv_id}/recommendations
GET https://api.themoviedb.org/3/tv/{tv_id}/similar
```

**Parameters:** Same as movies

**Response Structure:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 67890,
      "name": "TV Show Name",
      "overview": "Description...",
      "poster_path": "/path.jpg",
      "backdrop_path": "/path.jpg",
      "vote_average": 8.2,
      "first_air_date": "2022-05-15",
      "genre_ids": [18, 10765]
    }
  ],
  "total_pages": 3,
  "total_results": 60
}
```

### Jikan (MyAnimeList) Recommendations

```
GET https://api.jikan.moe/v4/anime/{id}/recommendations
```

**Parameters:**
- `{id}` (required): MyAnimeList anime ID

**Response Structure:**
```json
{
  "data": [
    {
      "entry": {
        "mal_id": 123,
        "url": "https://myanimelist.net/anime/123/...",
        "images": {
          "jpg": {
            "image_url": "https://...",
            "small_image_url": "https://...",
            "large_image_url": "https://..."
          }
        },
        "title": "Recommended Anime Title"
      },
      "url": "https://myanimelist.net/recommendations/anime/1-123",
      "votes": 42
    }
  ]
}
```

**Rate Limits:**
- 60 requests per minute
- 3 requests per second

---

## Implementation Architecture

### 1. Database Schema Updates

Add TMDB cross-reference tracking for TVMaze shows:

```typescript
// shared/schema.ts

export const tvShows = pgTable('tv_shows', {
  id: serial('id').primaryKey(),
  tvMazeId: integer('tv_maze_id').unique().notNull(),
  tmdbId: integer('tmdb_id').unique(), // NEW: nullable for shows not on TMDB
  title: text('title').notNull(),
  // ... existing fields
  tmdbRecognized: boolean('tmdb_recognized').default(false), // NEW: flag for recommendation eligibility
});
```

### 2. Service Layer Architecture

#### 2.1 TMDB Service Enhancement (`server/services/tmdb.ts`)

```typescript
interface TMDBRecommendation {
  id: number;
  title?: string;        // for movies
  name?: string;         // for TV shows
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string; // for movies
  first_air_date?: string; // for TV
  genre_ids: number[];
}

class TMDBService {
  // Existing methods...
  
  async getMovieRecommendations(movieId: number, page = 1): Promise<TMDBRecommendation[]> {
    const response = await fetch(
      `${this.baseUrl}/movie/${movieId}/recommendations?api_key=${this.apiKey}&page=${page}`
    );
    const data = await response.json();
    return data.results || [];
  }
  
  async getTVRecommendations(tvId: number, page = 1): Promise<TMDBRecommendation[]> {
    const response = await fetch(
      `${this.baseUrl}/tv/${tvId}/recommendations?api_key=${this.apiKey}&page=${page}`
    );
    const data = await response.json();
    return data.results || [];
  }
  
  async searchTVByName(name: string): Promise<{ id: number } | null> {
    const response = await fetch(
      `${this.baseUrl}/search/tv?api_key=${this.apiKey}&query=${encodeURIComponent(name)}`
    );
    const data = await response.json();
    return data.results?.[0] || null;
  }
}
```

#### 2.2 Jikan Service Enhancement (`server/services/jikan.ts`)

```typescript
interface JikanRecommendation {
  entry: {
    mal_id: number;
    title: string;
    url: string;
    images: {
      jpg: {
        image_url: string;
        large_image_url: string;
      };
    };
  };
  votes: number;
}

class JikanService {
  private rateLimiter: RateLimiter; // Implement rate limiting: 3 req/sec, 60 req/min
  
  async getAnimeRecommendations(animeId: number): Promise<JikanRecommendation[]> {
    await this.rateLimiter.wait();
    
    const response = await fetch(
      `https://api.jikan.moe/v4/anime/${animeId}/recommendations`
    );
    const data = await response.json();
    return data.data || [];
  }
}
```

#### 2.3 Recommendation Aggregation Service (NEW: `server/services/recommendations.ts`)

```typescript
interface UnifiedRecommendation {
  id: string;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  description: string;
  imageUrl: string;
  rating: number;
  sourceId: number; // original API ID
  tmdbRecognized?: boolean; // for TV shows
}

class RecommendationService {
  async getRecommendationsForContent(
    contentType: 'movie' | 'tv' | 'anime',
    contentId: number
  ): Promise<UnifiedRecommendation[]> {
    
    switch (contentType) {
      case 'movie':
        return await this.getMovieRecommendations(contentId);
      
      case 'tv':
        return await this.getTVRecommendations(contentId);
      
      case 'anime':
        return await this.getAnimeRecommendations(contentId);
    }
  }
  
  private async getMovieRecommendations(movieId: number): Promise<UnifiedRecommendation[]> {
    const tmdbRecs = await tmdbService.getMovieRecommendations(movieId);
    
    return tmdbRecs.map(rec => ({
      id: `movie-${rec.id}`,
      type: 'movie',
      title: rec.title!,
      description: rec.overview,
      imageUrl: rec.poster_path,
      rating: rec.vote_average,
      sourceId: rec.id,
    }));
  }
  
  private async getTVRecommendations(tvShowId: number): Promise<UnifiedRecommendation[]> {
    // Get the show from database
    const show = await db.query.tvShows.findFirst({
      where: eq(tvShows.id, tvShowId)
    });
    
    if (!show) return [];
    
    // Check if we have TMDB ID, if not try to find it
    let tmdbId = show.tmdbId;
    
    if (!tmdbId) {
      const tmdbMatch = await tmdbService.searchTVByName(show.title);
      if (tmdbMatch) {
        tmdbId = tmdbMatch.id;
        // Update database with TMDB ID
        await db.update(tvShows)
          .set({ tmdbId, tmdbRecognized: true })
          .where(eq(tvShows.id, tvShowId));
      } else {
        // Mark as not recognized by TMDB
        await db.update(tvShows)
          .set({ tmdbRecognized: false })
          .where(eq(tvShows.id, tvShowId));
        return []; // No recommendations for non-TMDB shows
      }
    }
    
    // Get recommendations from TMDB
    const tmdbRecs = await tmdbService.getTVRecommendations(tmdbId);
    
    return tmdbRecs.map(rec => ({
      id: `tv-${rec.id}`,
      type: 'tv',
      title: rec.name!,
      description: rec.overview,
      imageUrl: rec.poster_path,
      rating: rec.vote_average,
      sourceId: rec.id,
      tmdbRecognized: true,
    }));
  }
  
  private async getAnimeRecommendations(animeId: number): Promise<UnifiedRecommendation[]> {
    const jikanRecs = await jikanService.getAnimeRecommendations(animeId);
    
    return jikanRecs.map(rec => ({
      id: `anime-${rec.entry.mal_id}`,
      type: 'anime',
      title: rec.entry.title,
      description: '', // Jikan recs don't include description
      imageUrl: rec.entry.images.jpg.large_image_url,
      rating: 0, // Jikan recs don't include rating
      sourceId: rec.entry.mal_id,
    }));
  }
}
```

### 3. API Routes

```typescript
// server/routes.ts

// Get recommendations for specific content
app.get('/api/recommendations/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  
  if (!['movie', 'tv', 'anime'].includes(type)) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  
  try {
    const recommendations = await recommendationService.getRecommendationsForContent(
      type as 'movie' | 'tv' | 'anime',
      parseInt(id)
    );
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});
```

### 4. Frontend Implementation

#### 4.1 Recommendations Component (`client/src/components/Recommendations.tsx`)

```typescript
interface RecommendationsProps {
  contentType: 'movie' | 'tv' | 'anime';
  contentId: number;
}

export function Recommendations({ contentType, contentId }: RecommendationsProps) {
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['/api/recommendations', contentType, contentId],
  });
  
  if (isLoading) return <RecommendationsSkeleton />;
  if (!recommendations?.length) return null;
  
  return (
    <div className="recommendations-section">
      <h2 className="text-2xl font-headline mb-4">You Might Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommendations.map(rec => (
          <ContentCard key={rec.id} content={rec} />
        ))}
      </div>
    </div>
  );
}
```

### 5. Content Browsing & Search Logic

#### 5.1 Browse/Discovery Feed

```typescript
// server/routes.ts

app.get('/api/browse/tv', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  
  // Get TV shows, prioritizing TMDB-recognized ones
  const shows = await db.query.tvShows.findMany({
    orderBy: [
      desc(tvShows.tmdbRecognized), // TMDB-recognized first
      desc(tvShows.rating),          // Then by rating
      desc(tvShows.popularity)       // Then by popularity
    ],
    limit: 20,
    offset: (page - 1) * 20
  });
  
  res.json(shows);
});
```

#### 5.2 Search (All Shows Included)

```typescript
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  
  // Search across all sources, no filtering by TMDB recognition
  const results = await Promise.all([
    searchMovies(query),
    searchTVShows(query), // Includes ALL TVMaze shows
    searchAnime(query)
  ]);
  
  res.json({
    movies: results[0],
    tv: results[1],
    anime: results[2]
  });
});
```

---

## Implementation Phases

### Phase 1: Database & Service Layer (Week 1)
- [ ] Add `tmdbId` and `tmdbRecognized` columns to `tv_shows` table
- [ ] Implement TMDB recommendation endpoints in `tmdb.ts`
- [ ] Implement Jikan recommendation endpoints in `jikan.ts`
- [ ] Create `RecommendationService` with unified interface

### Phase 2: TMDB Cross-Reference Sync (Week 2)
- [ ] Create migration script to match existing TVMaze shows with TMDB
- [ ] Implement automatic TMDB lookup on new TVMaze show insertion
- [ ] Add background job to periodically update TMDB references

### Phase 3: API Routes (Week 3)
- [ ] Implement `/api/recommendations/:type/:id` endpoint
- [ ] Update browse endpoints to deprioritize non-TMDB shows
- [ ] Ensure search includes all shows regardless of TMDB recognition

### Phase 4: Frontend Integration (Week 4)
- [ ] Build `Recommendations` component
- [ ] Add recommendations to content detail pages
- [ ] Update browse/discovery feeds
- [ ] Add loading states and error handling

### Phase 5: Optimization (Week 5)
- [ ] Implement caching for recommendation results (24-hour TTL)
- [ ] Add rate limiting for Jikan API calls
- [ ] Optimize database queries with indexes
- [ ] Monitor API usage and costs

---

## Rate Limiting Considerations

### TMDB
- No strict public rate limits documented
- Best practice: Cache responses for 24 hours
- Consider implementing client-side rate limiting (e.g., 40 requests/10 seconds)

### Jikan (MyAnimeList)
- **Hard limit**: 3 requests/second, 60 requests/minute
- **Must implement**: Request queue with delays
- **Recommended**: Use response caching aggressively

```typescript
// Example rate limiter for Jikan
class JikanRateLimiter {
  private queue: Array<() => void> = [];
  private lastRequest = 0;
  private readonly minInterval = 334; // ~3 requests per second
  
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
}
```

---

## Caching Strategy

### Recommendation Cache
```typescript
// Redis or in-memory cache
const recommendationCache = new Map<string, {
  data: UnifiedRecommendation[];
  timestamp: number;
}>();

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getCachedRecommendations(
  type: string,
  id: number
): Promise<UnifiedRecommendation[] | null> {
  const key = `${type}:${id}`;
  const cached = recommendationCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}
```

---

## Error Handling

### TMDB Failures
- Log error
- Return empty array (graceful degradation)
- Show "No recommendations available" message

### Jikan Failures
- Check for rate limit (429) response
- Implement exponential backoff
- Return cached data if available
- Show "Recommendations temporarily unavailable"

### TVMaze Show Not in TMDB
- Mark show as `tmdbRecognized: false`
- Don't show in recommendation feeds
- Still show in search results
- Display message: "Limited recommendations available for this show"

---

## Testing Checklist

- [ ] Movie recommendations display correctly
- [ ] TV show recommendations work for TMDB-recognized shows
- [ ] TV shows not in TMDB are excluded from recommendations
- [ ] Non-TMDB shows still appear in search
- [ ] Anime recommendations work with Jikan
- [ ] Rate limiting prevents Jikan API errors
- [ ] Cache reduces redundant API calls
- [ ] Error states display gracefully
- [ ] Browse feed prioritizes TMDB-recognized content
- [ ] TMDB cross-reference lookup works on new shows

---

## Monitoring & Metrics

Track the following:
- API call volume (TMDB, Jikan)
- Cache hit rate
- TMDB recognition rate for TVMaze shows
- Recommendation engagement (click-through rate)
- Error rates by API
- Average response time

---

## Future Enhancements

### Personalized Recommendations
- Implement user watch history tracking
- Create hybrid recommendation algorithm combining:
  - API native recommendations
  - User viewing patterns
  - Genre preferences

### Cross-Source Recommendations
- Recommend anime to movie watchers (and vice versa)
- Use genre mapping to find cross-platform matches

### Machine Learning Layer
- Train custom model on user engagement data
- Improve TMDB matching accuracy for TVMaze shows
- Predict show popularity trends

---

## References

- [TMDB API Documentation](https://developer.themoviedb.org/reference/intro/getting-started)
- [Jikan API Documentation](https://docs.api.jikan.moe/)
- [TVMaze API Documentation](https://www.tvmaze.com/api)
