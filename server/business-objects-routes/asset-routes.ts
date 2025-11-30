//Asset Routes - don't contain specific fields. This is a generic codebase, meeting standardization requirements.
import type { Express } from "express";
import { z } from "zod";
import { insertAssetSchema } from "@shared/schema";
import { AssetStorage } from "./asset-storage";
import type { IStorage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerAssetRoutes(app: Express, storage: IStorage) {
  const assetStorage = new AssetStorage();
  app.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const assets = await assetStorage.getAssets(companyContext || undefined);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);

      const asset = await assetStorage.getAsset(
        req.params.id,
        companyContext || undefined,
      );
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      console.error("Error fetching asset:", error);
      res.status(500).json({ message: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      const sessionUser = (req.session as any).user;
      let currentUserId;

      if (sessionUser && sessionUser.isDbUser) {
        currentUserId = sessionUser.id;
      } else {
        currentUserId = req.user?.claims?.sub;
      }

      if (!currentUserId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(currentUserId);
      if (!user || !user.companyContext) {
        return res
          .status(400)
          .json({ message: "User has no company context set" });
      }

      const assetData = {
        ...validatedData,
        companyId: user.companyContext,
      };
      const asset = await assetStorage.createAsset(assetData);
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

  app.patch("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const validatedData = insertAssetSchema.partial().parse(req.body);
      const asset = await assetStorage.updateAsset(
        req.params.id,
        validatedData,
        companyContext || undefined,
      );
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

  app.delete("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await assetStorage.deleteAsset(
        req.params.id,
        companyContext || undefined,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Asset not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });
}
