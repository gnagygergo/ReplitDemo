//Quote Routes - don't contain specific fields. This is a generic codebase, meeting standardization requirements.
import type { Express } from "express";
import { z } from "zod";
import { insertQuoteSchema } from "@shared/schema";
import { QuoteStorage } from "./quote-storage";
import type { IStorage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerQuoteRoutes(app: Express, storage: IStorage) {
  const quoteStorage = new QuoteStorage();
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const quotes = await quoteStorage.getQuotes(companyContext || undefined);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);

      const quote = await quoteStorage.getQuote(
        req.params.id,
        companyContext || undefined,
      );
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
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

      const quoteData = {
        ...validatedData,
        companyId: user.companyContext,
      };
      const quote = await quoteStorage.createQuote(quoteData);
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quote:", error);
      res.status(500).json({ message: "Failed to create quote" });
    }
  });

  app.patch("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const validatedData = insertQuoteSchema.partial().parse(req.body);
      const quote = await quoteStorage.updateQuote(
        req.params.id,
        validatedData,
        companyContext || undefined,
      );
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await quoteStorage.deleteQuote(
        req.params.id,
        companyContext || undefined,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });
}
