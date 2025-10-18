# Phase 1: Supabase Database Setup - Deployment Guide

**Status:** ✅ **READY FOR CREDENTIALS**  
**Last Updated:** October 18, 2025  
**Architect Review:** ✅ Passed all security and integrity checks

---

## What's Been Completed

### 1. Database Schema Migration ✅

**File:** `shared/schema.ts`

**Changes:**
- ✅ Replaced `users` table with `profiles` table
- ✅ `profiles.id` uses UUID type to match Supabase auth.users
- ✅ Added foreign key: `user_content.user_id` → `profiles.id` (cascade delete)
- ✅ Added foreign key: `user_content.content_id` → `content.id` (cascade delete)
- ✅ All TypeScript types updated (Profile, InsertProfile)

**Tables:**
```
profiles       - User profile data (links to auth.users)
content        - Movies, TV shows, anime
user_content   - User watchlists
import_status  - Background job state
```

### 2. Row Level Security (RLS) Policies ✅

**File:** `supabase/migrations/001_apply_after_push.sql`

**Security Model:**
- ✅ **Profiles:** Users can read/update their own profile only
- ✅ **User Content:** Users can manage only their own watchlist
- ✅ **Content:** Public read, service role write (admin/import only)
- ✅ **Import Status:** Public read, service role write (background jobs only)

**Additional Features:**
- ✅ Foreign key constraint: `profiles.id` → `auth.users(id)`
- ✅ Auto-trigger: Creates profile on user signup
- ✅ Username default: Uses metadata or email prefix

### 3. Supabase Client Setup ✅

**Frontend Client:** `client/src/lib/supabase.ts`
- Uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Configured for session persistence and auto-refresh
- Gracefully handles missing credentials (dev mode)

**Backend Client:** `server/supabaseClient.ts`
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Includes `verifySupabaseAuth()` helper for protected routes
- Fails fast if credentials missing (production mode)

### 4. Package Installation ✅

**Installed:**
- `@supabase/supabase-js` (v2.x)

---

## Required Environment Variables

Once you provide these credentials, I'll add them to your environment:

| Variable | Type | Purpose | Where to Use |
|----------|------|---------|--------------|
| `DATABASE_URL` | Secret | Direct database connection for Drizzle ORM | Backend (Drizzle) |
| `SUPABASE_URL` | Public | Supabase project URL | Backend (Service role client) |
| `SUPABASE_ANON_KEY` | Public | Supabase anonymous key | Backend + Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key (admin) | Backend only |
| `VITE_SUPABASE_URL` | Public | Frontend Supabase URL | Frontend |
| `VITE_SUPABASE_ANON_KEY` | Public | Frontend Supabase anon key | Frontend |

**Note:** `DATABASE_URL` is for direct PostgreSQL connections (used by Drizzle for migrations)

---

## Deployment Steps (Once Credentials Are Provided)

### Step 1: Add Environment Variables
I'll add all 4 credentials you provide to the Replit Secrets.

### Step 2: Push Database Schema
```bash
npm run db:push
```

This creates the tables in Supabase:
- `profiles`
- `content`
- `user_content`
- `import_status`

### Step 3: Apply RLS Policies
I'll execute `supabase/migrations/001_apply_after_push.sql` in Supabase SQL Editor to:
- Add foreign key constraint to `auth.users`
- Enable Row Level Security on all tables
- Create RLS policies
- Install auto-signup trigger

### Step 4: Test Connection
I'll verify:
- ✅ Database connection works
- ✅ Tables exist with correct schema
- ✅ RLS policies are active
- ✅ Frontend/backend clients connect successfully

### Step 5: Migrate Existing Data (Optional)
If you want to preserve your current content data (2,993 TV shows):
```bash
# Export current data
pg_dump $DATABASE_URL > backup.sql

# Import to Supabase (after schema is ready)
psql $NEW_SUPABASE_DATABASE_URL < backup.sql
```

**Note:** Since you have 0 users currently, no user data migration is needed.

---

## Architecture Changes Summary

### Before (Replit PostgreSQL)
```
users table
├─ id (varchar with UUID)
├─ username, email, password
└─ No auth system

user_content
└─ userId (no foreign key)
```

### After (Supabase)
```
auth.users (Supabase managed)
├─ id (UUID)
├─ email, encrypted password
└─ metadata (username)

profiles (public schema)
├─ id (UUID) → FK to auth.users(id)
├─ username
└─ Auto-created via trigger

user_content
└─ userId (UUID) → FK to profiles(id)
```

---

## Security Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Password Storage** | Plain text (insecure) | Encrypted by Supabase |
| **Session Management** | None | Supabase JWT tokens |
| **Row Level Security** | None | Enforced by Supabase RLS |
| **User Isolation** | Manual checks | Database-level policies |
| **Admin Operations** | No protection | Service role only |

---

## What Happens Next

**When you provide the 4 Supabase credentials:**

1. ✅ I'll add them to your environment variables
2. ✅ I'll run `npm run db:push` to create tables
3. ✅ I'll apply the RLS policies SQL
4. ✅ I'll test the connection and verify everything works
5. ✅ I'll update the progress tracker and move to Phase 2

**Estimated Time:** 10-15 minutes after credentials provided

---

## Ready to Proceed

✅ All code changes complete and architect-reviewed  
✅ No blocking issues  
✅ Deployment plan documented  
✅ Waiting for credentials from user

**Please provide your 4 Supabase credentials when ready:**
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
