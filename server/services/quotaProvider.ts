import { db } from "../db";
import { importStatus } from "@shared/schema";
import { eq } from "drizzle-orm";

interface QuotaData {
  dateUTC: string;
  usedToday: number;
  dailyLimit: number;
  nextResetUTC: string;
  exhaustedUntilUTC: string | null;
}

export class QuotaProvider {
  private static readonly QUOTA_SOURCE = 'omdb_quota';
  private cache: QuotaData | null = null;

  constructor(private dailyLimit: number = 1000) {}

  private getNextMidnightUTC(): string {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  private getTodayUTC(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async get(): Promise<QuotaData> {
    // Return cached data if available and current
    if (this.cache && this.cache.dateUTC === this.getTodayUTC()) {
      return this.cache;
    }

    // Try to load from database
    const [record] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, QuotaProvider.QUOTA_SOURCE));

    if (record && record.cursor) {
      const data = record.cursor as unknown as QuotaData;
      
      // Check if it's a new day - reset if so
      if (data.dateUTC !== this.getTodayUTC()) {
        console.log('[QuotaProvider] New day detected, resetting quota');
        return await this.reset();
      }

      this.cache = data;
      return data;
    }

    // Initialize if not found
    console.log('[QuotaProvider] Initializing quota tracking');
    return await this.reset();
  }

  async set(data: Partial<QuotaData>): Promise<void> {
    const current = await this.get();
    const updated: QuotaData = { ...current, ...data };
    
    // Update database
    const [record] = await db
      .select()
      .from(importStatus)
      .where(eq(importStatus.source, QuotaProvider.QUOTA_SOURCE));

    if (record) {
      await db
        .update(importStatus)
        .set({
          cursor: updated as any,
          updatedAt: new Date(),
        })
        .where(eq(importStatus.source, QuotaProvider.QUOTA_SOURCE));
    } else {
      await db.insert(importStatus).values({
        source: QuotaProvider.QUOTA_SOURCE,
        cursor: updated as any,
        totalImported: 0,
        totalAvailable: 0,
      });
    }

    this.cache = updated;
  }

  async increment(): Promise<number> {
    const current = await this.get();
    const newUsed = current.usedToday + 1;
    
    // Check if we've hit the limit
    const exhaustedUntil = newUsed >= this.dailyLimit ? this.getNextMidnightUTC() : null;
    
    await this.set({
      usedToday: newUsed,
      exhaustedUntilUTC: exhaustedUntil,
    });

    return newUsed;
  }

  async isExhausted(): Promise<boolean> {
    const current = await this.get();
    
    // Check if we're currently exhausted
    if (current.exhaustedUntilUTC) {
      const exhaustedUntil = new Date(current.exhaustedUntilUTC);
      const now = new Date();
      
      if (now < exhaustedUntil) {
        return true; // Still exhausted
      } else {
        // Exhaustion period has passed, clear it
        await this.set({ exhaustedUntilUTC: null });
        return false;
      }
    }

    return current.usedToday >= this.dailyLimit;
  }

  async getRemaining(): Promise<number> {
    const current = await this.get();
    return Math.max(0, this.dailyLimit - current.usedToday);
  }

  async getNextResetUTC(): Promise<string> {
    const current = await this.get();
    return current.nextResetUTC;
  }

  private async reset(): Promise<QuotaData> {
    const data: QuotaData = {
      dateUTC: this.getTodayUTC(),
      usedToday: 0,
      dailyLimit: this.dailyLimit,
      nextResetUTC: this.getNextMidnightUTC(),
      exhaustedUntilUTC: null,
    };

    await this.set(data);
    return data;
  }

  // Get stats for display
  async getStats(): Promise<{
    used: number;
    remaining: number;
    limit: number;
    nextReset: string;
    isExhausted: boolean;
    exhaustedUntil: string | null;
  }> {
    const data = await this.get();
    const isExhausted = await this.isExhausted();
    
    return {
      used: data.usedToday,
      remaining: Math.max(0, data.dailyLimit - data.usedToday),
      limit: data.dailyLimit,
      nextReset: data.nextResetUTC,
      isExhausted,
      exhaustedUntil: data.exhaustedUntilUTC,
    };
  }
}
