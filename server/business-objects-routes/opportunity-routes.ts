import type { Express } from "express";
import { z } from "zod";
import { insertOpportunitySchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerOpportunityRoutes(app: Express, storage: IStorage) {
  // Opportunity routes respecting company context
  app.get("/api/opportunities", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const opportunities = await storage.getOpportunities(
        companyContext || undefined,
      );
      res.json(opportunities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/opportunities/:id", async (req, res) => {
    try {
      const opportunity = await storage.getOpportunity(req.params.id);
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch opportunity" });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.createOpportunity(validatedData);
      res.status(201).json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "Account not found") {
          return res.status(400).json({ message: "Account not found" });
        }
        if (error.message === "Owner not found") {
          return res.status(400).json({ message: "Owner not found" });
        }
      }
      res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  app.patch("/api/opportunities/:id", async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.partial().parse(req.body);
      const opportunity = await storage.updateOpportunity(
        req.params.id,
        validatedData,
      );
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "Account not found") {
          return res.status(400).json({ message: "Account not found" });
        }
        if (error.message === "Owner not found") {
          return res.status(400).json({ message: "Owner not found" });
        }
      }
      res.status(500).json({ message: "Failed to update opportunity" });
    }
  });

  app.delete("/api/opportunities/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteOpportunity(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete opportunity" });
    }
  });
}
