import { type User, type InsertUser, type Content, type InsertContent, type UserContent, type InsertUserContent, type ImportStatus, type InsertImportStatus } from "@shared/schema";
import { db } from "../db";
import { users, content, userContent, importStatus } from "@shared/schema";
import { eq, and, ilike, or } from "drizzle-orm";
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

  async getContentByType(type: string): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.type, type));
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
          ilike(content.overview, lowerQuery)
        )
      );
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
}

export const databaseStorage = new DatabaseStorage();