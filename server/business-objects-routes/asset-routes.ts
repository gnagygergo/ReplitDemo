import type { Express } from "express";
import { z } from "zod";
import { insertAssetSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerAssetRoutes(app: Express, storage: IStorage) {
  // Asset routes - user's company context queried and handed over to method
  app.get("/api/assets", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as string | undefined;
      const searchTerm = req.query.search as string | undefined;

      let assets;
      if (searchTerm) {
        assets = await storage.searchAssets(companyContext || undefined, searchTerm);
      } else {
        assets = await storage.getAssets(companyContext || undefined, sortBy, sortOrder);
      }
      
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(401).json({ message: "Unauthorized - no company context" });
      }

      const validatedData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(validatedData, companyContext);
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating asset:", error);
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  app.get("/api/assets/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(401).json({ message: "Unauthorized - no company context" });
      }

      const asset = await storage.getAsset(req.params.id, companyContext);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(401).json({ message: "Unauthorized - no company context" });
      }

      const validatedData = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(req.params.id, validatedData, companyContext);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating asset:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(401).json({ message: "Unauthorized - no company context" });
      }

      const deleted = await storage.deleteAsset(req.params.id, companyContext);
      if (!deleted) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Get assets by account
  app.get("/api/accounts/:id/assets", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const assets = await storage.getAssetsByAccount(req.params.id, companyContext || undefined);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets by account:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });
}
