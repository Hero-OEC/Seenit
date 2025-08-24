import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertContentSchema, insertUserContentSchema } from "@shared/schema";
import { z } from "zod";

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
      const content = await storage.getContentByType(type);
      res.json(content);
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

  const httpServer = createServer(app);
  return httpServer;
}
