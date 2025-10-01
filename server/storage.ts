import { Content, User, UserContent, ImportStatus, InsertContent, InsertUser, InsertUserContent, InsertImportStatus } from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for content storage operations
export interface IStorage {
  // Content management
  getAllContent(): Promise<Content[]>;
  getContent(id: string): Promise<Content | undefined>;
  createContent(insertContent: InsertContent): Promise<Content>;
  updateContent(id: string, updates: Partial<Content>): Promise<Content>;
  
  // Content filtering and search
  getContentByType(type: string, options?: {genre?: string, limit?: number, offset?: number, sort?: string}): Promise<Content[]>;
  getContentCountByType(type: string, options?: {genre?: string}): Promise<number>;
  getContentByScheduleDate(date: string, type: string): Promise<Content[]>;
  searchContent(query: string): Promise<Content[]>;
  getContentBySource(source: string): Promise<Content[]>;
  
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // User-Content relationship management
  getUserContent(userId: string): Promise<UserContent[]>;
  getUserContentByStatus(userId: string, status: string): Promise<UserContent[]>;
  getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined>;
  addUserContent(insertUserContent: InsertUserContent): Promise<UserContent>;
  updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent>;
  removeUserContent(id: string): Promise<void>;
  deleteContentBySource(source: string): Promise<number>;
  
  // Import status management
  getImportStatus(source: string): Promise<ImportStatus | undefined>;
  createImportStatus(insertImportStatus: InsertImportStatus): Promise<ImportStatus>;
  updateImportStatus(id: string, updates: Partial<ImportStatus>): Promise<ImportStatus>;
}

// Memory storage implementation (no longer using static content)
export class MemStorage implements IStorage {
  private content = new Map<string, Content>();
  private users = new Map<string, User>();
  private userContent = new Map<string, UserContent>();
  private importStatus = new Map<string, ImportStatus>();

  constructor() {
    // No static content initialization - using database only
    console.log('MemStorage initialized without static content');
  }

  // Content management methods
  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContent(id: string): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const content: Content = { 
      ...insertContent, 
      id,
      createdAt: new Date(),
      lastUpdated: new Date(),
      year: insertContent.year ?? null,
      endYear: insertContent.endYear ?? null,
      rating: insertContent.rating ?? null,
      imdbRating: insertContent.imdbRating ?? null,
      rottenTomatoesRating: insertContent.rottenTomatoesRating ?? null,
      malRating: insertContent.malRating ?? null,
      genres: insertContent.genres ?? null,
      poster: insertContent.poster ?? null,
      backdrop: insertContent.backdrop ?? null,
      overview: insertContent.overview ?? null,
      status: insertContent.status ?? "completed",
      episodes: insertContent.episodes ?? null,
      season: insertContent.season ?? null,
      totalSeasons: insertContent.totalSeasons ?? null,
      totalEpisodes: insertContent.totalEpisodes ?? null,
      runtime: insertContent.runtime ?? null,
      releaseDate: insertContent.releaseDate ?? null,
      network: insertContent.network ?? null,
      airTime: insertContent.airTime ?? null,
      airDays: insertContent.airDays ?? null,
      studio: insertContent.studio ?? null,
      sourceMaterial: insertContent.sourceMaterial ?? null,
      tags: insertContent.tags ?? null,
      popularity: insertContent.popularity ?? null,
      voteCount: insertContent.voteCount ?? null,
      streamingPlatforms: insertContent.streamingPlatforms ?? null,
      affiliateLinks: insertContent.affiliateLinks ?? null,
      episodeData: insertContent.episodeData ?? null,
      seriesKey: insertContent.seriesKey ?? null,
      seriesRootSourceId: insertContent.seriesRootSourceId ?? null,
      seasonNumber: insertContent.seasonNumber ?? null,
      seasonTitle: insertContent.seasonTitle ?? null
    };
    this.content.set(id, content);
    return content;
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    const existing = this.content.get(id);
    if (!existing) {
      throw new Error(`Content with id ${id} not found`);
    }
    const updated = { 
      ...existing, 
      ...updates,
      lastUpdated: new Date()
    };
    this.content.set(id, updated);
    return updated;
  }

  async deleteContent(id: string): Promise<boolean> {
    return this.content.delete(id);
  }

  async getContentByType(type: string, options?: {genre?: string, limit?: number, offset?: number}): Promise<Content[]> {
    let filtered = Array.from(this.content.values()).filter(
      (content) => content.type === type
    );

    if (options?.genre && options.genre !== 'all') {
      filtered = filtered.filter(content => 
        content.genres?.some(g => g.toLowerCase().includes(options.genre!.toLowerCase()))
      );
    }

    const offset = options?.offset || 0;
    const limit = options?.limit;
    
    if (limit !== undefined) {
      return filtered.slice(offset, offset + limit);
    }

    return filtered.slice(offset);
  }

  async getContentCountByType(type: string, options?: {genre?: string}): Promise<number> {
    let filtered = Array.from(this.content.values()).filter(
      (content) => content.type === type
    );

    if (options?.genre && options.genre !== 'all') {
      filtered = filtered.filter(content => 
        content.genres?.some(g => g.toLowerCase().includes(options.genre!.toLowerCase()))
      );
    }

    return filtered.length;
  }

  async getContentByScheduleDate(date: string, type: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter((content) => {
      if (content.type !== type) return false;
      
      if (content.episodeData) {
        try {
          const episodeData = typeof content.episodeData === 'string' 
            ? JSON.parse(content.episodeData) 
            : content.episodeData;
          
          if (episodeData && episodeData.episodes && Array.isArray(episodeData.episodes)) {
            return episodeData.episodes.some((ep: any) => ep.airdate === date);
          }
        } catch (error) {
          console.error('Error parsing episode data for schedule:', error);
        }
      }
      
      return false;
    });
  }

  async searchContent(query: string): Promise<Content[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.content.values()).filter(
      (content) => 
        content.title.toLowerCase().includes(lowerQuery) ||
        content.overview?.toLowerCase().includes(lowerQuery) ||
        content.genres?.some(g => g.toLowerCase().includes(lowerQuery))
    );
  }

  async getContentBySource(source: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.source === source
    );
  }

  // User management methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // User-Content relationship methods
  async getAllUserContent(): Promise<UserContent[]> {
    return Array.from(this.userContent.values());
  }

  async getUserContent(userId: string): Promise<UserContent[]> {
    return Array.from(this.userContent.values()).filter(uc => uc.userId === userId);
  }

  async getUserContentByStatus(userId: string, status: string): Promise<UserContent[]> {
    return Array.from(this.userContent.values()).filter(
      uc => uc.userId === userId && uc.status === status
    );
  }

  async getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined> {
    return Array.from(this.userContent.values()).find(
      uc => uc.userId === userId && uc.contentId === contentId
    );
  }

  async addUserContent(insertUserContent: InsertUserContent): Promise<UserContent> {
    const id = randomUUID();
    const userContent: UserContent = { 
      ...insertUserContent, 
      id,
      progress: insertUserContent.progress ?? null,
      userRating: insertUserContent.userRating ?? null,
      addedAt: new Date(),
      updatedAt: new Date()
    };
    this.userContent.set(id, userContent);
    return userContent;
  }

  async updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent> {
    const existing = this.userContent.get(id);
    if (!existing) {
      throw new Error(`UserContent with id ${id} not found`);
    }
    const updated = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.userContent.set(id, updated);
    return updated;
  }

  async removeUserContent(id: string): Promise<void> {
    this.userContent.delete(id);
  }

  async deleteContentBySource(source: string): Promise<number> {
    const toDelete = Array.from(this.content.values()).filter(c => c.source === source);
    toDelete.forEach(c => this.content.delete(c.id));
    return toDelete.length;
  }

  // Import status management methods
  async getImportStatus(source: string): Promise<ImportStatus | undefined> {
    return Array.from(this.importStatus.values()).find(s => s.source === source);
  }

  async createImportStatus(insertImportStatus: InsertImportStatus): Promise<ImportStatus> {
    const id = randomUUID();
    const status: ImportStatus = {
      id,
      source: insertImportStatus.source,
      isActive: insertImportStatus.isActive ?? null,
      lastSyncAt: insertImportStatus.lastSyncAt ?? null,
      totalImported: insertImportStatus.totalImported ?? null,
      totalAvailable: insertImportStatus.totalAvailable ?? null,
      currentPage: insertImportStatus.currentPage ?? null,
      phase1Progress: insertImportStatus.phase1Progress ?? null,
      phase2Progress: insertImportStatus.phase2Progress ?? null,
      phase3Progress: insertImportStatus.phase3Progress ?? null,
      errors: insertImportStatus.errors ?? null,
      cursor: insertImportStatus.cursor ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.importStatus.set(id, status);
    return status;
  }

  async updateImportStatus(id: string, updates: Partial<ImportStatus>): Promise<ImportStatus> {
    const existing = this.importStatus.get(id);
    if (!existing) {
      throw new Error(`Import status with id ${id} not found`);
    }
    const updated = { 
      ...existing, 
      ...updates,
      updatedAt: new Date()
    };
    this.importStatus.set(id, updated);
    return updated;
  }
}

// Use database storage exclusively
import { databaseStorage } from "./storage/database";
export const storage = databaseStorage;