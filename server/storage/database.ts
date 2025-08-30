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

    let query = db.select().from(content).where(and(...conditions));

    // Add sorting
    if (options?.sort) {
      switch (options.sort) {
        case 'new':
        case 'release_date':
          query = query.orderBy(desc(content.year));
          break;
        case 'reviews':
        case 'popular':
          query = query.orderBy(desc(content.rating));
          break;
        case 'air_date':
          query = query.orderBy(desc(content.releaseDate));
          break;
        default:
          query = query.orderBy(desc(content.createdAt));
      }
    }

    // Add pagination
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }

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
    return await db
      .select()
      .from(content)
      .where(
        or(
          ilike(content.title, lowerQuery),
          ilike(content.overview, lowerQuery),
          sql`${content.genres}::text ILIKE ${lowerQuery}`,
          ilike(content.network, lowerQuery),
          ilike(content.studio, lowerQuery),
          sql`${content.tags}::text ILIKE ${lowerQuery}`,
          ilike(content.sourceMaterial, lowerQuery),
          sql`${content.streamingPlatforms}::text ILIKE ${lowerQuery}`
        )
      )
      .orderBy(desc(content.popularity));
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const [contentRecord] = await db
      .insert(content)
      .values(insertContent)
      .returning();
    return contentRecord;
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