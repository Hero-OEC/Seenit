import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContentSchema, insertUserContentSchema } from "@shared/schema";
import { z } from "zod";
import { tvmazeService } from "./services/tvmaze";
import { jikanService } from "./services/jikan";
import { tmdbService } from "./services/tmdb";


export async function registerRoutes(app: Express): Promise<Server> {
  // Content routes
  app.get("/api/content", async (_req, res) => {
    try {
      const content = await storage.getAllContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/content/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { page = "0", limit = "20", genre, sort } = req.query;
      
      const pageNum = parseInt(page as string) || 0;
      const limitNum = parseInt(limit as string) || 20;
      const offset = pageNum * limitNum;
      
      const result = await storage.getContentByType(type, {
        offset,
        limit: limitNum,
        genre: genre as string,
        sort: sort as string
      });
      
      const total = await storage.getContentCountByType(type, { genre: genre as string });
      
      res.json({
        content: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          hasMore: (offset + limitNum) < total
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content by type" });
    }
  });

  app.get("/api/content/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const content = await storage.searchContent(q);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to search content" });
    }
  });

  app.get("/api/content/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json([]);
      }
      
      const results = await storage.searchContent(q.trim());
      // Return just essential info for suggestions, limited to 8 results
      const suggestions = results
        .slice(0, 8)
        .map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          year: item.year,
          poster: item.poster
        }));
      
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  app.get("/api/content/recommended", async (_req, res) => {
    try {
      // Get a random selection of content for recommendations
      const allContent = await storage.getAllContent();
      const shuffled = allContent.sort(() => 0.5 - Math.random());
      const recommended = shuffled.slice(0, 8); // Return 8 recommended items
      res.json(recommended);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommended content" });
    }
  });

  app.get("/api/content/schedule/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const { type = "tv" } = req.query;
      
      if (!["tv", "anime"].includes(type as string)) {
        return res.status(400).json({ message: "Invalid content type for schedule" });
      }
      
      const allContent = await storage.getAllContent();
      const episodes: any[] = [];
      
      // Extract episodes that air on the specified date
      allContent.forEach((content: any) => {
        if (content.episodeData && content.type === type) {
          try {
            const episodeData = typeof content.episodeData === 'string' 
              ? JSON.parse(content.episodeData) 
              : content.episodeData;
            
            // Normalize episode data structure - handle both episodeData.episodes and episodeData as array
            const episodeArray = Array.isArray(episodeData?.episodes) 
              ? episodeData.episodes 
              : Array.isArray(episodeData) 
                ? episodeData 
                : [];
            
            if (episodeArray.length > 0) {
              // Find episodes that air on this date
              const dateEpisodes = episodeArray
                .filter((ep: any) => {
                  if (!ep.airdate) return false;
                  // Handle both simple date format (TV shows) and ISO format (anime)
                  const episodeDate = ep.airdate.includes('T') 
                    ? ep.airdate.split('T')[0]  // Extract date part from ISO format
                    : ep.airdate;
                  return episodeDate === date;
                })
                .map((ep: any) => ({
                  ...ep,
                  // Normalize episode number field (anime uses episodeNumber, TV uses number)
                  number: ep.number || ep.episodeNumber,
                  contentId: content.id,
                  showTitle: content.title,
                  type: content.type,
                  status: content.status,
                  image: content.poster ? { medium: content.poster } : null
                }));
              
              episodes.push(...dateEpisodes);
            }
          } catch (error) {
            console.error('Error parsing episode data for schedule:', content.id, error);
          }
        }
      });
      
      // No fallback - return empty array if no episodes found for the specific date
      // This prevents the same episodes from appearing on every day
      
      res.json(episodes); // Return all episodes for the date
    } catch (error) {
      console.error('Schedule error:', error);
      res.status(500).json({ message: "Failed to fetch scheduled content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getContent(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const validatedData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(validatedData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // User content tracking routes
  app.get("/api/users/:userId/content", async (req, res) => {
    try {
      const { userId } = req.params;
      const userContent = await storage.getUserContent(userId);
      
      // Enrich with content details
      const enrichedContent = await Promise.all(
        userContent.map(async (uc) => {
          const content = await storage.getContent(uc.contentId);
          return { ...uc, content };
        })
      );
      
      res.json(enrichedContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user content" });
    }
  });

  app.get("/api/users/:userId/content/status/:status", async (req, res) => {
    try {
      const { userId, status } = req.params;
      const userContent = await storage.getUserContentByStatus(userId, status);
      
      // Enrich with content details
      const enrichedContent = await Promise.all(
        userContent.map(async (uc) => {
          const content = await storage.getContent(uc.contentId);
          return { ...uc, content };
        })
      );
      
      res.json(enrichedContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user content by status" });
    }
  });

  app.post("/api/users/:userId/content", async (req, res) => {
    try {
      const { userId } = req.params;
      const validatedData = insertUserContentSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user content already exists
      const existing = await storage.getUserContentByContentId(userId, validatedData.contentId);
      if (existing) {
        return res.status(400).json({ message: "Content already in user's list" });
      }
      
      const userContent = await storage.addUserContent(validatedData);
      res.status(201).json(userContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add content to user list" });
    }
  });

  app.patch("/api/users/:userId/content/:contentId", async (req, res) => {
    try {
      const { userId, contentId } = req.params;
      const userContent = await storage.getUserContentByContentId(userId, contentId);
      
      if (!userContent) {
        return res.status(404).json({ message: "User content not found" });
      }
      
      const updates = req.body;
      const updatedUserContent = await storage.updateUserContent(userContent.id, updates);
      res.json(updatedUserContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user content" });
    }
  });

  app.delete("/api/users/:userId/content/:contentId", async (req, res) => {
    try {
      const { userId, contentId } = req.params;
      const userContent = await storage.getUserContentByContentId(userId, contentId);
      
      if (!userContent) {
        return res.status(404).json({ message: "User content not found" });
      }
      
      await storage.removeUserContent(userContent.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove user content" });
    }
  });

  // User stats route
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const { userId } = req.params;
      const userContent = await storage.getUserContent(userId);
      
      const stats = {
        watched: userContent.filter(uc => uc.status === 'watched').length,
        watching: userContent.filter(uc => uc.status === 'watching').length,
        watchlist: userContent.filter(uc => uc.status === 'want_to_watch').length,
        avgRating: userContent.length > 0 
          ? (userContent.reduce((sum, uc) => sum + (uc.userRating || 0), 0) / userContent.filter(uc => uc.userRating).length).toFixed(1)
          : "0.0"
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Recommendations route
  app.get("/api/content/:contentId/recommendations", async (req, res) => {
    try {
      const { contentId } = req.params;
      const content = await storage.getContent(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      // Get recommendations based on shared genres and type
      const allContent = await storage.getAllContent();
      const currentGenres = content.genres || [];
      
      const recommendations = allContent
        .filter((item: any) => item.id !== contentId)
        .map((item: any) => {
          const sharedGenres = item.genres?.filter((g: string) => currentGenres.includes(g)).length || 0;
          const typeMatch = item.type === content.type ? 1 : 0;
          return {
            ...item,
            score: sharedGenres * 2 + typeMatch
          };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 8);
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Recent episodes route
  app.get("/api/content/recent-episodes", async (req, res) => {
    try {
      const allContent = await storage.getAllContent();
      const episodes: any[] = [];
      
      // Extract episodes from content with episode data
      allContent.forEach((content: any) => {
        if (content.episodeData && (content.type === 'tv' || content.type === 'anime')) {
          try {
            const episodeData = typeof content.episodeData === 'string' 
              ? JSON.parse(content.episodeData) 
              : content.episodeData;
            
            // Handle the nested episodes structure
            const episodeArray = episodeData?.episodes || episodeData;
            
            if (Array.isArray(episodeArray) && episodeArray.length > 0) {
              // Get the most recent episodes
              const recentEpisodes = episodeArray
                .filter((ep: any) => ep.airdate && new Date(ep.airdate) <= new Date())
                .sort((a: any, b: any) => new Date(b.airdate).getTime() - new Date(a.airdate).getTime())
                .slice(0, 2)
                .map((ep: any) => ({
                  ...ep,
                  contentId: content.id,
                  showTitle: content.title,
                  type: content.type,
                  status: content.status,
                  image: content.poster ? { medium: content.poster } : null
                }));
              
              episodes.push(...recentEpisodes);
            }
          } catch (error) {
            console.error('Error parsing episode data for content:', content.id, error);
          }
        }
      });
      
      // Sort all episodes by air date and return top 10
      const sortedEpisodes = episodes
        .sort((a, b) => new Date(b.airdate).getTime() - new Date(a.airdate).getTime())
        .slice(0, 10);
      
      // Return episodes or empty array if none found
      res.json(sortedEpisodes);
    } catch (error) {
      console.error('Recent episodes error:', error);
      res.status(500).json({ message: "Failed to fetch recent episodes" });
    }
  });

  // Featured content route for hero section
  app.get("/api/content/featured", async (req, res) => {
    try {
      const allContent = await storage.getAllContent();
      
      // Get a highly-rated content for the hero section (any type)
      const featured = allContent
        .filter((content: any) => content.imdbRating && parseFloat(content.imdbRating) > 8.0)
        .sort((a: any, b: any) => (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0))[0] ||
        allContent[0]; // Fallback to first content if none are highly rated
      
      if (!featured) {
        return res.status(404).json({ message: "No featured content available" });
      }
      
      res.json(featured);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured content" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username) || 
                           await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Import routes for TVmaze
  app.get("/api/import/tvmaze/status", async (_req, res) => {
    try {
      const status = await tvmazeService.getImportStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get import status" });
    }
  });

  app.post("/api/import/tvmaze/start", async (_req, res) => {
    try {
      // Resume/start sync
      await tvmazeService.resumeSync();
      res.json({ message: "TVmaze import started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start import" });
    }
  });

  app.post("/api/import/tvmaze/pause", async (_req, res) => {
    try {
      await tvmazeService.pauseSync();
      res.json({ message: "TVmaze import paused" });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause import" });
    }
  });

  app.get("/api/import/tvmaze/content", async (_req, res) => {
    try {
      const content = await storage.getContentBySource('tvmaze');
      res.json({
        count: content.length,
        content: content.slice(0, 20).map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          year: item.year,
          rating: item.rating,
          status: item.status,
          totalSeasons: item.totalSeasons,
          totalEpisodes: item.totalEpisodes,
          network: item.network,
          genres: item.genres
        })) // Return first 20 for preview with full details
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get TVmaze content" });
    }
  });

  // Delete all content from specific API sources
  app.delete("/api/import/tvmaze/data", async (_req, res) => {
    try {
      const deletedCount = await storage.deleteContentBySource('tvmaze');
      
      // Reset TVmaze import status so it starts from the beginning
      await tvmazeService.resetImportStatus();
      
      res.json({ 
        message: `Deleted ${deletedCount} TVmaze records and reset import status`,
        deletedCount 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete TVmaze data" });
    }
  });

  app.delete("/api/import/tmdb/data", async (_req, res) => {
    try {
      const deletedCount = await storage.deleteContentBySource('tmdb');
      res.json({ 
        message: `Deleted ${deletedCount} TMDB records`,
        deletedCount 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete TMDB data" });
    }
  });

  // Import routes for Jikan
  app.get("/api/import/jikan/status", async (_req, res) => {
    try {
      const status = await jikanService.getImportStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get Jikan import status" });
    }
  });

  app.post("/api/import/jikan/start", async (_req, res) => {
    try {
      // Start async import (don't await completion)
      jikanService.startImport().catch(error => {
        console.error('Jikan import failed:', error);
      });
      res.json({ message: "Jikan import started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start Jikan import" });
    }
  });

  app.post("/api/import/jikan/pause", async (_req, res) => {
    try {
      await jikanService.pauseImport();
      res.json({ message: "Jikan import paused" });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause Jikan import" });
    }
  });

  app.get("/api/import/jikan/content", async (_req, res) => {
    try {
      const count = await jikanService.getContentCount();
      const content = await jikanService.getSampleContent(20);
      res.json({
        count,
        content: content.map(item => ({
          id: item.id,
          title: item.title,
          year: item.year,
          rating: item.rating,
          episodes: item.episodes,
          studio: item.studio
        }))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get Jikan content" });
    }
  });

  app.delete("/api/import/jikan/data", async (_req, res) => {
    try {
      await jikanService.deleteAllData();
      res.json({ 
        message: "Deleted all Jikan records and reset import status",
        deletedCount: await jikanService.getContentCount()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete Jikan data" });
    }
  });

  app.delete("/api/import/:source/data", async (req, res) => {
    try {
      const { source } = req.params;
      const validSources = ['tvmaze', 'tmdb', 'jikan', 'manual'];
      
      if (!validSources.includes(source)) {
        return res.status(400).json({ message: "Invalid source. Must be one of: tvmaze, tmdb, jikan, manual" });
      }
      
      const deletedCount = await storage.deleteContentBySource(source);
      res.json({ 
        message: `Deleted ${deletedCount} ${source} records`,
        deletedCount,
        source
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete ${req.params.source} data` });
    }
  });

  // TMDB routes
  app.get("/api/tmdb/search/movies", async (req, res) => {
    try {
      const { q, page = "1" } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const pageNum = parseInt(page as string) || 1;
      const results = await tmdbService.searchMovies(q, pageNum);
      res.json(results);
    } catch (error) {
      console.error("TMDB movie search failed:", error);
      res.status(500).json({ message: "Failed to search movies" });
    }
  });

  app.get("/api/tmdb/search/tv", async (req, res) => {
    try {
      const { q, page = "1" } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const pageNum = parseInt(page as string) || 1;
      const results = await tmdbService.searchTVShows(q, pageNum);
      res.json(results);
    } catch (error) {
      console.error("TMDB TV search failed:", error);
      res.status(500).json({ message: "Failed to search TV shows" });
    }
  });

  app.get("/api/tmdb/movie/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const movieId = parseInt(id);
      
      if (isNaN(movieId)) {
        return res.status(400).json({ message: "Invalid movie ID" });
      }
      
      const movie = await tmdbService.getMovieDetails(movieId);
      res.json(movie);
    } catch (error) {
      console.error("TMDB movie details failed:", error);
      res.status(500).json({ message: "Failed to get movie details" });
    }
  });

  app.get("/api/tmdb/tv/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tvId = parseInt(id);
      
      if (isNaN(tvId)) {
        return res.status(400).json({ message: "Invalid TV show ID" });
      }
      
      const tvShow = await tmdbService.getTVShowDetails(tvId);
      res.json(tvShow);
    } catch (error) {
      console.error("TMDB TV details failed:", error);
      res.status(500).json({ message: "Failed to get TV show details" });
    }
  });

  app.post("/api/import/tmdb/movies", async (req, res) => {
    try {
      const body = z.object({
        maxPages: z.number().min(1).max(50).default(5)
      }).parse(req.body);
      
      const result = await tmdbService.importPopularMovies(body.maxPages);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("TMDB movie import failed:", error);
      res.status(500).json({ message: "Failed to import movies" });
    }
  });

  app.post("/api/import/tmdb/tv", async (req, res) => {
    try {
      const body = z.object({
        maxPages: z.number().min(1).max(50).default(5)
      }).parse(req.body);
      
      const result = await tmdbService.importPopularTVShows(body.maxPages);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("TMDB TV import failed:", error);
      res.status(500).json({ message: "Failed to import TV shows" });
    }
  });

  // TMDB status routes 
  app.get("/api/import/tmdb/status", async (_req, res) => {
    try {
      const status = await tmdbService.getImportStatus();
      if (!status) {
        return res.json({
          source: 'tmdb',
          isActive: false,
          totalImported: 0,
          phase1Progress: null
        });
      }
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to get TMDB import status" });
    }
  });

  app.post("/api/import/tmdb/pause", async (_req, res) => {
    try {
      await tmdbService.pauseImport();
      res.json({ message: "TMDB import paused" });
    } catch (error) {
      res.status(500).json({ message: "Failed to pause TMDB import" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
