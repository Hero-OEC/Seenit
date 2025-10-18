# Phase 0: Pre-Migration Analysis
## Seenit - Movie/TV/Anime Tracking Application

**Current Stack:** Replit (Express + Vite) + PostgreSQL  
**Target Stack:** Cloudflare Workers + Supabase (Database + Auth)  
**Analysis Date:** October 18, 2025  
**Status:** ✅ Complete

---

## Executive Summary

This document provides a comprehensive analysis of the current Seenit application architecture before migrating to Cloudflare Workers and Supabase. The application is a full-stack content tracking platform that allows users to browse and track movies, TV shows, and anime.

### Current State
- **Backend:** Express.js REST API with 50+ endpoints
- **Frontend:** React (Vite) with 10 pages
- **Database:** PostgreSQL with 4 tables, 2,993 content records
- **Background Jobs:** 2 services (Sync Manager, Rating Backfill Manager)
- **Data Sources:** TVMaze (TV shows), TMDB (movies), Jikan (anime)

---

## 1. API Endpoints Inventory

### 1.1 Content Endpoints (Public)

| Endpoint | Method | Description | Auth Required | Query Params |
|----------|--------|-------------|---------------|--------------|
| `/api/content` | GET | Get all content | No | - |
| `/api/content/type/:type` | GET | Get content by type (movie/tv/anime) | No | `page`, `limit`, `genre`, `sort` |
| `/api/content/search` | GET | Search content | No | `q` (required) |
| `/api/content/search/suggestions` | GET | Get search suggestions | No | `q` (min 2 chars) |
| `/api/content/recommended` | GET | Get random recommendations | No | - |
| `/api/content/schedule/:date` | GET | Get episodes airing on date | No | `type` (tv/anime) |
| `/api/content/trending-movies-with-trailers` | GET | Get trending movies with trailers | No | `limit` (default 5, max 20) |
| `/api/content/recent-episodes` | GET | Get recent episodes (top 10) | No | - |
| `/api/content/featured` | GET | Get featured content for hero | No | - |
| `/api/content/:id` | GET | Get content by ID | No | - |
| `/api/content` | POST | Create content | No | Content data (validated) |
| `/api/content/:contentId/recommendations` | GET | Get recommendations for content | No | - |

**Response Format:** JSON with enriched season/episode info
**Pagination:** Offset-based with `page` and `limit`
**Error Handling:** 400 for validation, 404 for not found, 500 for server errors

### 1.2 User Content Tracking (Protected Routes)

| Endpoint | Method | Description | Auth Required | Body/Params |
|----------|--------|-------------|---------------|-------------|
| `/api/users/:userId/content` | GET | Get user's watchlist | Yes | - |
| `/api/users/:userId/content/status/:status` | GET | Get user content by status | Yes | Status: watching/watched/want_to_watch |
| `/api/users/:userId/content` | POST | Add to user's list | Yes | `contentId`, `status`, `progress`, `userRating` |
| `/api/users/:userId/content/:contentId` | PATCH | Update user content | Yes | `status`, `progress`, `userRating` |
| `/api/users/:userId/content/:contentId` | DELETE | Remove from list | Yes | - |
| `/api/users/:userId/stats` | GET | Get user statistics | Yes | - |

**Auth Implementation:** Currently userId-based (no actual auth middleware)
**Note:** These routes will be protected with Supabase Auth middleware after migration

### 1.3 User Management

| Endpoint | Method | Description | Auth Required | Body |
|----------|--------|-------------|---------------|------|
| `/api/users` | POST | Create user | No | `username`, `email`, `password` |

**Current Auth:** Basic user creation, no login/session management
**Migration Note:** Will be replaced entirely with Supabase Auth

### 1.4 Import Management (Admin Routes)

#### TVMaze Import
| Endpoint | Method | Description | Body/Params |
|----------|--------|-------------|-------------|
| `/api/import/tvmaze/status` | GET | Get import status | - |
| `/api/import/tvmaze/start` | POST | Start/resume sync | - |
| `/api/import/tvmaze/pause` | POST | Pause sync | - |
| `/api/import/tvmaze/content` | GET | Get imported content (20 items) | - |
| `/api/import/tvmaze/data` | DELETE | Delete all TVMaze data & reset | - |

#### Jikan (Anime) Import
| Endpoint | Method | Description | Body/Params |
|----------|--------|-------------|-------------|
| `/api/import/jikan/status` | GET | Get import status | - |
| `/api/import/jikan/start` | POST | Start import | - |
| `/api/import/jikan/pause` | POST | Pause import | - |
| `/api/import/jikan/content` | GET | Get imported content (20 items) | - |
| `/api/import/jikan/data` | DELETE | Delete all Jikan data & reset | - |

#### TMDB (Movies) Import
| Endpoint | Method | Description | Body/Params |
|----------|--------|-------------|-------------|
| `/api/import/tmdb/status` | GET | Get import status | - |
| `/api/import/tmdb/pause` | POST | Pause import | - |
| `/api/import/tmdb/content` | GET | Get imported content (20 items) | - |
| `/api/import/tmdb/data` | DELETE | Delete all TMDB data | - |
| `/api/import/tmdb/movies` | POST | Import popular movies | `maxPages` (1-500, default 20) |
| `/api/import/tmdb/recent` | POST | Import recent movies | `maxPages` (1-100, default 10) |
| `/api/import/tmdb/hybrid` | POST | Import popular + recent | `popularPages`, `recentPages` |
| `/api/import/tmdb/comprehensive` | POST | Import comprehensive | `maxPages` (1-500, default 100) |

#### Generic Import
| Endpoint | Method | Description | Params |
|----------|--------|-------------|--------|
| `/api/import/:source/data` | DELETE | Delete data from source | `source` (tvmaze/tmdb/jikan/manual) |

### 1.5 TMDB Integration

| Endpoint | Method | Description | Params |
|----------|--------|-------------|--------|
| `/api/tmdb/search/movies` | GET | Search movies via TMDB | `q` (required), `page` |
| `/api/tmdb/movie/:id` | GET | Get movie details by TMDB ID | TMDB movie ID |

### 1.6 Rating Management

| Endpoint | Method | Description | Auth | Params |
|----------|--------|-------------|------|--------|
| `/api/ratings/status` | GET | Get rating statistics & OMDb quota | No | - |
| `/api/ratings/update` | POST | Update IMDb ratings (manual trigger) | Yes | `limit` (max 1000), requires `X-Admin-Secret` header or `?secret=` |

**Admin Auth:** Uses `ADMIN_SECRET` environment variable (currently `dev-secret-change-in-production`)

---

## 2. Database Schema & Relationships

### 2.1 Tables Overview

| Table | Purpose | Row Count | Foreign Keys |
|-------|---------|-----------|--------------|
| `users` | User accounts | 0 | - |
| `content` | Movies, TV shows, anime | 2,993 | - |
| `user_content` | User watchlists | 0 | `userId` → users, `contentId` → content |
| `import_status` | Import job state | 2 | - |

### 2.2 Users Table

```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Indexes:** Unique on `username` and `email`
**Migration Impact:** This table will be replaced with Supabase `auth.users` + `profiles` table

### 2.3 Content Table (Core Data Model)

**Common Fields:**
- `id` (varchar, UUID primary key)
- `title`, `type` (movie/tv/anime), `source` (tmdb/tvmaze/jikan/manual), `sourceId`
- `overview`, `genres[]`, `year`, `endYear`, `rating`, `poster`, `backdrop`, `status`

**Rating Sources:**
- `imdbId`, `imdbRating`, `rottenTomatoesRating`, `malRating`

**Movie-Specific (TMDB):**
- `runtime`, `releaseDate`, `trailerKey`

**TV-Specific (TVMaze):**
- `totalSeasons`, `totalEpisodes`, `network`, `airTime`, `airDays[]`, `episodeData` (JSONB)

**Anime-Specific (Jikan/MAL):**
- `episodes`, `season`, `studio`, `sourceMaterial`, `animeType`
- `seriesKey`, `seriesRootSourceId`, `seasonNumber`, `seasonTitle` (for grouping anime seasons)

**Additional Metadata:**
- `streamingPlatforms[]`, `affiliateLinks[]`, `tags[]`, `popularity`, `voteCount`
- `lastUpdated`, `createdAt`

**Current Data Distribution:**
- Movies: 5 (TMDB source)
- TV Shows: 2,988 (TVMaze source)
- Anime: 0 (Jikan source)

**Indexes:** None explicit (relies on primary key)
**Migration Note:** Schema will remain mostly unchanged, may add indexes on `type`, `source`, `popularity`

### 2.4 User Content Table (Watchlist)

```typescript
export const userContent = pgTable("user_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // No FK constraint in current schema
  contentId: varchar("content_id").notNull(), // No FK constraint
  status: text("status").notNull(), // 'watching', 'watched', 'want_to_watch'
  progress: integer("progress").default(0), // episodes watched
  userRating: integer("user_rating"), // 1-5 stars
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Current Constraints:** None (should add FK constraints during migration)
**Migration Impact:** Update `userId` to reference `profiles.id` (Supabase auth UUID)

### 2.5 Import Status Table

```typescript
export const importStatus = pgTable("import_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // 'tmdb', 'tvmaze', 'jikan', 'rating_backfill_state'
  isActive: boolean("is_active").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  totalImported: integer("total_imported").default(0),
  totalAvailable: integer("total_available").default(0),
  currentPage: integer("current_page").default(1),
  phase1Progress: text("phase1_progress"),
  phase2Progress: text("phase2_progress"),
  phase3Progress: text("phase3_progress"),
  errors: text("errors").array(),
  cursor: jsonb("cursor"), // Multi-phase resume state
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Usage:** Tracks state for background import jobs and rating backfill
**Migration Note:** Will be retained for managing background job state

---

## 3. Environment Variables

### 3.1 Current Environment Variables

| Variable | Type | Purpose | Migration Status |
|----------|------|---------|------------------|
| `DATABASE_URL` | Secret | PostgreSQL connection | Replace with `SUPABASE_DATABASE_URL` |
| `TMDB_API_KEY` | Secret | TMDB API access | Keep |
| `OMDB_API_KEY` | Secret | OMDb rating API | Keep (not currently set) |
| `SESSION_SECRET` | Secret | Express session encryption | Remove (Supabase handles sessions) |
| `ADMIN_SECRET` | Secret | Admin route protection | Keep for admin operations |
| `PGDATABASE` | Auto | Replit database name | Remove |
| `REPLIT_DB_URL` | Auto | Replit KV store | Remove |

**Note:** OMDB_API_KEY is not currently set in environment, OMDb service has fallback

### 3.2 New Environment Variables for Migration

| Variable | Type | Purpose |
|----------|------|---------|
| `SUPABASE_URL` | Public | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public | Supabase anon key (for frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role (backend admin) |
| `SUPABASE_DATABASE_URL` | Secret | Supabase direct database connection |
| `VITE_SUPABASE_URL` | Public | Frontend Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Public | Frontend Supabase anon key |
| `VITE_API_URL` | Public | Cloudflare Workers API URL |

---

## 4. Background Services

### 4.1 Sync Manager (`server/services/syncManager.ts`)

**Purpose:** Orchestrates daily content sync from TVMaze and Jikan APIs

**Schedule:**
- Hourly checks (every 60 minutes)
- TVMaze sync: 8 AM daily
- Jikan sync: 9 AM daily

**Logic:**
```typescript
MORNING_HOUR = 8 (TVMaze)
JIKAN_MORNING_HOUR = 9 (Jikan)
SYNC_CHECK_INTERVAL = 60 * 60 * 1000 (1 hour)
```

**Behavior:**
1. Checks every hour if it's time for morning sync
2. Only runs if not already active and haven't synced today
3. Monitors sync progress every 30 seconds
4. Initial sync starts immediately if no content exists

**Migration Plan:**
- Convert to Cloudflare Cron Triggers
- Cron: `0 8 * * *` (TVMaze), `0 9 * * *` (Jikan)
- Use KV namespace for distributed locking

### 4.2 Rating Backfill Manager (`server/services/ratingBackfillManager.ts`)

**Purpose:** Continuously backfill missing IMDb ratings from OMDb API

**Schedule:**
- Every 5 minutes (300,000 ms)
- Initial run 5 seconds after startup

**Logic:**
```typescript
INTERVAL = 5 * 60 * 1000 (5 minutes)
BATCH_SIZE = 200
LOCK_DURATION_MS = 15 * 60 * 1000 (15 minutes)
```

**Behavior:**
1. Acquires lock to prevent concurrent runs
2. Checks OMDb quota availability
3. Fetches unrated content (prioritized by popularity)
4. Processes batch of 200 items max
5. Updates content with IMDb ratings
6. Tracks state in `import_status` table

**OMDb Quota Management:**
- Uses `server/services/omdb.ts` and `quotaProvider.ts`
- Respects daily API limits
- Auto-pauses when exhausted

**Migration Plan:**
- Convert to Cloudflare Cron Trigger: `*/5 * * * *` (every 5 minutes)
- Use KV namespace for distributed locking
- Maintain quota tracking logic

---

## 5. Dependencies Audit

### 5.1 Backend Dependencies to Remove

| Package | Reason | Replacement |
|---------|--------|-------------|
| `passport` | Will use Supabase Auth | `@supabase/supabase-js` |
| `passport-local` | Part of Passport ecosystem | `@supabase/supabase-js` |
| `express-session` | Session management | Supabase handles sessions |
| `connect-pg-simple` | Session store for PostgreSQL | N/A |
| `memorystore` | Session store fallback | N/A |
| `express` | Will migrate to Cloudflare Workers | `hono` |
| `ws` | WebSocket (not used in Workers) | N/A |

### 5.2 New Dependencies to Add

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client for auth & database |
| `hono` | Lightweight web framework for Workers |
| `@cloudflare/workers-types` | TypeScript types for Workers |
| `wrangler` | Cloudflare Workers CLI |

### 5.3 Dependencies to Keep

**Database & ORM:**
- `drizzle-orm` ✅
- `drizzle-kit` ✅
- `drizzle-zod` ✅
- `@neondatabase/serverless` ✅ (or replace with `postgres` for Supabase)

**Frontend:**
- `react`, `react-dom` ✅
- `wouter` ✅ (routing)
- `@tanstack/react-query` ✅
- `@radix-ui/*` ✅ (UI components)
- `lucide-react` ✅ (icons)
- All Tailwind/Vite packages ✅

**Utilities:**
- `zod` ✅
- `date-fns` ✅
- `clsx`, `tailwind-merge` ✅

**API Services:**
- All TMDB/OMDb/Jikan service code can be reused ✅

---

## 6. Data Volumes

### 6.1 Current Database Statistics

```sql
Total Records: 2,993
├── Users: 0
├── Content: 2,993
│   ├── Movies (TMDB): 5
│   ├── TV Shows (TVMaze): 2,988
│   └── Anime (Jikan): 0
├── User Content: 0
└── Import Status: 2
```

### 6.2 Content Breakdown by Source

| Source | Count | Type | Notes |
|--------|-------|------|-------|
| TMDB | 5 | Movies | Trending movies with trailers |
| TVMaze | 2,988 | TV Shows | Initial sync complete |
| Jikan | 0 | Anime | Not yet synced |

### 6.3 Storage Estimate for Supabase

**Content Table:**
- Rows: ~3,000 (will grow to ~50,000+ with full imports)
- Average row size: ~2-4 KB (with JSONB episode data)
- Current storage: ~6-12 MB
- Projected storage: ~100-200 MB (full dataset)

**Episode Data (JSONB):**
- TVMaze shows average ~50-100 episodes each
- Full episode data stored per show
- Largest JSONB fields in database

**Supabase Free Tier:** 500 MB database (sufficient for MVP)
**Recommended Plan:** Pro ($25/month) for 8 GB + auto-scaling

---

## 7. Critical User Flows

### 7.1 User Registration & Login

**Current Implementation:**
1. User clicks "Get Started" → `/signin` page
2. User enters username, email, password
3. POST `/api/users` creates user (no password hashing currently)
4. No login flow or session management
5. User ID manually passed in API calls

**Post-Migration:**
1. User clicks "Get Started" → Sign up form
2. Supabase Auth handles registration with `signUp(email, password, { data: { username } })`
3. Database trigger auto-creates profile in `profiles` table
4. User receives email confirmation (optional)
5. Frontend stores session in localStorage via Supabase client
6. All API calls include `Authorization: Bearer <token>` header

### 7.2 Browse Content

**Flow:**
1. User lands on `/` homepage
2. Featured movie/show displayed in hero section
3. Trending movies carousel loads (GET `/api/content/trending-movies-with-trailers`)
4. Recent episodes section (GET `/api/content/recent-episodes`)
5. User navigates to `/discover` to filter by type/genre
6. Pagination loads more content

**Auth:** Not required (public endpoints)
**No changes needed for migration**

### 7.3 Search Content

**Flow:**
1. User types in search bar (navbar)
2. Autocomplete suggestions appear (GET `/api/content/search/suggestions?q=...`)
3. User presses Enter → navigates to `/search?q=...`
4. Full results displayed with filters
5. GET `/api/content/search?q=...`

**Auth:** Not required
**No changes needed**

### 7.4 View Content Details

**Flow:**
1. User clicks content card → `/content/:id`
2. GET `/api/content/:id` fetches details
3. Display: title, poster, overview, rating, trailer (if movie)
4. Show episode list (if TV/anime)
5. "Add to Watchlist" button (requires auth)
6. Recommendations section (GET `/api/content/:contentId/recommendations`)

**Auth:** Optional (watchlist requires auth)
**Post-Migration:** Use Supabase Auth to check `user` state

### 7.5 Add to Watchlist

**Current Flow:**
1. User clicks "Add to Watchlist"
2. POST `/api/users/:userId/content` with `{ contentId, status: 'want_to_watch' }`
3. No actual auth check (userId in URL)

**Post-Migration:**
1. User must be signed in (Supabase Auth)
2. Frontend sends request with `Authorization: Bearer <token>`
3. Backend verifies token, extracts `userId` from JWT
4. POST `/api/user/watchlist` (no userId in URL needed)
5. RLS policy ensures user can only add to their own list

### 7.6 View Schedule

**Flow:**
1. User navigates to `/schedule`
2. Calendar view shows this week
3. User clicks date → expands to show episodes airing that day
4. GET `/api/content/schedule/:date?type=tv`
5. Filter by TV Shows or Anime

**Auth:** Not required
**No changes needed**

---

## 8. Screenshots (Captured)

### 8.1 Homepage
- Hero section with featured movie ("Our Fault")
- "Add to Watchlist" and "View Details" CTAs
- Trending movies carousel (loading)
- Recent episodes section

### 8.2 Discover Page
- Filter by type: Movies, TV Shows, Anime
- Genre filter dropdown
- Sort by: Popular
- Movie grid showing 5 movies:
  - The Woman in Cabin 10 (2025)
  - TRON: Ares (2025)
  - Our Fault (2025)
  - A Big Bold Beautiful Journey (2025)
  - Mission: Impossible - The Final Reckoning (2025)
- Pagination info: "Total movies: 5, Showing: 5"

### 8.3 Schedule Page
- Filter by type: TV Shows, Anime
- Calendar view for "This Week's Schedule"
- Expandable days (Today, Tomorrow)
- No episodes scheduled for today (empty state shown)

---

## 9. Migration Complexity Assessment

### 9.1 Low Risk Items ✅
- Database schema migration (mostly compatible)
- TMDB/OMDb/Jikan service code (uses fetch, no Node-specific APIs)
- Frontend code (React, no changes needed)
- Static content serving

### 9.2 Medium Risk Items ⚠️
- Background job conversion (setInterval → Cron Triggers)
- Database connection (long-running pools → serverless)
- Session management (Express sessions → Supabase Auth)
- RLS policy implementation (new security model)

### 9.3 High Risk Items 🔴
- User authentication migration (Passport → Supabase)
- Episode data JSONB queries (ensure compatibility)
- Distributed locking for cron jobs (KV namespace)
- Testing background jobs on Cloudflare cron schedule

---

## 10. Pre-Migration Recommendations

### 10.1 Data Backup
1. ✅ Export current database schema: `npm run db:push` (already documented)
2. Export content table (optional, can re-sync from APIs)
3. Export users table (0 rows currently, no action needed)

### 10.2 Testing Strategy
1. Create Supabase test project for Phase 1
2. Test RLS policies with multiple user accounts
3. Validate episode data JSONB structure in Supabase
4. Load test background jobs locally before deploying

### 10.3 Risk Mitigation
1. Keep Replit deployment running during migration
2. Use feature flags for gradual rollout
3. Monitor error rates in Cloudflare Workers dashboard
4. Prepare rollback plan (documented in migration plan)

---

## 11. Next Steps

### Phase 1: Supabase Database Setup
1. Create Supabase account and project
2. Update `shared/schema.ts` (users → profiles)
3. Add RLS policies
4. Push schema to Supabase
5. Test database connection

**Estimated Time:** 2-4 hours  
**Blockers:** None

### Phase 2: Supabase Authentication
1. Install `@supabase/supabase-js`
2. Create Supabase clients (frontend + backend)
3. Replace user routes with Supabase Auth
4. Implement auth middleware
5. Update frontend with AuthContext

**Estimated Time:** 4-6 hours  
**Blockers:** Phase 1 complete

### Phase 3: Backend Migration to Workers
1. Set up Cloudflare Workers project with Hono
2. Migrate route handlers
3. Test locally with `wrangler dev`
4. Deploy to staging

**Estimated Time:** 6-8 hours  
**Blockers:** Phase 2 complete

---

## 12. Success Metrics

✅ Phase 0 Complete When:
- [x] All API endpoints documented
- [x] Database schema mapped
- [x] Environment variables listed
- [x] Background services analyzed
- [x] Dependencies reviewed
- [x] Data volumes estimated
- [x] User flows documented
- [x] Screenshots captured
- [x] Analysis document created

**Status:** ✅ **PHASE 0 COMPLETE** - Ready to proceed to Phase 1
