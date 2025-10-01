import { type User, type InsertUser, type Content, type InsertContent, type UserContent, type InsertUserContent, type ImportStatus, type InsertImportStatus } from "@shared/schema";
import { db } from "../db";
import { users, content, userContent, importStatus } from "@shared/schema";
import { eq, and, ilike, or, sql, desc, asc, gte, lte } from "drizzle-orm";
import type { IStorage } from "../storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Content methods
  async getContent(id: string): Promise<Content | undefined> {
    const [contentRecord] = await db.select().from(content).where(eq(content.id, id));
    return contentRecord || undefined;
  }

  async getAllContent(): Promise<Content[]> {
    return await db.select().from(content);
  }

  async getContentByType(type: string, options?: {offset?: number; limit?: number; genre?: string; sort?: string}): Promise<Content[]> {
    // Build where conditions
    const conditions = [eq(content.type, type)];
    
    // Add genre filtering if specified
    if (options?.genre && options.genre !== 'all') {
      conditions.push(sql`${content.genres}::text ILIKE ${`%${options.genre}%`}`);
    }

    // Determine sort column - use any to allow different column types
    let sortColumn: any = content.createdAt;
    if (options?.sort) {
      switch (options.sort) {
        case 'new':
        case 'release_date':
          sortColumn = content.year;
          break;
        case 'reviews':
        case 'popular':
          sortColumn = content.rating;
          break;
        case 'air_date':
          sortColumn = content.releaseDate;
          break;
      }
    }

    // Build complete query with all clauses
    const query = db
      .select()
      .from(content)
      .where(and(...conditions))
      .orderBy(desc(sortColumn))
      .offset(options?.offset ?? 0)
      .limit(options?.limit ?? 1000);

    return await query;
  }

  async getContentCountByType(type: string, options?: {genre?: string}): Promise<number> {
    // Build where conditions
    const conditions = [eq(content.type, type)];
    
    // Add genre filtering if specified
    if (options?.genre && options.genre !== 'all') {
      conditions.push(sql`${content.genres}::text ILIKE ${`%${options.genre}%`}`);
    }

    const result = await db.select({count: sql`count(*)`}).from(content).where(and(...conditions));
    return Number(result[0]?.count || 0);
  }

  async getContentByScheduleDate(date: string, type: string): Promise<Content[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.type, type),
          sql`${content.releaseDate} >= ${startOfDay}`,
          sql`${content.releaseDate} <= ${endOfDay}`
        )
      );
  }

  async getContentBySource(source: string): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.source, source));
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const exactQuery = query.toLowerCase();
    const startsWithQuery = `${query.toLowerCase()}%`;
    
    // First get exact title matches
    const exactMatches = await db
      .select()
      .from(content)
      .where(sql`LOWER(${content.title}) = ${exactQuery}`)
      .orderBy(desc(content.popularity));
    
    // Then get "starts with" matches  
    const startsWithMatches = await db
      .select()
      .from(content)
      .where(sql`LOWER(${content.title}) LIKE ${startsWithQuery}`)
      .orderBy(desc(content.popularity));
    
    // Then get contains matches in title
    const titleContainsMatches = await db
      .select()
      .from(content)
      .where(ilike(content.title, lowerQuery))
      .orderBy(desc(content.popularity));
    
    // Combine results and remove duplicates, maintaining priority order
    const allResults = [...exactMatches, ...startsWithMatches, ...titleContainsMatches];
    const uniqueResults = allResults.filter((item, index, arr) => 
      arr.findIndex(i => i.id === item.id) === index
    );
    
    return uniqueResults;
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [contentRecord] = await db
      .insert(content)
      .values(insertContent)
      .returning();
    return contentRecord;
  }

  async getContentBySourceId(source: string, sourceId: string): Promise<Content | undefined> {
    const [result] = await db
      .select()
      .from(content)
      .where(and(eq(content.source, source), eq(content.sourceId, sourceId)))
      .limit(1);
    return result;
  }

  async getMoviesWithTrailers(limit: number = 5): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(and(eq(content.type, 'movie'), sql`${content.trailerKey} IS NOT NULL`))
      .orderBy(desc(content.rating))
      .limit(limit);
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    const [updated] = await db
      .update(content)
      .set({
        ...updates,
        lastUpdated: new Date()
      })
      .where(eq(content.id, id))
      .returning();
    return updated;
  }

  // User content tracking methods
  async getUserContent(userId: string): Promise<UserContent[]> {
    return await db.select().from(userContent).where(eq(userContent.userId, userId));
  }

  async getUserContentByStatus(userId: string, status: string): Promise<UserContent[]> {
    return await db
      .select()
      .from(userContent)
      .where(
        and(
          eq(userContent.userId, userId),
          eq(userContent.status, status)
        )
      );
  }

  async addUserContent(insertUserContent: InsertUserContent): Promise<UserContent> {
    const [userContentRecord] = await db
      .insert(userContent)
      .values(insertUserContent)
      .returning();
    return userContentRecord;
  }

  async updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent> {
    const [updated] = await db
      .update(userContent)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(userContent.id, id))
      .returning();
    return updated;
  }

  async removeUserContent(id: string): Promise<void> {
    await db.delete(userContent).where(eq(userContent.id, id));
  }

  async getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined> {
    const [userContentRecord] = await db
      .select()
      .from(userContent)
      .where(
        and(
          eq(userContent.userId, userId),
          eq(userContent.contentId, contentId)
        )
      );
    return userContentRecord || undefined;
  }

  // Import status methods
  async getImportStatus(source: string): Promise<ImportStatus | undefined> {
    const [status] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, source));
    return status || undefined;
  }

  async createImportStatus(insertImportStatus: InsertImportStatus): Promise<ImportStatus> {
    const [status] = await db
      .insert(importStatus)
      .values(insertImportStatus)
      .returning();
    return status;
  }

  async updateImportStatus(id: string, updates: Partial<ImportStatus>): Promise<ImportStatus> {
    const [updated] = await db
      .update(importStatus)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(importStatus.id, id))
      .returning();
    return updated;
  }

  async deleteContentBySource(source: string): Promise<number> {
    const result = await db
      .delete(content)
      .where(eq(content.source, source))
      .returning({ id: content.id });
    
    return result.length;
  }
}

export const databaseStorage = new DatabaseStorage();