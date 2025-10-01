// Simplified in-memory quota provider
// TODO: Add database persistence later if needed

interface QuotaData {
  dateUTC: string;
  usedToday: number;
  dailyLimit: number;
  nextResetUTC: string;
  exhaustedUntilUTC: string | null;
}

export class QuotaProvider {
  private data: QuotaData;

  constructor(private dailyLimit: number = 1000) {
    this.data = this.createFreshQuota();
  }

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

  private createFreshQuota(): QuotaData {
    return {
      dateUTC: this.getTodayUTC(),
      usedToday: 0,
      dailyLimit: this.dailyLimit,
      nextResetUTC: this.getNextMidnightUTC(),
      exhaustedUntilUTC: null,
    };
  }

  private checkAndResetIfNewDay(): void {
    if (this.data.dateUTC !== this.getTodayUTC()) {
      console.log('[QuotaProvider] New day detected, resetting quota');
      this.data = this.createFreshQuota();
    }
  }

  async get(): Promise<QuotaData> {
    this.checkAndResetIfNewDay();
    return { ...this.data };
  }

  async set(updates: Partial<QuotaData>): Promise<void> {
    this.checkAndResetIfNewDay();
    this.data = { ...this.data, ...updates };
  }

  async increment(): Promise<number> {
    this.checkAndResetIfNewDay();
    this.data.usedToday++;
    
    // Check if we've hit the limit
    if (this.data.usedToday >= this.dailyLimit) {
      this.data.exhaustedUntilUTC = this.getNextMidnightUTC();
    }
    
    return this.data.usedToday;
  }

  async isExhausted(): Promise<boolean> {
    this.checkAndResetIfNewDay();
    
    // Check if we're currently exhausted
    if (this.data.exhaustedUntilUTC) {
      const exhaustedUntil = new Date(this.data.exhaustedUntilUTC);
      const now = new Date();
      
      if (now < exhaustedUntil) {
        return true; // Still exhausted
      } else {
        // Exhaustion period has passed, clear it
        this.data.exhaustedUntilUTC = null;
        return false;
      }
    }

    return this.data.usedToday >= this.dailyLimit;
  }

  async getRemaining(): Promise<number> {
    this.checkAndResetIfNewDay();
    return Math.max(0, this.dailyLimit - this.data.usedToday);
  }

  async getNextResetUTC(): Promise<string> {
    this.checkAndResetIfNewDay();
    return this.data.nextResetUTC;
  }

  async getStats(): Promise<{
    used: number;
    remaining: number;
    limit: number;
    nextReset: string;
    isExhausted: boolean;
    exhaustedUntil: string | null;
  }> {
    this.checkAndResetIfNewDay();
    const isExhausted = await this.isExhausted();
    
    return {
      used: this.data.usedToday,
      remaining: Math.max(0, this.dailyLimit - this.data.usedToday),
      limit: this.dailyLimit,
      nextReset: this.data.nextResetUTC,
      isExhausted,
      exhaustedUntil: this.data.exhaustedUntilUTC,
    };
  }
}
