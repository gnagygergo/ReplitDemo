import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../replitAuth";
import { insertQuoteSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerQuoteRoutes(app: Express, storage: IStorage) {
  // Quote routes (Company-scoped)
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const sortBy = req.query.sortBy as string | undefined; // Added for sorting capability on Tables
      const sortOrder = req.query.sortOrder as string | undefined; // Added for sorting capability on Tables
      const quotes = await storage.getQuotes(companyContext || undefined, sortBy, sortOrder); // Added sortBy, sortOrder for sorting capability on Tables
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const quote = await storage.getQuote(req.params.id, companyContext || undefined);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(400).json({ message: "Company context required" });
      }

      console.log("DEBUG POST /api/quotes - Full request body:", JSON.stringify(req.body, null, 2));
      
      // Security: Ensure companyId is set from authenticated user's company context
      const quoteData = {
        ...req.body,
        companyId: companyContext, // Override any companyId from request body
      };
      
      console.log("DEBUG - customerId from body:", req.body.customerId, "type:", typeof req.body.customerId);
      
      // Convert empty strings to null for optional foreign key fields
      if (!quoteData.customerId || quoteData.customerId.trim() === '') {
        console.log("DEBUG - Converting empty customerId to null");
        quoteData.customerId = null;
      } else {
        console.log("DEBUG - Keeping customerId:", quoteData.customerId);
      }
      if (!quoteData.quoteExpirationDate || quoteData.quoteExpirationDate === '') {
        quoteData.quoteExpirationDate = null;
      }

      const validatedData = insertQuoteSchema.parse(quoteData);
      const quote = await storage.createQuote(validatedData);
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
      
      // Security: Prevent companyId changes on updates
      const { companyId, ...allowedUpdates } = req.body;
      
      // Convert empty strings to null for optional foreign key fields
      const updateData = {
        ...allowedUpdates,
        ...(allowedUpdates.customerId !== undefined && {
          customerId: allowedUpdates.customerId?.trim() || null,
        }),
        ...(allowedUpdates.quoteExpirationDate !== undefined && {
          quoteExpirationDate: allowedUpdates.quoteExpirationDate || null,
        }),
      };
      
      const validatedData = insertQuoteSchema.partial().parse(updateData);
      const quote = await storage.updateQuote(
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
      const deleted = await storage.deleteQuote(req.params.id, companyContext || undefined);
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
