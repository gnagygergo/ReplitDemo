import type { Express } from "express";
import { z } from "zod";
import { insertCaseSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerCaseRoutes(app: Express, storage: IStorage) {
  // Case routes
  app.get("/api/cases", async (req, res) => {
    try {
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as string | undefined;
      const cases = await storage.getCases(sortBy, sortOrder);
      res.json(cases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const caseRecord = await storage.getCase(req.params.id);
      if (!caseRecord) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(caseRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const validatedData = insertCaseSchema.parse(req.body);
      const caseRecord = await storage.createCase(validatedData);
      res.status(201).json(caseRecord);
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
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  app.patch("/api/cases/:id", async (req, res) => {
    try {
      const validatedData = insertCaseSchema.partial().parse(req.body);
      const caseRecord = await storage.updateCase(req.params.id, validatedData);
      if (!caseRecord) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(caseRecord);
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
      res.status(500).json({ message: "Failed to update case" });
    }
  });

  app.delete("/api/cases/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCase(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete case" });
    }
  });
}
