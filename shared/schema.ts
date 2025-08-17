import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'movie', 'tv', 'anime'
  year: integer("year"),
  rating: text("rating"), // e.g. "8.5"
  genre: text("genre").array(),
  poster: text("poster"),
  overview: text("overview"),
  status: text("status"), // 'airing', 'completed', 'upcoming'
  episodes: integer("episodes"),
  season: integer("season"), // current season for tv/anime
  streamingPlatforms: text("streaming_platforms").array(),
  affiliateLinks: text("affiliate_links").array(),
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContent = z.infer<typeof insertContentSchema>;
export type Content = typeof content.$inferSelect;

export type InsertUserContent = z.infer<typeof insertUserContentSchema>;
export type UserContent = typeof userContent.$inferSelect;
