import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContentSchema, insertUserContentSchema, content } from "@shared/schema";
import { z } from "zod";
import { tvmazeService } from "./services/tvmaze";
import { jikanService } from "./services/jikan";
import { tmdbService } from "./services/tmdb";
import { db } from "./db";
import { eq } from "drizzle-orm";


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

  // Get trending movies with trailers for homepage hero section
  // NOTE: This route must come BEFORE /api/content/:id to avoid being caught by the :id parameter
  app.get("/api/content/trending-movies-with-trailers", async (req, res) => {
    try {
      const { limit = "5" } = req.query;
      let limitNum = parseInt(limit as string) || 5;
      
      // Validate and cap limit to prevent abuse
      if (limitNum < 1) limitNum = 1;
      if (limitNum > 20) limitNum = 20;
      
      const trendingMoviesWithTrailers: any[] = [];
      const seenSourceKeys = new Set<string>(); // Track source:sourceId to prevent duplicates
      let page = 1;
      const maxPages = 5; // Limit how many TMDB pages we check
      
      // Iterate through trending movies to find ones with trailers
      while (trendingMoviesWithTrailers.length < limitNum && page <= maxPages) {
        const trending = await tmdbService.getTrendingMovies('week', page);
        
        for (const movie of trending.results) {
          const sourceKey = `tmdb:${movie.id}`;
          
          // Skip if we already processed this movie
          if (seenSourceKeys.has(sourceKey)) continue;
          seenSourceKeys.add(sourceKey);
          
          if (trendingMoviesWithTrailers.length >= limitNum) break;
          
          // Check if already exists in DB
          let existing = await storage.getContentBySourceId('tmdb', movie.id.toString());
          
          if (existing) {
            // If it has a trailer, add it to results
            if (existing.trailerKey) {
              trendingMoviesWithTrailers.push(existing);
            }
          } else {
            // Import the movie with trailer
            const contentData = await tmdbService.convertMovieToContent(movie);
            if (contentData.trailerKey) {
              const newContent = await storage.createContent(contentData);
              trendingMoviesWithTrailers.push(newContent);
            }
          }
        }
        
        page++;
      }
      
      // If we still don't have enough, supplement with other movies with trailers from DB
      if (trendingMoviesWithTrailers.length < limitNum) {
        const needed = limitNum - trendingMoviesWithTrailers.length;
        const dbMovies = await storage.getMoviesWithTrailers(needed * 2); // Get extra to account for duplicates
        
        // Only add movies we haven't already included (check by source:sourceId)
        for (const movie of dbMovies) {
          if (trendingMoviesWithTrailers.length >= limitNum) break;
          const sourceKey = `${movie.source}:${movie.sourceId}`;
          if (!seenSourceKeys.has(sourceKey)) {
            seenSourceKeys.add(sourceKey);
            trendingMoviesWithTrailers.push(movie);
          }
        }
      }
      
      res.json(trendingMoviesWithTrailers.slice(0, limitNum));
    } catch (error) {
      console.error("Failed to get trending movies with trailers:", error);
      res.status(500).json({ message: "Failed to get trending movies" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const { id} = req.params;
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


  app.post("/api/import/tmdb/movies", async (req, res) => {
    try {
      const body = z.object({
        maxPages: z.number().min(1).max(500).default(20)
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

  app.post("/api/import/tmdb/recent", async (req, res) => {
    try {
      const body = z.object({
        maxPages: z.number().min(1).max(100).default(10)
      }).parse(req.body);
      
      const result = await tmdbService.importRecentMovies(body.maxPages);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("TMDB recent movie import failed:", error);
      res.status(500).json({ message: "Failed to import recent movies" });
    }
  });

  app.post("/api/import/tmdb/hybrid", async (req, res) => {
    try {
      const body = z.object({
        popularPages: z.number().min(1).max(500).default(20),
        recentPages: z.number().min(1).max(100).default(10)
      }).parse(req.body);
      
      const result = await tmdbService.importHybrid(body.popularPages, body.recentPages);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("TMDB hybrid import failed:", error);
      res.status(500).json({ message: "Failed to import movies via hybrid approach" });
    }
  });

  app.post("/api/import/tmdb/comprehensive", async (req, res) => {
    try {
      const body = z.object({
        maxPages: z.number().min(1).max(500).default(100)
      }).parse(req.body);
      
      const result = await tmdbService.importComprehensive(body.maxPages);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request", errors: error.errors });
      }
      console.error("TMDB comprehensive import failed:", error);
      res.status(500).json({ message: "Failed to import movies comprehensively" });
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

  app.get("/api/import/tmdb/content", async (_req, res) => {
    try {
      const content = await storage.getContentBySource('tmdb');
      res.json({
        count: content.length,
        content: content.slice(0, 20).map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          year: item.year,
          rating: item.rating,
          status: item.status,
          runtime: item.runtime,
          releaseDate: item.releaseDate,
          genres: item.genres
        })) // Return first 20 for preview with full details
      });
    } catch (error) {
      console.error("Failed to get TMDB content:", error);
      res.status(500).json({ message: "Failed to get TMDB content" });
    }
  });

  // Rating status endpoint - shows rating statistics and OMDb quota
  app.get("/api/ratings/status", async (req, res) => {
    try {
      const { ratingBackfillManager } = await import("./services/ratingBackfillManager");
      const status = await ratingBackfillManager.getStatus();
      
      // Get rated counts by type
      const [movieRated] = await db.select({count: sql`count(*)`}).from(content).where(
        and(eq(content.type, 'movie'), sql`${content.imdbRating} IS NOT NULL`)
      );
      const [movieTotal] = await db.select({count: sql`count(*)`}).from(content).where(eq(content.type, 'movie'));
      
      const [tvRated] = await db.select({count: sql`count(*)`}).from(content).where(
        and(eq(content.type, 'tv'), sql`${content.imdbRating} IS NOT NULL`)
      );
      const [tvTotal] = await db.select({count: sql`count(*)`}).from(content).where(eq(content.type, 'tv'));
      
      const [animeRated] = await db.select({count: sql`count(*)`}).from(content).where(
        and(eq(content.type, 'anime'), sql`${content.malRating} IS NOT NULL`)
      );
      const [animeTotal] = await db.select({count: sql`count(*)`}).from(content).where(eq(content.type, 'anime'));

      res.json({
        countsByType: {
          movie: {
            total: Number(movieTotal.count),
            rated: Number(movieRated.count),
            unrated: Number(movieTotal.count) - Number(movieRated.count),
          },
          tv: {
            total: Number(tvTotal.count),
            rated: Number(tvRated.count),
            unrated: Number(tvTotal.count) - Number(tvRated.count),
          },
          anime: {
            total: Number(animeTotal.count),
            rated: Number(animeRated.count),
            unrated: Number(animeTotal.count) - Number(animeRated.count),
          },
        },
        omdb: {
          used: status.omdbQuota.used,
          remaining: status.omdbQuota.remaining,
          limit: status.omdbQuota.limit,
          nextReset: status.omdbQuota.nextReset,
          isExhausted: status.omdbQuota.isExhausted,
          exhaustedUntil: status.omdbQuota.exhaustedUntil,
        },
        backfill: {
          isRunning: status.isRunning,
          lastRun: status.lastRun,
          lastError: status.lastError,
          nextRunIn: status.nextRunIn,
          unratedCounts: status.unratedCounts,
        },
      });
    } catch (error) {
      console.error("Failed to get rating status:", error);
      res.status(500).json({ message: "Failed to get rating status" });
    }
  });

  // OMDb rating update endpoint - updates existing content with IMDb ratings
  // Protected with admin secret for security
  app.post("/api/ratings/update", async (req, res) => {
    try {
      // Basic authentication - require admin secret
      const adminSecret = process.env.ADMIN_SECRET || 'dev-secret-change-in-production';
      const providedSecret = req.headers['x-admin-secret'] || req.query.secret;
      
      if (providedSecret !== adminSecret) {
        return res.status(401).json({ message: "Unauthorized - Admin secret required" });
      }

      const { limit = 100 } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 100, 1000); // Max 1000 per request
      
      // Get content without imdbId (needs rating update)
      const allContent = await storage.getAllContent();
      const needsUpdate = allContent.filter(item => 
        (item.type === 'movie' || item.type === 'tv') && !item.imdbId
      ).slice(0, limitNum);

      let updated = 0;
      let failed = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const item of needsUpdate) {
        try {
          let imdbId = null;

          // Get IMDb ID based on source
          if (item.source === 'tmdb' && item.type === 'movie') {
            const externalIds = await tmdbService.getMovieExternalIds(parseInt(item.sourceId));
            imdbId = externalIds.imdb_id;
          } else if (item.source === 'tvmaze' && item.type === 'tv') {
            // Use TVMaze service to respect rate limiting
            const tvmazeId = parseInt(item.sourceId);
            const show = await tvmazeService.getShowById(tvmazeId);
            imdbId = show.externals?.imdb || null;
          }

          if (!imdbId) {
            console.warn(`[Rating Update] No IMDb ID found for ${item.title}`);
            // Still update to mark that we checked (store null imdbId)
            await db.update(content)
              .set({
                imdbId: null,
                lastUpdated: new Date()
              })
              .where(eq(content.id, item.id));
            skipped++;
            continue;
          }

          // Fetch IMDb rating from OMDb
          const { omdbService } = await import("./services/omdb");
          const omdbData = await omdbService.getImdbRating(imdbId);
          
          // Always store imdbId even if rating is null
          const updateData: any = {
            imdbId: imdbId,
            lastUpdated: new Date()
          };

          if (omdbData.rating !== null) {
            updateData.rating = omdbData.rating;
            updateData.imdbRating = omdbData.rating;
            updateData.voteCount = omdbData.votes;
            console.log(`[Rating Update] Updated "${item.title}" with IMDb rating: ${omdbData.rating}`);
          } else {
            console.warn(`[Rating Update] No IMDb rating available for "${item.title}" (${imdbId})`);
          }

          await db.update(content)
            .set(updateData)
            .where(eq(content.id, item.id));
          
          updated++;
        } catch (error) {
          failed++;
          const errorMsg = `Failed to update ${item.title}: ${error}`;
          errors.push(errorMsg);
          console.error(`[Rating Update] ${errorMsg}`);
        }
      }

      // Recompute remaining count after updates
      const updatedContent = await storage.getAllContent();
      const remaining = updatedContent.filter(item => 
        (item.type === 'movie' || item.type === 'tv') && !item.imdbId
      ).length;

      res.json({
        message: "Rating update completed",
        updated,
        skipped,
        failed,
        total: needsUpdate.length,
        remaining,
        errors: errors.slice(0, 10) // Return first 10 errors
      });
    } catch (error) {
      console.error("Rating update failed:", error);
      res.status(500).json({ message: "Failed to update ratings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
