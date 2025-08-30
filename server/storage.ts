import { type User, type InsertUser, type Content, type InsertContent, type UserContent, type InsertUserContent, type ImportStatus, type InsertImportStatus } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users, content, userContent, importStatus } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Content methods
  getContent(id: string): Promise<Content | undefined>;
  getAllContent(): Promise<Content[]>;
  getContentByType(type: string): Promise<Content[]>;
  getContentBySource(source: string): Promise<Content[]>;
  searchContent(query: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: string, updates: Partial<Content>): Promise<Content>;
  deleteContentBySource(source: string): Promise<number>;

  // User content tracking methods
  getUserContent(userId: string): Promise<UserContent[]>;
  getUserContentByStatus(userId: string, status: string): Promise<UserContent[]>;
  addUserContent(userContent: InsertUserContent): Promise<UserContent>;
  updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent>;
  removeUserContent(id: string): Promise<void>;
  getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined>;

  // Import status methods
  getImportStatus(source: string): Promise<ImportStatus | undefined>;
  createImportStatus(importStatus: InsertImportStatus): Promise<ImportStatus>;
  updateImportStatus(id: string, updates: Partial<ImportStatus>): Promise<ImportStatus>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private content: Map<string, Content>;
  private userContent: Map<string, UserContent>;

  constructor() {
    this.users = new Map();
    this.content = new Map();
    this.userContent = new Map();
    this.initializeSampleContent();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
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

  // Content methods
  async getContent(id: string): Promise<Content | undefined> {
    return this.content.get(id);
  }

  async getAllContent(): Promise<Content[]> {
    return Array.from(this.content.values());
  }

  async getContentByType(type: string): Promise<Content[]> {
    return Array.from(this.content.values()).filter(
      (content) => content.type === type
    );
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

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const content: Content = { 
      ...insertContent, 
      id,
      // Ensure nullable fields are properly set with new schema
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
      status: insertContent.status ?? null,
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
      episodeData: insertContent.episodeData ?? null
    };
    this.content.set(id, content);
    return content;
  }

  async updateContent(id: string, updates: Partial<Content>): Promise<Content> {
    const existing = this.content.get(id);
    if (!existing) {
      throw new Error('Content not found');
    }
    const updated: Content = {
      ...existing,
      ...updates,
      lastUpdated: new Date()
    };
    this.content.set(id, updated);
    return updated;
  }

  async deleteContentBySource(source: string): Promise<number> {
    const toDelete = Array.from(this.content.entries()).filter(
      ([_, content]) => content.source === source
    );
    
    toDelete.forEach(([id, _]) => {
      this.content.delete(id);
    });
    
    return toDelete.length;
  }

  // User content tracking methods
  async getUserContent(userId: string): Promise<UserContent[]> {
    return Array.from(this.userContent.values()).filter(
      (uc) => uc.userId === userId
    );
  }

  async getUserContentByStatus(userId: string, status: string): Promise<UserContent[]> {
    return Array.from(this.userContent.values()).filter(
      (uc) => uc.userId === userId && uc.status === status
    );
  }

  async addUserContent(insertUserContent: InsertUserContent): Promise<UserContent> {
    const id = randomUUID();
    const now = new Date();
    const userContent: UserContent = {
      ...insertUserContent,
      id,
      progress: insertUserContent.progress ?? null,
      userRating: insertUserContent.userRating ?? null,
      addedAt: now,
      updatedAt: now
    };
    this.userContent.set(id, userContent);
    return userContent;
  }

  async updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent> {
    const existing = this.userContent.get(id);
    if (!existing) {
      throw new Error('User content not found');
    }
    const updated: UserContent = {
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

  async getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined> {
    return Array.from(this.userContent.values()).find(
      (uc) => uc.userId === userId && uc.contentId === contentId
    );
  }

  private initializeSampleContent() {
    // Initialize with sample content for demonstration
    const sampleContent: Content[] = [
      {
        id: "1",
        title: "Action Hero",
        type: "movie",
        source: "manual",
        sourceId: "action-hero-1",
        year: 2024,
        endYear: null,
        rating: 8.5,
        imdbRating: 8.2,
        rottenTomatoesRating: 85,
        malRating: null,
        genres: ["Action", "Adventure"],
        poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        backdrop: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "An epic action adventure that keeps you on the edge of your seat with non-stop thrills and spectacular visual effects.",
        status: "completed",
        episodes: null,
        season: null,
        totalSeasons: null,
        totalEpisodes: null,
        runtime: 125,
        releaseDate: null,
        network: null,
        airTime: null,
        airDays: null,
        studio: null,
        sourceMaterial: null,
        tags: ["blockbuster", "visual-effects"],
        popularity: 8.5,
        voteCount: 12500,
        streamingPlatforms: ["Netflix", "Prime Video"],
        affiliateLinks: ["https://netflix.com/affiliate/action-hero", "https://primevideo.com/affiliate/action-hero"],
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: "2",
        title: "Mystery Series",
        type: "tv",
        source: "manual",
        sourceId: "mystery-series-2",
        year: 2021,
        endYear: null,
        rating: 9.2,
        imdbRating: 9.1,
        rottenTomatoesRating: 94,
        malRating: null,
        genres: ["Drama", "Mystery"],
        poster: "https://pixabay.com/get/g5aa14888be9881f298958bc87eb9d20ce20bf5b70f7db91250c3cc1ce2b44d784134ea678494d856af6689923de2d1819e646131e74afe5787eab63692955f55_1280.jpg",
        backdrop: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "A gripping mystery that unfolds across multiple seasons, weaving together complex storylines and memorable characters in a masterfully crafted narrative.",
        status: "airing",
        episodes: 30,
        season: 3,
        totalSeasons: 4,
        totalEpisodes: 120,
        runtime: null,
        releaseDate: null,
        network: "HBO",
        airTime: "21:00",
        airDays: ["Sunday"],
        studio: null,
        sourceMaterial: null,
        tags: ["psychological", "crime"],
        popularity: 9.2,
        voteCount: 8750,
        streamingPlatforms: ["HBO Max", "Hulu"],
        affiliateLinks: ["https://hbomax.com/affiliate/mystery-series", "https://hulu.com/affiliate/mystery-series"],
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: "3",
        title: "Adventure Quest",
        type: "anime",
        source: "manual",
        sourceId: "adventure-quest-3",
        year: 2022,
        endYear: null,
        rating: 8.8,
        imdbRating: 8.6,
        rottenTomatoesRating: 92,
        malRating: 8.9,
        genres: ["Adventure", "Fantasy"],
        poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        backdrop: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "An exciting anime adventure with stunning visuals and an engaging storyline that follows heroes on their epic quest.",
        status: "airing",
        episodes: 24,
        season: 2,
        totalSeasons: 3,
        totalEpisodes: 72,
        runtime: null,
        releaseDate: null,
        network: null,
        airTime: null,
        airDays: null,
        studio: "Studio Animate",
        sourceMaterial: "manga",
        tags: ["shonen", "fantasy-adventure"],
        popularity: 8.8,
        voteCount: 15200,
        streamingPlatforms: ["Crunchyroll", "Funimation"],
        affiliateLinks: ["https://crunchyroll.com/affiliate/adventure-quest"],
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: "4",
        title: "Love Story",
        type: "movie",
        source: "manual",
        sourceId: "love-story-4",
        year: 2024,
        endYear: null,
        rating: 7.9,
        imdbRating: 7.8,
        rottenTomatoesRating: 82,
        malRating: null,
        genres: ["Romance", "Drama"],
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "A heartwarming romantic drama that touches the soul with its beautiful portrayal of love and human connection.",
        status: "completed",
        episodes: null,
        season: null,
        totalSeasons: null,
        totalEpisodes: null,
        runtime: 118,
        releaseDate: null,
        network: null,
        airTime: null,
        airDays: null,
        studio: null,
        sourceMaterial: null,
        tags: ["heartwarming", "relationship"],
        popularity: 7.9,
        voteCount: 9800,
        streamingPlatforms: ["Netflix", "Disney+"],
        affiliateLinks: ["https://netflix.com/affiliate/love-story", "https://disneyplus.com/affiliate/love-story"],
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: "5",
        title: "Space Odyssey",
        type: "movie",
        source: "manual",
        sourceId: "space-odyssey-5",
        year: 2024,
        endYear: null,
        rating: 8.3,
        imdbRating: 8.1,
        rottenTomatoesRating: 88,
        malRating: null,
        genres: ["Sci-Fi", "Adventure"],
        poster: "https://pixabay.com/get/g4cc27b6044dd966154c5b348cf840614c26fe4166b45d112896f3373793000b47875a5be403dc59b78477c28b22d917948c568afb7f490b823998cdd8951b556_1280.jpg",
        backdrop: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "A thrilling space adventure with stunning visual effects that takes viewers on an unforgettable journey through the cosmos.",
        status: "completed",
        episodes: null,
        season: null,
        totalSeasons: null,
        totalEpisodes: null,
        runtime: 142,
        releaseDate: null,
        network: null,
        airTime: null,
        airDays: null,
        studio: null,
        sourceMaterial: null,
        tags: ["space", "exploration"],
        popularity: 8.3,
        voteCount: 11200,
        streamingPlatforms: ["Prime Video", "HBO Max"],
        affiliateLinks: ["https://primevideo.com/affiliate/space-odyssey"],
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: "6",
        title: "Night Terror",
        type: "movie",
        source: "manual",
        sourceId: "night-terror-6",
        year: 2024,
        endYear: null,
        rating: 7.6,
        imdbRating: 7.4,
        rottenTomatoesRating: 78,
        malRating: null,
        genres: ["Horror", "Thriller"],
        poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        backdrop: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675",
        overview: "A spine-chilling horror that will keep you awake at night with its masterful suspense and terrifying atmosphere.",
        status: "completed",
        episodes: null,
        season: null,
        totalSeasons: null,
        totalEpisodes: null,
        runtime: 98,
        releaseDate: null,
        network: null,
        airTime: null,
        airDays: null,
        studio: null,
        sourceMaterial: null,
        tags: ["psychological-horror", "suspense"],
        popularity: 7.6,
        voteCount: 7400,
        streamingPlatforms: ["Netflix", "Hulu"],
        affiliateLinks: ["https://netflix.com/affiliate/night-terror"],
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ];

    sampleContent.forEach(content => {
      this.content.set(content.id, content);
    });

    // Initialize sample user content for demo user (id: '1')
    const sampleUserContent: UserContent[] = [
      {
        id: randomUUID(),
        userId: '1',
        contentId: '2', // Mystery Series
        status: 'watching',
        progress: 15,
        userRating: 4,
        addedAt: new Date('2024-08-20'),
        updatedAt: new Date('2024-08-22')
      },
      {
        id: randomUUID(),
        userId: '1',
        contentId: '3', // Adventure Quest
        status: 'watching',
        progress: 8,
        userRating: null,
        addedAt: new Date('2024-08-18'),
        updatedAt: new Date('2024-08-21')
      },
      {
        id: randomUUID(),
        userId: '1',
        contentId: '1', // Action Hero
        status: 'want_to_watch',
        progress: 0,
        userRating: null,
        addedAt: new Date('2024-08-15'),
        updatedAt: new Date('2024-08-15')
      },
      {
        id: randomUUID(),
        userId: '1',
        contentId: '4', // Love Story
        status: 'want_to_watch',
        progress: 0,
        userRating: null,
        addedAt: new Date('2024-08-19'),
        updatedAt: new Date('2024-08-19')
      },
      {
        id: randomUUID(),
        userId: '1',
        contentId: '5', // Space Odyssey
        status: 'want_to_watch',
        progress: 0,
        userRating: null,
        addedAt: new Date('2024-08-16'),
        updatedAt: new Date('2024-08-16')
      }
    ];

    sampleUserContent.forEach(userContent => {
      this.userContent.set(userContent.id, userContent);
    });
  }
}

// Switch to database storage
import { databaseStorage } from "./storage/database";
export const storage = databaseStorage;
