import { tvmazeService } from './tvmaze';
import { jikanService } from './jikan';

class SyncManager {
  private isRunning = false;
  private jikanSyncRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly MORNING_HOUR = 8; // 8 AM for TVMaze
  private readonly JIKAN_MORNING_HOUR = 9; // 9 AM for Jikan 
  private readonly SYNC_CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log('SyncManager initializing...');
    
    // Start checking for morning sync opportunity
    this.startScheduler();
    
    // Check if we should start sync immediately (if no content exists)
    try {
      const status = await tvmazeService.getImportStatus();
      if (!status || status.totalImported === 0) {
        console.log('No TVmaze content found, starting initial sync...');
        await this.startMorningSync();
      } else {
        console.log(`TVmaze sync manager ready. Current status: ${status.totalImported} shows imported`);
      }

    } catch (error) {
      console.error('Error during SyncManager initialization:', error);
    }
  }

  private startScheduler() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Check every hour if it's time for morning sync
    this.syncInterval = setInterval(async () => {
      await this.checkMorningSync();
      await this.checkJikanMorningSync();
    }, this.SYNC_CHECK_INTERVAL);

    // Also check immediately
    this.checkMorningSync();
    this.checkJikanMorningSync();
    
    console.log('SyncManager scheduler started - checking every hour for TVMaze (8 AM) and Jikan (9 AM) sync');
  }

  private async checkMorningSync() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if it's morning time (8 AM) and we haven't synced today
    if (currentHour === this.MORNING_HOUR && !this.isRunning) {
      const status = await tvmazeService.getImportStatus();
      
      // Only start if not already active and it's been a while since last sync
      if (!status?.isActive) {
        const lastSync = status?.lastSyncAt ? new Date(status.lastSyncAt) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Start sync if never synced or last sync was before today
        if (!lastSync || lastSync < today) {
          console.log('Starting automatic morning TVmaze sync...');
          await this.startMorningSync();
        }
      }
    }
  }

  private async checkJikanMorningSync() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if it's Jikan sync time (9 AM) and we haven't synced today
    if (currentHour === this.JIKAN_MORNING_HOUR && !this.jikanSyncRunning) {
      const status = await jikanService.getImportStatus();
      
      // Only start if not already active and it's been a while since last sync
      if (!status?.isActive) {
        const lastSync = status?.lastSyncAt ? new Date(status.lastSyncAt) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Start sync if never synced or last sync was before today
        if (!lastSync || lastSync < today) {
          console.log('Starting automatic morning Jikan sync...');
          await this.startJikanDailySync();
        }
      }
    }
  }

  private async startMorningSync() {
    if (this.isRunning) {
      console.log('Sync already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('Starting TVmaze morning sync...');
      
      // Start the sync process
      await tvmazeService.resumeSync();
      
      // Monitor the sync progress
      this.monitorSync();
      
    } catch (error) {
      console.error('Error starting morning sync:', error);
      this.isRunning = false;
    }
  }

  private async startJikanDailySync() {
    if (this.jikanSyncRunning) {
      console.log('Jikan sync already running, skipping...');
      return;
    }

    try {
      this.jikanSyncRunning = true;
      console.log('Starting Jikan daily sync (updating existing anime with new episodes)...');
      
      // For daily sync, focus on updating existing anime (Phase 1 only)
      // This will refresh episode data for currently airing anime
      await jikanService.startDailySync();
      
      // Monitor the Jikan sync progress
      this.monitorJikanSync();
      
    } catch (error) {
      console.error('Error starting Jikan daily sync:', error);
      this.jikanSyncRunning = false;
    }
  }

  private async monitorSync() {
    const checkInterval = setInterval(async () => {
      try {
        const status = await tvmazeService.getImportStatus();
        
        if (!status?.isActive) {
          console.log('TVmaze sync completed or stopped');
          clearInterval(checkInterval);
          this.isRunning = false;
          
          if (status) {
            console.log(`Sync summary: ${status.totalImported} shows imported, ${status.errors?.length || 0} errors`);
          }
        } else {
          console.log(`Sync progress: Page ${status.currentPage}, ${status.totalImported} shows imported`);
        }
      } catch (error) {
        console.error('Error monitoring sync:', error);
        clearInterval(checkInterval);
        this.isRunning = false;
      }
    }, 30000); // Check every 30 seconds
  }

  private async monitorJikanSync() {
    const checkInterval = setInterval(async () => {
      try {
        const status = await jikanService.getImportStatus();
        
        if (!status?.isActive) {
          console.log('Jikan daily sync completed or stopped');
          clearInterval(checkInterval);
          this.jikanSyncRunning = false;
          
          if (status) {
            console.log(`Jikan daily sync summary: ${status.totalImported} anime updated, ${status.errors?.length || 0} errors`);
          }
        } else {
          console.log(`Jikan sync progress: Phase ${status.phase1Progress || 'unknown'}, ${status.totalImported} anime processed`);
        }
      } catch (error) {
        console.error('Error monitoring Jikan sync:', error);
        clearInterval(checkInterval);
        this.jikanSyncRunning = false;
      }
    }, 30000); // Check every 30 seconds
  }

  public async pauseSync() {
    try {
      await tvmazeService.pauseSync();
      this.isRunning = false;
      console.log('Sync paused by request');
    } catch (error) {
      console.error('Error pausing sync:', error);
    }
  }

  public async resumeSync() {
    try {
      await tvmazeService.resumeSync();
      this.monitorSync();
      console.log('Sync resumed by request');
    } catch (error) {
      console.error('Error resuming sync:', error);
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      nextCheck: new Date(Date.now() + this.SYNC_CHECK_INTERVAL),
      morningHour: this.MORNING_HOUR
    };
  }

  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('SyncManager destroyed');
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down SyncManager...');
  syncManager.destroy();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down SyncManager...');
  syncManager.destroy();
});