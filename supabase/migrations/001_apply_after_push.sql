-- ============================================================================
-- IMPORTANT: Apply this SQL in Supabase AFTER running `npm run db:push`
-- 
-- STEPS:
-- 1. First run: npm run db:push (to create tables via Drizzle)
-- 2. Then run this SQL in Supabase SQL Editor or via Supabase CLI
-- 3. DO NOT run this via drizzle-kit (it will fail in local/CI environments)
-- 
-- This file adds foreign key constraints and RLS policies that depend on
-- Supabase's auth schema, which only exists in Supabase environments.
-- ============================================================================

-- Add foreign key constraint from profiles to auth.users
-- This ensures every profile corresponds to a real Supabase auth user
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_status ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Content table policies
-- Users can read their own watchlist entries
CREATE POLICY "Users can read own watchlist"
  ON user_content
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert to their own watchlist
CREATE POLICY "Users can insert to own watchlist"
  ON user_content
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own watchlist entries
CREATE POLICY "Users can update own watchlist"
  ON user_content
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own watchlist entries
CREATE POLICY "Users can delete from own watchlist"
  ON user_content
  FOR DELETE
  USING (auth.uid() = user_id);

-- Content table policies (public read, service role write)
-- Anyone can read content (movies, TV shows, anime)
CREATE POLICY "Content is publicly readable"
  ON content
  FOR SELECT
  USING (true);

-- Only service role can insert content (for admin/import operations)
CREATE POLICY "Service role can insert content"
  ON content
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update content (for admin/import operations)
CREATE POLICY "Service role can update content"
  ON content
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Import Status table policies (service role only)
-- Anyone can read import status
CREATE POLICY "Import status is publicly readable"
  ON import_status
  FOR SELECT
  USING (true);

-- Only service role can modify import status (for background jobs)
CREATE POLICY "Service role can insert import status"
  ON import_status
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update import status"
  ON import_status
  FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete import status"
  ON import_status
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
