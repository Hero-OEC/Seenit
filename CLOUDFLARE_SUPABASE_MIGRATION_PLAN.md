# Cloudflare Workers + Supabase Migration Plan

**Project:** Seenit - Movie/TV/Anime Tracking Application  
**Current Stack:** Replit (Express + Vite) + PostgreSQL  
**Target Stack:** Cloudflare Workers + Supabase (Database + Auth)  
**Migration Date:** TBD

---

## Table of Contents
- [Phase 0: Pre-Migration Analysis](#phase-0-pre-migration-analysis)
- [Phase 1: Supabase Database Setup](#phase-1-supabase-database-setup)
- [Phase 2: Supabase Authentication Integration](#phase-2-supabase-authentication-integration)
- [Phase 3: Backend Migration to Cloudflare Workers](#phase-3-backend-migration-to-cloudflare-workers)
- [Phase 4: Background Jobs Migration](#phase-4-background-jobs-migration)
- [Phase 5: Frontend Updates](#phase-5-frontend-updates)
- [Phase 6: Deployment & Testing](#phase-6-deployment--testing)
- [Phase 7: DNS & Production Cutover](#phase-7-dns--production-cutover)

---

## Phase 0: Pre-Migration Analysis

### Objective
Document current application architecture, dependencies, and create backups before making any changes.

### Tasks

#### 0.1 Current State Documentation
- [ ] **Inventory all API endpoints** in `server/routes.ts`
  - Document request/response formats
  - Note any authentication requirements
  - List all query parameters and filters
- [ ] **Map all database tables** and relationships
  - Users, content, userContent, importStatus
  - Document indexes and constraints
- [ ] **Document environment variables** currently in use
  - `DATABASE_URL`, `TMDB_API_KEY`, `OMDB_API_KEY`, etc.
  - Note which are secret vs. public
- [ ] **List all background services**
  - Sync Manager (hourly checks, 8 AM TVMaze, 9 AM Jikan)
  - Rating Backfill Manager (every 5 minutes)
  - Document their dependencies and data flow

#### 0.2 Dependencies Audit
- [ ] **Review package.json** dependencies
  - Mark packages to remove: `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`
  - Mark packages to add: `@supabase/supabase-js`, `hono`, `@cloudflare/workers-types`
  - Identify Cloudflare Workers-compatible alternatives for incompatible packages

#### 0.3 Data Backup Strategy
- [ ] **Export current database schema**
  - Run `drizzle-kit introspect` to document current schema
  - Save output as `pre-migration-schema.sql`
- [ ] **Create data export scripts** (if needed for migration)
  - Export users table
  - Export content table (or plan to re-sync from APIs)
  - Export userContent (user watchlists/ratings)
- [ ] **Document current data volumes**
  - Row counts for each table
  - Estimate storage needs on Supabase

#### 0.4 Testing Baseline
- [ ] **Document critical user flows**
  - User registration/login
  - Browse movies/TV shows/anime
  - Search functionality
  - Add to watchlist
  - View details page
- [ ] **Capture screenshots** of key pages
  - Homepage, Discover, Schedule
  - Movie/TV/Anime detail pages
  - User profile/watchlist

---

## Phase 1: Supabase Database Setup

### Objective
Create Supabase project, configure database connection, and migrate schema with authentication support.

### Tasks

#### 1.1 Supabase Project Creation
- [ ] **Create Supabase account** at https://supabase.com
- [ ] **Create new project**
  - Choose region closest to your users
  - Set strong database password (save to password manager)
  - Wait for project provisioning (~2 minutes)
- [ ] **Collect credentials**
  - Project URL: `https://[PROJECT_REF].supabase.co`
  - Anon Key (public): `eyJhbG...` (for frontend)
  - Service Role Key (secret): `eyJhbG...` (for backend admin operations)
  - Database URL (Direct Connection): `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`

#### 1.2 Schema Adjustments for Supabase Auth

**Current Schema Issues:**
- Current `users` table has custom fields (username, email, password)
- Supabase Auth creates its own `auth.users` table
- Need to link custom user data to Supabase auth users

**Solution: Create `profiles` table linked to `auth.users`**

##### 1.2.1 Update `shared/schema.ts`

**Remove the old `users` table:**
```typescript
// DELETE THIS:
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Add new `profiles` table:**
```typescript
// ADD THIS:
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(), // References auth.users.id (UUID from Supabase Auth)
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Update `userContent` foreign key:**
```typescript
export const userContent = pgTable("user_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => profiles.id), // Now references profiles
  contentId: varchar("content_id").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").default(0),
  userRating: integer("user_rating"),
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Update schema exports:**
```typescript
// Replace insertUserSchema with insertProfileSchema
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
```

##### 1.2.2 Create Row Level Security (RLS) Policies

**File to create:** `supabase/policies.sql` (for documentation/manual application)

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Enable RLS on user_content table
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own watchlist
CREATE POLICY "Users can view their own watchlist"
ON user_content FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own watchlist items
CREATE POLICY "Users can insert their own watchlist items"
ON user_content FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist"
ON user_content FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist"
ON user_content FOR DELETE
USING (auth.uid() = user_id);

-- Content table is public (no RLS needed for read operations)
-- Background services will use service role key for writes
```

##### 1.2.3 Create Database Trigger for Auto-Profile Creation

**File:** `supabase/functions.sql`

```sql
-- Function: Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute handle_new_user on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 1.3 Database Migration

- [ ] **Update `drizzle.config.ts`** with Supabase credentials
  ```typescript
  import { defineConfig } from "drizzle-kit";
  
  if (!process.env.SUPABASE_DATABASE_URL) {
    throw new Error("SUPABASE_DATABASE_URL is required");
  }
  
  export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
      url: process.env.SUPABASE_DATABASE_URL, // Direct connection
    },
  });
  ```

- [ ] **Add Supabase environment variables** to Replit Secrets
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DATABASE_URL` (Direct Connection string)

- [ ] **Push schema to Supabase**
  ```bash
  npm run db:push
  ```

- [ ] **Apply RLS policies and triggers** via Supabase SQL Editor
  - Copy contents of `supabase/policies.sql`
  - Copy contents of `supabase/functions.sql`
  - Execute in Supabase dashboard SQL editor

- [ ] **Verify schema in Supabase**
  - Check Table Editor for: profiles, content, user_content, import_status
  - Verify RLS policies are enabled
  - Test trigger by creating test user in Authentication tab

#### 1.4 Database Connection Testing

- [ ] **Update `server/db.ts`** to use Supabase connection
  ```typescript
  import { drizzle } from 'drizzle-orm/postgres-js';
  import postgres from 'postgres';
  
  const connectionString = process.env.SUPABASE_DATABASE_URL!;
  
  // Direct connection for long-running background services
  const client = postgres(connectionString, {
    max: 10, // Connection pool size
    idle_timeout: 0, // Keep connections alive
  });
  
  export const db = drizzle(client);
  ```

- [ ] **Test database connection**
  - Run `npm run dev`
  - Verify "serving on port 5000" appears
  - Check for database connection errors in console
  - Test basic query (e.g., `SELECT * FROM content LIMIT 1`)

---

## Phase 2: Supabase Authentication Integration

### Objective
Replace Passport.js with Supabase Auth for user authentication and session management.

### Tasks

#### 2.1 Install Supabase Client Libraries

- [ ] **Add Supabase dependencies**
  ```bash
  npm install @supabase/supabase-js
  ```

- [ ] **Remove old auth dependencies** (after migration complete)
  - Do NOT remove yet: `passport`, `passport-local`, `express-session`, `connect-pg-simple`, `memorystore`
  - Will remove in Phase 6 after testing

#### 2.2 Backend Authentication Setup

##### 2.2.1 Create Supabase Admin Client

**File:** `server/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Admin client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular client for user operations (respects RLS)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY!
);
```

##### 2.2.2 Create Authentication Middleware

**File:** `server/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../supabase';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.userId = user.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
}

export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without auth
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (user) {
      req.userId = user.id;
      req.user = user;
    }
  } catch (error) {
    console.error('Optional auth error:', error);
    // Continue even if auth fails
  }

  next();
}
```

##### 2.2.3 Update Authentication Routes

**File:** `server/routes.ts` (replace auth routes)

```typescript
import { supabaseAdmin } from './supabase';
import { profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

// REPLACE old passport login/register routes with:

// Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: { username },
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // Profile is auto-created by database trigger
    res.status(201).json({
      user: authData.user,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

// Sign in
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ message: error.message });
    }

    res.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Failed to sign in' });
  }
});

// Sign out
app.post("/api/auth/signout", requireAuth, async (req: AuthRequest, res) => {
  // Client-side handles session removal
  res.json({ message: 'Signed out successfully' });
});

// Get current user
app.get("/api/auth/user", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, req.userId!));

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      id: req.userId,
      email: req.user.email,
      ...profile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user' });
  }
});

// Update profile
app.patch("/api/auth/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { username, fullName, bio, avatarUrl } = req.body;

    const [updatedProfile] = await db
      .update(profiles)
      .set({
        username,
        fullName,
        bio,
        avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, req.userId!))
      .returning();

    res.json(updatedProfile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});
```

##### 2.2.4 Protect User-Specific Routes

Update all routes that require authentication:

```typescript
// Example: Watchlist routes
app.get("/api/user/watchlist", requireAuth, async (req: AuthRequest, res) => {
  const items = await db
    .select()
    .from(userContent)
    .where(eq(userContent.userId, req.userId!));
  
  res.json(items);
});

app.post("/api/user/watchlist", requireAuth, async (req: AuthRequest, res) => {
  const { contentId, status } = req.body;
  
  const [item] = await db.insert(userContent).values({
    userId: req.userId!,
    contentId,
    status,
  }).returning();
  
  res.status(201).json(item);
});
```

#### 2.3 Frontend Authentication Setup

##### 2.3.1 Create Supabase Client

**File:** `client/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

##### 2.3.2 Update Query Client for Auth Headers

**File:** `client/src/lib/queryClient.ts` (update existing)

```typescript
import { supabase } from './supabase';

// Update defaultQueryFn to include auth token
const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = queryKey[0];
  
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, refresh session
      await supabase.auth.refreshSession();
      throw new Error('Session expired, please retry');
    }
    throw new Error(`Request failed: ${response.status}`);
  }
  
  return response.json();
};

// Update apiRequest helper
export async function apiRequest(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}
```

##### 2.3.3 Create Auth Context

**File:** `client/src/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

##### 2.3.4 Update App.tsx

Wrap app with AuthProvider:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {/* existing routes */}
      </QueryClientProvider>
    </AuthProvider>
  );
}
```

##### 2.3.5 Update Login/Signup Components

Replace existing auth forms with Supabase Auth:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Redirect to homepage
      window.location.href = '/';
    } catch (error) {
      console.error('Login failed:', error);
      // Show error toast
    }
  };

  // ... rest of component
}
```

#### 2.4 Environment Variables Update

- [ ] **Add frontend environment variables** (.env file for local, Replit Secrets for deployment)
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbG...
  ```

- [ ] **Add backend environment variables**
  ```
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
  SUPABASE_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
  ```

#### 2.5 Testing Authentication

- [ ] **Test user registration**
  - Create new account via frontend
  - Verify user appears in Supabase Auth dashboard
  - Verify profile created in profiles table
  - Check RLS policies allow profile read

- [ ] **Test user login**
  - Login with created account
  - Verify session token stored in localStorage
  - Verify protected routes work with token
  - Check token refresh on expiry

- [ ] **Test authorization**
  - Verify users can only access their own watchlist
  - Test creating/updating/deleting watchlist items
  - Verify RLS policies prevent unauthorized access

- [ ] **Test logout**
  - Sign out via frontend
  - Verify session cleared
  - Verify protected routes return 401

---

## Phase 3: Backend Migration to Cloudflare Workers

### Objective
Convert Express backend to Cloudflare Workers using Hono framework.

### Tasks

#### 3.1 Cloudflare Workers Setup

- [ ] **Create Cloudflare account** at https://dash.cloudflare.com
- [ ] **Install Wrangler CLI**
  ```bash
  npm install -g wrangler
  wrangler login
  ```

- [ ] **Initialize Workers project structure**
  ```bash
  mkdir cloudflare-worker
  cd cloudflare-worker
  npm init -y
  npm install hono @cloudflare/workers-types
  npm install -D wrangler typescript
  ```

#### 3.2 Create Wrangler Configuration

**File:** `wrangler.toml`

```toml
name = "seenit-api"
main = "src/index.ts"
compatibility_date = "2025-10-18"
compatibility_flags = ["nodejs_compat"]

# Environment variables (use wrangler secret for sensitive values)
[vars]
SUPABASE_URL = "https://xxxxx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbG..." # Public key, OK to include

# Secrets (set via: wrangler secret put SECRET_NAME)
# SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_DATABASE_URL
# TMDB_API_KEY
# OMDB_API_KEY

# Static assets for React frontend
[assets]
directory = "./dist/client"
not_found_handling = "404-page"

# Bindings will be added in Phase 4 for cron triggers
```

#### 3.3 Convert Express Routes to Hono

##### 3.3.1 Create Hono App Structure

**File:** `cloudflare-worker/src/index.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { contentRoutes } from './routes/content';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { importRoutes } from './routes/import';

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_DATABASE_URL: string;
  TMDB_API_KEY: string;
  OMDB_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/*', cors({
  origin: '*', // Adjust for production
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/content', contentRoutes);
app.route('/api/user', userRoutes);
app.route('/api/import', importRoutes);

// Serve React static files (will be configured later)
app.use('/*', serveStatic({ root: './' }));

export default app;
```

##### 3.3.2 Create Database Connection for Workers

**File:** `cloudflare-worker/src/db.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false, // Required for Cloudflare Workers
  });
  
  return drizzle(client);
}
```

##### 3.3.3 Migrate Route Handlers

Convert each route group from Express to Hono:

**Example: Content Routes**

**File:** `cloudflare-worker/src/routes/content.ts`

```typescript
import { Hono } from 'hono';
import { createDb } from '../db';
import { content } from '../schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

type Bindings = {
  SUPABASE_DATABASE_URL: string;
};

export const contentRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/content/type/:type
contentRoutes.get('/type/:type', async (c) => {
  const type = c.req.param('type');
  const page = parseInt(c.req.query('page') || '0');
  const limit = parseInt(c.req.query('limit') || '20');
  const genre = c.req.query('genre');
  
  const db = createDb(c.env.SUPABASE_DATABASE_URL);
  
  const conditions = [eq(content.type, type)];
  if (genre) {
    conditions.push(sql`${genre} = ANY(${content.genres})`);
  }
  
  const items = await db
    .select()
    .from(content)
    .where(and(...conditions))
    .orderBy(desc(content.popularity))
    .limit(limit)
    .offset(page * limit);
  
  const [total] = await db
    .select({ count: sql`count(*)` })
    .from(content)
    .where(and(...conditions));
  
  return c.json({
    content: items,
    pagination: {
      page,
      limit,
      total: Number(total.count),
      totalPages: Math.ceil(Number(total.count) / limit),
    },
  });
});

// Add more routes...
```

**Repeat for:**
- Auth routes (`src/routes/auth.ts`)
- User routes (`src/routes/user.ts`)
- Import routes (`src/routes/import.ts`)

#### 3.4 Copy Schema and Types

- [ ] **Copy `shared/schema.ts`** to `cloudflare-worker/src/schema.ts`
- [ ] **Update imports** in route files to use local schema
- [ ] **Copy types** from `@shared` to `cloudflare-worker/src/types.ts`

#### 3.5 Migrate Service Files

Copy and adapt services to Workers runtime:

- [ ] **TMDB Service** (`src/services/tmdb.ts`)
  - Works as-is (uses fetch API)
  - Update to accept API key as parameter

- [ ] **OMDb Service** (`src/services/omdb.ts`)
  - Works as-is (uses fetch API)

- [ ] **TVMaze Service** (`src/services/tvmaze.ts`)
  - Works as-is (uses fetch API)

- [ ] **Jikan Service** (`src/services/jikan.ts`)
  - Works as-is (uses fetch API)

**Note:** Background sync managers will be converted to Cron Triggers in Phase 4.

#### 3.6 Local Testing

- [ ] **Install dependencies**
  ```bash
  cd cloudflare-worker
  npm install
  ```

- [ ] **Add secrets for local development**
  ```bash
  wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  wrangler secret put SUPABASE_DATABASE_URL
  wrangler secret put TMDB_API_KEY
  wrangler secret put OMDB_API_KEY
  ```

- [ ] **Run local dev server**
  ```bash
  wrangler dev
  ```

- [ ] **Test API endpoints**
  - Test GET /api/content/type/movie
  - Test GET /api/content/trending-movies-with-trailers
  - Test auth endpoints (signup, signin)
  - Test protected routes with Bearer token

---

## Phase 4: Background Jobs Migration

### Objective
Convert Node.js setInterval-based background jobs to Cloudflare Workers Cron Triggers.

### Tasks

#### 4.1 Analyze Current Background Jobs

**Current jobs to migrate:**

1. **Sync Manager Hourly Check** (every hour)
   - Checks if it's time for morning syncs
   - Source: `server/services/syncManager.ts` - `SYNC_CHECK_INTERVAL`

2. **TVMaze Morning Sync** (8 AM daily)
   - Imports/updates TV shows from TVMaze
   - Source: `server/services/syncManager.ts` - `MORNING_HOUR`

3. **Jikan Morning Sync** (9 AM daily)
   - Updates anime with new episodes
   - Source: `server/services/syncManager.ts` - `JIKAN_MORNING_HOUR`

4. **Rating Backfill** (every 5 minutes)
   - Fetches missing IMDb ratings
   - Source: `server/services/ratingBackfillManager.ts`

#### 4.2 Update Wrangler Configuration

**File:** `wrangler.toml` (add triggers)

```toml
# ... existing config ...

# Cron Triggers
[triggers]
crons = [
  "0 8 * * *",      # TVMaze sync at 8:00 AM UTC daily
  "0 9 * * *",      # Jikan sync at 9:00 AM UTC daily
  "*/5 * * * *",    # Rating backfill every 5 minutes
]

# KV namespace for distributed locking (prevent concurrent runs)
[[kv_namespaces]]
binding = "SYNC_LOCKS"
id = "your-kv-namespace-id"  # Create via: wrangler kv:namespace create SYNC_LOCKS
preview_id = "your-preview-kv-id"
```

#### 4.3 Create Cron Handler

**File:** `cloudflare-worker/src/index.ts` (update)

```typescript
import { Hono } from 'hono';
import { handleTVMazeSync } from './cron/tvmaze-sync';
import { handleJikanSync } from './cron/jikan-sync';
import { handleRatingBackfill } from './cron/rating-backfill';

// ... existing app setup ...

export default {
  // HTTP request handler
  fetch: app.fetch,

  // Cron trigger handler
  async scheduled(
    event: ScheduledEvent,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    const hour = new Date().getUTCHours();
    const minute = new Date().getUTCMinutes();

    console.log(`Cron trigger at ${hour}:${minute} UTC`);

    // TVMaze sync (8 AM UTC)
    if (hour === 8 && minute === 0) {
      ctx.waitUntil(handleTVMazeSync(env));
    }

    // Jikan sync (9 AM UTC)
    if (hour === 9 && minute === 0) {
      ctx.waitUntil(handleJikanSync(env));
    }

    // Rating backfill (every 5 minutes)
    if (minute % 5 === 0) {
      ctx.waitUntil(handleRatingBackfill(env));
    }
  },
};
```

#### 4.4 Implement Distributed Locking

**File:** `cloudflare-worker/src/utils/locks.ts`

```typescript
export async function acquireLock(
  kv: KVNamespace,
  lockKey: string,
  ttl: number = 3600 // 1 hour
): Promise<boolean> {
  const lockValue = Date.now().toString();
  
  // Try to set lock (NX = only if not exists)
  const success = await kv.put(lockKey, lockValue, {
    expirationTtl: ttl,
    // KV doesn't support NX, so check manually
  });
  
  // Check if lock was acquired
  const currentValue = await kv.get(lockKey);
  return currentValue === lockValue;
}

export async function releaseLock(
  kv: KVNamespace,
  lockKey: string
): Promise<void> {
  await kv.delete(lockKey);
}

export async function isLocked(
  kv: KVNamespace,
  lockKey: string
): Promise<boolean> {
  const value = await kv.get(lockKey);
  return value !== null;
}
```

#### 4.5 Create TVMaze Sync Cron Job

**File:** `cloudflare-worker/src/cron/tvmaze-sync.ts`

```typescript
import { createDb } from '../db';
import { acquireLock, releaseLock } from '../utils/locks';
import { TVMazeService } from '../services/tvmaze';

export async function handleTVMazeSync(env: Bindings): Promise<void> {
  const lockKey = 'sync:tvmaze:lock';
  
  console.log('[TVMaze Cron] Attempting to start sync...');
  
  // Check if already running
  if (await env.SYNC_LOCKS.get(lockKey)) {
    console.log('[TVMaze Cron] Sync already running, skipping');
    return;
  }
  
  // Acquire lock
  await env.SYNC_LOCKS.put(lockKey, Date.now().toString(), {
    expirationTtl: 3600, // 1 hour
  });
  
  try {
    const db = createDb(env.SUPABASE_DATABASE_URL);
    const tvmazeService = new TVMazeService(db);
    
    console.log('[TVMaze Cron] Starting sync...');
    await tvmazeService.resumeSync();
    
    console.log('[TVMaze Cron] Sync completed successfully');
  } catch (error) {
    console.error('[TVMaze Cron] Sync failed:', error);
  } finally {
    // Release lock
    await env.SYNC_LOCKS.delete(lockKey);
  }
}
```

#### 4.6 Create Jikan Sync Cron Job

**File:** `cloudflare-worker/src/cron/jikan-sync.ts`

```typescript
import { createDb } from '../db';
import { JikanService } from '../services/jikan';

export async function handleJikanSync(env: Bindings): Promise<void> {
  const lockKey = 'sync:jikan:lock';
  
  console.log('[Jikan Cron] Attempting to start sync...');
  
  if (await env.SYNC_LOCKS.get(lockKey)) {
    console.log('[Jikan Cron] Sync already running, skipping');
    return;
  }
  
  await env.SYNC_LOCKS.put(lockKey, Date.now().toString(), {
    expirationTtl: 3600,
  });
  
  try {
    const db = createDb(env.SUPABASE_DATABASE_URL);
    const jikanService = new JikanService(db);
    
    console.log('[Jikan Cron] Starting daily sync...');
    await jikanService.startDailySync();
    
    console.log('[Jikan Cron] Sync completed successfully');
  } catch (error) {
    console.error('[Jikan Cron] Sync failed:', error);
  } finally {
    await env.SYNC_LOCKS.delete(lockKey);
  }
}
```

#### 4.7 Create Rating Backfill Cron Job

**File:** `cloudflare-worker/src/cron/rating-backfill.ts`

```typescript
import { createDb } from '../db';
import { content } from '../schema';
import { isNull, sql, desc } from 'drizzle-orm';
import { OMDbService } from '../services/omdb';

export async function handleRatingBackfill(env: Bindings): Promise<void> {
  const lockKey = 'backfill:rating:lock';
  
  // Check if already running
  if (await env.SYNC_LOCKS.get(lockKey)) {
    console.log('[Rating Backfill] Already running, skipping');
    return;
  }
  
  // Acquire lock (15 minute TTL)
  await env.SYNC_LOCKS.put(lockKey, Date.now().toString(), {
    expirationTtl: 900,
  });
  
  try {
    const db = createDb(env.SUPABASE_DATABASE_URL);
    const omdbService = new OMDbService(env.OMDB_API_KEY || '');
    
    // Check OMDb quota
    const quotaStats = await omdbService.getQuotaStats();
    if (quotaStats.isExhausted) {
      console.log('[Rating Backfill] OMDb quota exhausted, skipping');
      return;
    }
    
    // Find unrated content
    const unrated = await db
      .select()
      .from(content)
      .where(isNull(content.imdbRating))
      .orderBy(desc(content.popularity))
      .limit(200);
    
    if (unrated.length === 0) {
      console.log('[Rating Backfill] No unrated content found');
      return;
    }
    
    console.log(`[Rating Backfill] Processing ${unrated.length} items`);
    
    let updated = 0;
    for (const item of unrated) {
      try {
        if (item.imdbId) {
          const rating = await omdbService.getRatingByImdbId(item.imdbId);
          if (rating) {
            await db.update(content)
              .set({ imdbRating: rating })
              .where(eq(content.id, item.id));
            updated++;
          }
        }
      } catch (error) {
        console.error(`[Rating Backfill] Failed for ${item.title}:`, error);
      }
    }
    
    console.log(`[Rating Backfill] Updated ${updated} ratings`);
  } catch (error) {
    console.error('[Rating Backfill] Failed:', error);
  } finally {
    await env.SYNC_LOCKS.delete(lockKey);
  }
}
```

#### 4.8 Create KV Namespace

- [ ] **Create KV namespace via Wrangler**
  ```bash
  wrangler kv:namespace create SYNC_LOCKS
  wrangler kv:namespace create SYNC_LOCKS --preview
  ```

- [ ] **Update wrangler.toml** with KV namespace IDs from output

#### 4.9 Test Cron Jobs Locally

- [ ] **Trigger cron manually for testing**
  ```bash
  # In wrangler.toml, temporarily set cron to run every minute
  crons = ["* * * * *"]
  
  wrangler dev
  # Watch logs for cron execution
  ```

- [ ] **Verify lock mechanism**
  - Start two cron jobs simultaneously
  - Confirm only one acquires lock and runs

- [ ] **Test each sync job**
  - TVMaze sync: Verify shows imported
  - Jikan sync: Verify anime updated
  - Rating backfill: Verify ratings fetched

---

## Phase 5: Frontend Updates

### Objective
Build React frontend for deployment with Cloudflare Workers static assets.

### Tasks

#### 5.1 Update Frontend Configuration

##### 5.1.1 Update Environment Variables

**File:** `.env` (for local development)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=http://localhost:8787  # Local Workers dev server
```

**File:** `.env.production`

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=https://seenit-api.your-subdomain.workers.dev  # Production Workers URL
```

##### 5.1.2 Update API Base URL

**File:** `client/src/lib/queryClient.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = `${API_BASE_URL}${queryKey[0]}`; // Prepend base URL
  // ... rest of implementation
};
```

#### 5.2 Build Process

- [ ] **Update build script** in package.json
  ```json
  {
    "scripts": {
      "build": "vite build",
      "build:cloudflare": "npm run build && cp -r dist/client cloudflare-worker/dist/client"
    }
  }
  ```

- [ ] **Build frontend**
  ```bash
  npm run build:cloudflare
  ```

- [ ] **Verify build output** in `cloudflare-worker/dist/client`
  - index.html
  - assets/index-[hash].js
  - assets/index-[hash].css

#### 5.3 Configure Static Asset Serving

**File:** `wrangler.toml` (already configured in Phase 3)

```toml
[assets]
directory = "./dist/client"
not_found_handling = "404-page"
```

**File:** `cloudflare-worker/src/index.ts` (update catch-all route)

```typescript
// Serve static files and SPA fallback
app.get('/*', serveStatic({ root: './' }));

// Fallback to index.html for client-side routing
app.notFound((c) => {
  return c.html(
    `<!DOCTYPE html>... (serve index.html for SPA routing)`
  );
});
```

#### 5.4 Test Frontend Locally with Workers

- [ ] **Start Workers dev server**
  ```bash
  cd cloudflare-worker
  wrangler dev
  ```

- [ ] **Open browser** to `http://localhost:8787`

- [ ] **Test all pages**
  - Homepage: Movies carousel, trending section
  - Discover: Filter by type and genre
  - Schedule: Anime/TV airing schedule
  - Detail pages: Movie/TV/Anime details with trailers
  - Search: Full-text search functionality

- [ ] **Test authentication**
  - Sign up new user
  - Sign in
  - Access protected routes (watchlist)
  - Sign out

---

## Phase 6: Deployment & Testing

### Objective
Deploy to Cloudflare Workers and validate all functionality in production.

### Tasks

#### 6.1 Pre-Deployment Checklist

- [ ] **Verify all environment variables** set via Wrangler secrets
  ```bash
  wrangler secret put SUPABASE_SERVICE_ROLE_KEY
  wrangler secret put SUPABASE_DATABASE_URL
  wrangler secret put TMDB_API_KEY
  wrangler secret put OMDB_API_KEY
  ```

- [ ] **Test production build locally**
  ```bash
  npm run build:cloudflare
  cd cloudflare-worker
  wrangler dev --local
  ```

- [ ] **Review wrangler.toml**
  - Correct cron schedules
  - KV namespace IDs set
  - Environment variables configured

#### 6.2 Deploy to Cloudflare Workers

- [ ] **Deploy Worker**
  ```bash
  cd cloudflare-worker
  wrangler deploy
  ```

- [ ] **Note deployment URL**
  - Example: `https://seenit-api.your-subdomain.workers.dev`

- [ ] **Update frontend .env.production** with Worker URL

- [ ] **Rebuild and redeploy** if API URL changed

#### 6.3 Post-Deployment Validation

##### 6.3.1 API Endpoints

- [ ] **Test public endpoints**
  - GET /api/content/type/movie
  - GET /api/content/trending-movies-with-trailers
  - GET /api/content/recent-episodes

- [ ] **Test search**
  - GET /api/content/search?q=inception

- [ ] **Test authentication**
  - POST /api/auth/signup
  - POST /api/auth/signin
  - GET /api/auth/user (with Bearer token)

- [ ] **Test protected endpoints**
  - GET /api/user/watchlist (with auth)
  - POST /api/user/watchlist (add item)
  - DELETE /api/user/watchlist/:id

##### 6.3.2 Frontend Application

- [ ] **Test homepage**
  - Movies carousel loads
  - Trending section displays
  - Navigation works

- [ ] **Test Discover page**
  - Filter by type (movie/tv/anime)
  - Filter by genre
  - Pagination works

- [ ] **Test Schedule page**
  - Anime airing schedule loads
  - TV airing schedule loads

- [ ] **Test detail pages**
  - Movie detail with trailer
  - TV show detail with episodes
  - Anime detail with seasons

- [ ] **Test search**
  - Search bar autocomplete
  - Full search results page

- [ ] **Test authentication flows**
  - Sign up new user → redirects to home
  - Sign in → session persists
  - Protected routes → redirect to login if not authenticated
  - Sign out → clears session

- [ ] **Test user features**
  - Add to watchlist
  - Remove from watchlist
  - Update watch progress
  - Rate content

##### 6.3.3 Background Jobs

- [ ] **Monitor cron execution** via Cloudflare dashboard
  - Workers > seenit-api > Logs
  - Filter by "Cron"

- [ ] **Verify TVMaze sync** (next day at 8 AM UTC)
  - Check logs for sync start/completion
  - Query database for new shows imported

- [ ] **Verify Jikan sync** (next day at 9 AM UTC)
  - Check logs for anime updates
  - Verify episode data refreshed

- [ ] **Verify rating backfill** (every 5 minutes)
  - Check logs for rating updates
  - Query database for filled-in IMDb ratings

- [ ] **Test lock mechanism**
  - Manually trigger cron job
  - Verify lock prevents concurrent runs

##### 6.3.4 Database

- [ ] **Check Supabase metrics**
  - Database > Monitoring
  - Verify connection count reasonable (<50 for Direct Connection)
  - Check query performance

- [ ] **Verify RLS policies** working
  - Try accessing another user's watchlist (should fail)
  - Verify users can CRUD their own data

- [ ] **Check data integrity**
  - Row counts match expectations
  - No orphaned records
  - Indexes performing well

#### 6.4 Performance Testing

- [ ] **Test API response times**
  - Public endpoints < 500ms
  - Authenticated endpoints < 1s
  - Search queries < 2s

- [ ] **Test frontend load times**
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Lighthouse score > 90

- [ ] **Test under load** (optional)
  - Use tool like k6 or Artillery
  - Simulate 100 concurrent users
  - Verify no errors or timeouts

#### 6.5 Error Monitoring

- [ ] **Set up error tracking** (optional)
  - Sentry, LogFlare, or Cloudflare Analytics
  - Capture frontend errors
  - Capture backend errors

- [ ] **Configure alerts**
  - Cron job failures
  - High error rates
  - Database connection issues

---

## Phase 7: DNS & Production Cutover

### Objective
Point custom domain to Cloudflare Workers and complete migration.

### Tasks

#### 7.1 Custom Domain Setup

- [ ] **Add custom domain to Cloudflare**
  - Workers > seenit-api > Triggers > Custom Domains
  - Add domain: `api.seenit.com` (example)
  - Cloudflare automatically provisions SSL

- [ ] **Add domain for frontend** (if separate)
  - Option 1: Serve frontend from same Worker at root domain `seenit.com`
  - Option 2: Use Cloudflare Pages for frontend at `seenit.com`, API at `api.seenit.com`

- [ ] **Update DNS records**
  - A record: `seenit.com` → Cloudflare Worker IP
  - CNAME record: `api.seenit.com` → Worker domain

- [ ] **Update frontend environment variables** with custom domain
  ```env
  VITE_API_URL=https://api.seenit.com
  ```

- [ ] **Rebuild and redeploy** with new API URL

#### 7.2 SSL/TLS Configuration

- [ ] **Verify SSL certificate** provisioned
  - Check HTTPS works for custom domain
  - Verify redirect HTTP → HTTPS

- [ ] **Configure SSL settings** in Cloudflare dashboard
  - SSL/TLS mode: Full (strict)
  - Minimum TLS version: 1.2
  - Enable HSTS (optional but recommended)

#### 7.3 Production Cutover

- [ ] **Final pre-cutover checks**
  - All tests passing
  - Cron jobs running successfully
  - No errors in logs for 24 hours

- [ ] **Communication plan**
  - Notify users of maintenance window (if needed)
  - Prepare rollback plan if issues arise

- [ ] **Execute cutover**
  - Update DNS to point to Cloudflare
  - Monitor for errors
  - Verify all features working

- [ ] **Post-cutover validation**
  - Test all critical flows
  - Monitor error rates
  - Check user feedback

#### 7.4 Cleanup Old Infrastructure

**DO NOT perform until production is stable for 1 week**

- [ ] **Remove old Replit deployment**
  - Stop "Start application" workflow
  - Remove old environment variables

- [ ] **Clean up old dependencies**
  ```bash
  npm uninstall passport passport-local express-session connect-pg-simple memorystore
  ```

- [ ] **Remove old authentication code**
  - Delete `server/auth.ts` (if exists)
  - Remove passport configuration from `server/index.ts`

- [ ] **Archive old database** (if migrating data)
  - Export data from Replit Database
  - Store backup securely

#### 7.5 Documentation Updates

- [ ] **Update README.md**
  - Document new architecture
  - Update deployment instructions
  - Add environment variables reference

- [ ] **Update API documentation** (if exists)
  - Document authentication flow (Supabase Auth)
  - Update base URLs

- [ ] **Create runbook** for common operations
  - How to trigger manual sync
  - How to check cron job status
  - How to update environment variables

---

## Appendix: Rollback Plan

### If Migration Fails

#### Immediate Rollback (< 1 hour after cutover)

1. **Revert DNS** back to Replit
2. **Restart Replit workflow** `npm run dev`
3. **Verify old system** operational
4. **Communicate status** to users

#### Post-Migration Issues

1. **Identify issue**
   - Check Cloudflare Worker logs
   - Check Supabase database logs
   - Review error reports

2. **Apply hotfix** if possible
   - Deploy fix to Worker: `wrangler deploy`
   - Update environment variables if needed

3. **Rollback if hotfix fails**
   - Follow immediate rollback steps
   - Schedule maintenance for proper fix

---

## Success Criteria

### Migration Complete When:

- ✅ All users can authenticate via Supabase Auth
- ✅ All content endpoints returning correct data
- ✅ Search functionality working
- ✅ User watchlists accessible and updatable
- ✅ Background syncs running on schedule
- ✅ Rating backfill operating continuously
- ✅ Custom domain serving application over HTTPS
- ✅ No errors in logs for 48 hours
- ✅ Performance metrics meet targets
- ✅ Old Replit infrastructure decommissioned

---

## Timeline Estimate

**Phase 0:** 1-2 days  
**Phase 1:** 2-3 days  
**Phase 2:** 3-4 days  
**Phase 3:** 4-5 days  
**Phase 4:** 2-3 days  
**Phase 5:** 1-2 days  
**Phase 6:** 2-3 days  
**Phase 7:** 1 day  

**Total:** 16-23 days (3-4 weeks)

**Note:** Timeline assumes full-time work. Adjust based on availability.

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Backend Framework** | Hono | Lightweight, designed for Workers, Express-like API |
| **Database Connection** | Direct Connection | Long-running background jobs need persistent connections |
| **Background Jobs** | Cron Triggers | Native Workers feature, no external scheduler needed |
| **Auth System** | Supabase Auth | Built-in user management, RLS integration, OAuth support |
| **Schema Strategy** | profiles table | Links custom user data to Supabase auth.users via foreign key |
| **Frontend Hosting** | Workers Static Assets | Single deployment, no separate CDN configuration needed |
| **Distributed Locking** | KV Namespace | Prevents concurrent cron job execution |

---

## Contact & Support

- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Supabase Docs:** https://supabase.com/docs
- **Hono Docs:** https://hono.dev
- **Drizzle ORM Docs:** https://orm.drizzle.team

---

**End of Migration Plan**
