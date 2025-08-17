import { type User, type InsertUser, type Content, type InsertContent, type UserContent, type InsertUserContent } from "@shared/schema";
import { randomUUID } from "crypto";

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
  searchContent(query: string): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;

  // User content tracking methods
  getUserContent(userId: string): Promise<UserContent[]>;
  getUserContentByStatus(userId: string, status: string): Promise<UserContent[]>;
  addUserContent(userContent: InsertUserContent): Promise<UserContent>;
  updateUserContent(id: string, updates: Partial<UserContent>): Promise<UserContent>;
  removeUserContent(id: string): Promise<void>;
  getUserContentByContentId(userId: string, contentId: string): Promise<UserContent | undefined>;
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
        content.genre?.some(g => g.toLowerCase().includes(lowerQuery))
    );
  }

  async createContent(insertContent: InsertContent): Promise<Content> {
    const id = randomUUID();
    const content: Content = { 
      ...insertContent, 
      id,
      // Ensure nullable fields are properly set
      year: insertContent.year ?? null,
      rating: insertContent.rating ?? null,
      genre: insertContent.genre ?? null,
      poster: insertContent.poster ?? null,
      overview: insertContent.overview ?? null,
      status: insertContent.status ?? null,
      episodes: insertContent.episodes ?? null,
      season: insertContent.season ?? null,
      streamingPlatforms: insertContent.streamingPlatforms ?? null,
      affiliateLinks: insertContent.affiliateLinks ?? null
    };
    this.content.set(id, content);
    return content;
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
        year: 2024,
        rating: "8.5",
        genre: ["Action", "Adventure"],
        poster: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        overview: "An epic action adventure that keeps you on the edge of your seat.",
        status: "completed",
        episodes: null,
        season: null,
        streamingPlatforms: ["Netflix", "Prime Video"],
        affiliateLinks: ["https://netflix.com/affiliate/action-hero", "https://primevideo.com/affiliate/action-hero"]
      },
      {
        id: "2",
        title: "Mystery Series",
        type: "tv",
        year: 2024,
        rating: "9.2",
        genre: ["Drama", "Mystery"],
        poster: "https://pixabay.com/get/g5aa14888be9881f298958bc87eb9d20ce20bf5b70f7db91250c3cc1ce2b44d784134ea678494d856af6689923de2d1819e646131e74afe5787eab63692955f55_1280.jpg",
        overview: "A gripping mystery that unfolds across multiple seasons.",
        status: "airing",
        episodes: 10,
        season: 3,
        streamingPlatforms: ["HBO Max", "Hulu"],
        affiliateLinks: ["https://hbomax.com/affiliate/mystery-series", "https://hulu.com/affiliate/mystery-series"]
      },
      {
        id: "3",
        title: "Adventure Quest",
        type: "anime",
        year: 2024,
        rating: "8.8",
        genre: ["Adventure", "Fantasy"],
        poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        overview: "An exciting anime adventure with stunning visuals.",
        status: "airing",
        episodes: 24,
        season: 2,
        streamingPlatforms: ["Crunchyroll", "Funimation"],
        affiliateLinks: ["https://crunchyroll.com/affiliate/adventure-quest"]
      },
      {
        id: "4",
        title: "Love Story",
        type: "movie",
        year: 2024,
        rating: "7.9",
        genre: ["Romance", "Drama"],
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        overview: "A heartwarming romantic drama that touches the soul.",
        status: "completed",
        episodes: null,
        season: null,
        streamingPlatforms: ["Netflix", "Disney+"],
        affiliateLinks: ["https://netflix.com/affiliate/love-story", "https://disneyplus.com/affiliate/love-story"]
      },
      {
        id: "5",
        title: "Space Odyssey",
        type: "movie",
        year: 2024,
        rating: "8.3",
        genre: ["Sci-Fi", "Adventure"],
        poster: "https://pixabay.com/get/g4cc27b6044dd966154c5b348cf840614c26fe4166b45d112896f3373793000b47875a5be403dc59b78477c28b22d917948c568afb7f490b823998cdd8951b556_1280.jpg",
        overview: "A thrilling space adventure with stunning visual effects.",
        status: "completed",
        episodes: null,
        season: null,
        streamingPlatforms: ["Prime Video", "HBO Max"],
        affiliateLinks: ["https://primevideo.com/affiliate/space-odyssey"]
      },
      {
        id: "6",
        title: "Night Terror",
        type: "movie",
        year: 2024,
        rating: "7.6",
        genre: ["Horror", "Thriller"],
        poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=450",
        overview: "A spine-chilling horror that will keep you awake at night.",
        status: "completed",
        episodes: null,
        season: null,
        streamingPlatforms: ["Netflix", "Hulu"],
        affiliateLinks: ["https://netflix.com/affiliate/night-terror"]
      }
    ];

    sampleContent.forEach(content => {
      this.content.set(content.id, content);
    });
  }
}

export const storage = new MemStorage();
