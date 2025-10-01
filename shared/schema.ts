import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'movie', 'tv', 'anime'
  source: text("source").notNull(), // 'tmdb', 'tvmaze', 'jikan', 'manual'
  sourceId: text("source_id").notNull(), // Original API ID
  
  // Common fields
  overview: text("overview"), // Description/synopsis
  genres: text("genres").array(), // Updated from 'genre' to 'genres'
  year: integer("year"),
  endYear: integer("end_year"), // for TV shows that have ended
  rating: real("rating"), // Average rating as decimal
  poster: text("poster"),
  backdrop: text("backdrop"), // Background image for detail pages
  status: text("status"), // 'finished', 'ongoing', 'upcoming', 'airing', 'completed', 'canceled'
  
  // Multiple rating sources
  imdbId: text("imdb_id"), // IMDb ID for cross-referencing (e.g., "tt0111161")
  imdbRating: real("imdb_rating"), // IMDb rating as decimal
  rottenTomatoesRating: integer("rotten_tomatoes_rating"), // RT rating as percentage
  malRating: real("mal_rating"), // MyAnimeList rating for anime
  
  // Movie-specific (TMDB)
  runtime: integer("runtime"), // Duration in minutes
  releaseDate: date("release_date"), // Movie release date
  trailerKey: text("trailer_key"), // YouTube video key for trailer
  
  // TV-specific (TVmaze)
  totalSeasons: integer("total_seasons"),
  totalEpisodes: integer("total_episodes"),
  network: text("network"), // Broadcasting network
  airTime: text("air_time"), // Time when show airs
  airDays: text("air_days").array(), // Days of week show airs
  episodeData: jsonb("episode_data"), // Full episode details as JSON
  
  // Anime-specific (Jikan API)
  episodes: integer("episodes"), // Total episodes planned
  season: integer("season"), // Current season for ongoing shows
  studio: text("studio"), // Animation studio
  sourceMaterial: text("source_material"), // 'manga', 'light_novel', 'original', etc.
  
  // Series grouping fields (for anime seasons)
  seriesKey: text("series_key"), // e.g., "jikan:series:ROOT_MAL_ID" for grouping seasons
  seriesRootSourceId: text("series_root_source_id"), // Root anime's MAL ID as string
  seasonNumber: integer("season_number"), // 1-based order in sequel chain (1 = first season)
  seasonTitle: text("season_title"), // e.g., "Season 6", "Final Season", null for first season
  
  // Content availability
  streamingPlatforms: text("streaming_platforms").array(),
  affiliateLinks: text("affiliate_links").array(),
  
  // Additional metadata
  tags: text("tags").array(), // Additional descriptive tags
  popularity: real("popularity"), // Popularity score from APIs
  voteCount: integer("vote_count"), // Number of votes/ratings
  
  // Timestamps
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userContent = pgTable("user_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contentId: varchar("content_id").notNull(),
  status: text("status").notNull(), // 'watching', 'watched', 'want_to_watch'
  progress: integer("progress").default(0), // episodes watched
  userRating: integer("user_rating"), // 1-5 stars
  addedAt: timestamp("added_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const importStatus = pgTable("import_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(), // 'tmdb', 'tvmaze', 'anidb'
  isActive: boolean("is_active").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  totalImported: integer("total_imported").default(0),
  totalAvailable: integer("total_available").default(0),
  currentPage: integer("current_page").default(1),
  phase1Progress: text("phase1_progress"),
  phase2Progress: text("phase2_progress"),
  phase3Progress: text("phase3_progress"),
  errors: text("errors").array(),
  cursor: jsonb("cursor"), // JSON cursor for multi-phase resume state (phase, year, season, page, type, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
});

export const insertUserContentSchema = createInsertSchema(userContent).omit({
  id: true,
  addedAt: true,
  updatedAt: true,
});

export const insertImportStatusSchema = createInsertSchema(importStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

export type InsertUserContent = z.infer<typeof insertUserContentSchema>;
export type UserContent = typeof userContent.$inferSelect;

export type InsertImportStatus = z.infer<typeof insertImportStatusSchema>;
export type ImportStatus = typeof importStatus.$inferSelect;