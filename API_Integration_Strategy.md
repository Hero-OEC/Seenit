# Content APIs Integration Strategy

## Overview

This document outlines the integration strategy for three main content APIs that will power the Seenit entertainment tracker:

1. **TMDB (The Movie Database)** - Movies only
2. **TVmaze** - TV Shows only  
3. **AniList** - Anime/Manga only

## API Analysis

### 1. TMDB (The Movie Database)
**URL:** https://developer.themoviedb.org/  
**Cost:** Free tier with rate limits  
**Authentication:** API key required

#### Rate Limits & Restrictions
- **Current Rate Limit:** ~50 requests per second (per IP address)
- **No daily limits** (as of 2024)
- **Legacy 40 requests/10 seconds** limit was removed
- **Image CDN:** 20 simultaneous connections per IP
- **Best Practice:** Cache responses locally to minimize API calls

#### Key Movie Endpoints
```
GET /movie/popular              # Popular movies
GET /movie/now_playing          # Currently in theaters  
GET /movie/upcoming             # Upcoming releases
GET /movie/{id}                 # Movie details
GET /search/movie?query={text}  # Search movies
GET /movie/{id}/videos          # Trailers & videos
GET /movie/{id}/images          # Movie posters/backdrops
GET /configuration              # Image base URLs & sizes
```

#### Authentication
```bash
# Bearer token method (recommended)
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
https://api.themoviedb.org/3/movie/popular

# API key method (legacy)
curl https://api.themoviedb.org/3/movie/popular?api_key=YOUR_API_KEY
```

#### Daily Sync Strategy
- **Target:** 1000 movies per day (well within rate limits)
- **Method:** Paginate through popular, now_playing, upcoming endpoints
- **Schedule:** Run once daily at low-traffic hours (e.g., 3 AM)
- **Caching:** Store full movie details locally to avoid repeat requests

---

### 2. TVmaze API
**URL:** https://www.tvmaze.com/api  
**Cost:** Completely free  
**Authentication:** No API key required

#### Rate Limits & Features
- **Rate Limit:** 20 requests per 10 seconds per IP
- **No authentication required**
- **CORS enabled** for web applications
- **Show index cached for 24 hours**
- **Real-time episode updates**

#### Key TV Show Endpoints
```
GET /schedule?country=US&date=2025-01-15    # Daily episode schedule
GET /schedule/web?date=2025-01-15           # Streaming/web episodes
GET /updates/shows?since=day                # Shows updated in last 24h
GET /shows/{id}                             # Show details
GET /shows/{id}/episodes                    # All episodes for show
GET /shows/{id}/seasons                     # Show seasons
GET /search/shows?q={query}                 # Search shows
GET /shows?page={page}                      # Browse all shows (paginated)
```

#### Daily Sync Strategy  
- **Method 1:** Use `/schedule` endpoint for daily new episodes
- **Method 2:** Use `/updates/shows?since=day` for changed shows
- **Method 3:** Paginate through `/shows` for bulk show data
- **Target:** All new episodes and show updates daily
- **Schedule:** Multiple runs per day (morning, evening) for episode updates

---

### 3. AniList GraphQL API
**URL:** https://graphql.anilist.co  
**Cost:** Completely free  
**Authentication:** No API key required for basic queries

#### Features & Limitations
- **GraphQL only** (POST requests with JSON)
- **No rate limits** documented (reasonable usage expected)
- **Real-time airing data** included
- **500k+ anime/manga entries**
- **Pagination:** Max 50 items per page

#### Key GraphQL Queries

**Search Anime:**
```graphql
query ($search: String!, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage total }
    media(search: $search, type: ANIME) {
      id title { romaji english }
      description episodes genres averageScore
      coverImage { large medium }
      nextAiringEpisode { episode timeUntilAiring }
      status startDate { year month day }
    }
  }
}
```

**Trending Anime:**
```graphql
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, status: RELEASING, sort: TRENDING_DESC) {
      id title { romaji english }
      episodes genres averageScore trending
      nextAiringEpisode { episode timeUntilAiring }
    }
  }
}
```

**Get Anime Details:**
```graphql
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id title { romaji english native }
    description episodes genres averageScore
    studios { nodes { name } }
    status startDate { year month day }
  }
}
```

#### Daily Sync Strategy
- **Method:** Query trending, popular, and airing anime
- **Real-time:** Use `nextAiringEpisode` data for episode tracking
- **Bulk Import:** Paginate through all anime for initial sync
- **Updates:** Focus on currently airing anime for daily updates

---

## Implementation Plan

### Phase 1: Database Schema Updates
Update the existing schema in `shared/schema.ts` to accommodate all three data sources:

```typescript
export const contentTable = pgTable('content', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'movie', 'tv', 'anime'
  source: text('source').notNull(), // 'tmdb', 'tvmaze', 'anilist'
  sourceId: text('source_id').notNull(), // Original API ID
  
  // Common fields
  description: text('description'),
  genres: text('genres').array(),
  year: integer('year'),
  rating: real('rating'),
  poster: text('poster'),
  backdrop: text('backdrop'),
  status: text('status'), // 'finished', 'ongoing', 'upcoming', etc.
  
  // Movie-specific (TMDB)
  runtime: integer('runtime'),
  releaseDate: date('release_date'),
  
  // TV-specific (TVmaze)
  totalSeasons: integer('total_seasons'),
  totalEpisodes: integer('total_episodes'),
  network: text('network'),
  airTime: text('air_time'),
  airDays: text('air_days').array(),
  
  // Anime-specific (AniList)
  episodes: integer('episodes'),
  studio: text('studio'),
  source_material: text('source_material'), // 'manga', 'light_novel', etc.
  
  // Metadata
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});
```

### Phase 2: API Service Layer
Create service classes for each API in `server/services/`:

```
server/services/
├── tmdb.ts         # Movie data fetching
├── tvmaze.ts       # TV show data fetching  
├── anilist.ts      # Anime data fetching
└── syncManager.ts  # Orchestrates daily syncs
```

### Phase 3: Scheduled Sync Jobs
Implement automated daily sync using Node.js cron jobs:

```typescript
// server/jobs/dailySync.ts
import { CronJob } from 'cron';

// Run at 3 AM daily
const movieSync = new CronJob('0 3 * * *', async () => {
  await syncTMDBMovies();
});

// Run at 6 AM daily
const tvSync = new CronJob('0 6 * * *', async () => {
  await syncTVMazeShows();
});

// Run at 9 AM daily  
const animeSync = new CronJob('0 9 * * *', async () => {
  await syncAniListAnime();
});
```

### Phase 4: Content Deduplication
Implement logic to prevent duplicate content:

```typescript
// Use external IDs for deduplication
const uniqueKey = `${source}_${sourceId}`;

// Check for existing content before inserting
const existingContent = await db
  .select()
  .from(contentTable)  
  .where(eq(contentTable.sourceId, sourceId))
  .where(eq(contentTable.source, source));
```

### Phase 5: Error Handling & Monitoring
- Implement retry logic for failed API calls
- Log sync statistics (success/failure counts)
- Set up alerts for API rate limit issues
- Cache frequently accessed data locally

## Expected Daily Data Volume

### TMDB Movies
- **New releases:** ~50-100 movies/day
- **Updates:** ~200-500 movies/day
- **Total daily requests:** ~500-1000 (well within rate limits)

### TVmaze TV Shows  
- **New episodes:** ~200-400 episodes/day
- **Show updates:** ~100-200 shows/day
- **Total daily requests:** ~1000-2000 (manageable with rate limits)

### AniList Anime
- **Airing episodes:** ~50-100 episodes/day  
- **New anime:** ~5-20 anime/day
- **Updates:** ~100-300 anime/day
- **Total daily requests:** ~500-1000 (no documented limits)

## Content Storage Strategy

### Local Database Benefits
1. **Fast queries** - No API latency for user interactions
2. **Offline capability** - App works without internet
3. **Custom filtering** - Advanced search without API limitations
4. **Rate limit protection** - Reduce external API calls
5. **Data consistency** - Unified schema across all sources

### Sync Schedule Recommendation
```
03:00 - TMDB movie sync (low traffic hours)
06:00 - TVmaze show sync (before peak usage)
09:00 - AniList anime sync (morning update)
18:00 - Quick episode update sync (evening check)
```

## Trailer Integration

Each API provides trailer/video data:

### TMDB Trailers
```
GET /movie/{id}/videos
- Returns YouTube keys for trailers
- Multiple trailer types available
```

### TVmaze Videos  
```
Limited video support
- Some shows have trailer URLs in show data
```

### AniList Trailers
```graphql
media { 
  trailer { id site thumbnail } 
}
# Returns YouTube video IDs
```

## Implementation Timeline

- **Week 1:** Database schema updates and API service setup
- **Week 2:** TMDB movie integration and testing
- **Week 3:** TVmaze TV show integration  
- **Week 4:** AniList anime integration
- **Week 5:** Sync job scheduling and monitoring
- **Week 6:** Testing, optimization, and deployment

This strategy ensures comprehensive content coverage while respecting each API's limitations and maximizing the free tier benefits.