import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../replitAuth";
import { insertQuoteLineSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerQuoteLineRoutes(app: Express, storage: IStorage) {
  // Quote Line routes
  app.get("/api/quote-lines/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const quoteLine = await storage.getQuoteLine(req.params.id, companyContext || undefined);
      if (!quoteLine) {
        return res.status(404).json({ message: "Quote line not found" });
      }
      res.json(quoteLine);
    } catch (error) {
      console.error("Error fetching quote line:", error);
      res.status(500).json({ message: "Failed to fetch quote line" });
    }
  });

  app.get(
    "/api/quotes/:quoteId/quote-lines",
    isAuthenticated,
    async (req, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        const quoteLines = await storage.getQuoteLinesByQuote(
          req.params.quoteId,
          companyContext || undefined,
        );
        res.json(quoteLines);
      } catch (error) {
        console.error("Error fetching quote lines:", error);
        res.status(500).json({ message: "Failed to fetch quote lines" });
      }
    },
  );

  app.post("/api/quote-lines", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      
      // Convert empty strings to null for optional foreign key fields
      const quoteLineData = {
        ...req.body,
        productId: req.body.productId?.trim() || null,
      };

      const validatedData = insertQuoteLineSchema.parse(quoteLineData);
      const quoteLine = await storage.createQuoteLine(
        validatedData,
        companyContext || undefined,
      );
      
      if (!quoteLine) {
        return res.status(404).json({ message: "Quote not found or does not belong to your company" });
      }
      
      res.status(201).json(quoteLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating quote line:", error);
      res.status(500).json({ message: "Failed to create quote line" });
    }
  });

  app.patch("/api/quote-lines/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      
      // Convert empty strings to null for optional foreign key fields
      const updateData = {
        ...req.body,
        ...(req.body.productId !== undefined && {
          productId: req.body.productId?.trim() || null,
        }),
      };
      
      // Prevent changing quoteId
      delete updateData.quoteId;

      const validatedData = insertQuoteLineSchema.partial().parse(updateData);
      const quoteLine = await storage.updateQuoteLine(
        req.params.id,
        validatedData,
        companyContext || undefined,
      );

      if (!quoteLine) {
        return res.status(404).json({ message: "Quote line not found or does not belong to your company" });
      }

      res.json(quoteLine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating quote line:", error);
      res.status(500).json({ message: "Failed to update quote line" });
    }
  });

  app.delete("/api/quote-lines/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await storage.deleteQuoteLine(
        req.params.id,
        companyContext || undefined,
      );
      
      if (!deleted) {
        return res.status(404).json({ message: "Quote line not found or does not belong to your company" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quote line:", error);
      res.status(500).json({ message: "Failed to delete quote line" });
    }
  });

  // Batch operations
  app.post(
    "/api/quotes/:quoteId/quote-lines/batch",
    isAuthenticated,
    async (req, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        const quoteId = req.params.quoteId;
        const lines = req.body.lines;

        if (!Array.isArray(lines)) {
          return res
            .status(400)
            .json({ message: "Request body must contain 'lines' array" });
        }

        // Process and validate each line
        const processedLines = [];
        for (const line of lines) {
          const lineData = {
            ...line,
            quoteId, // Force quoteId from URL path
            productId: line.productId?.trim() || null,
          };

          // Validate each line
          try {
            if (line.id) {
              // For updates, validate as partial
              const validated = insertQuoteLineSchema.partial().parse(lineData);
              processedLines.push({ id: line.id, ...validated });
            } else {
              // For creates, validate complete schema
              const validated = insertQuoteLineSchema.parse(lineData);
              processedLines.push(validated);
            }
          } catch (error) {
            if (error instanceof z.ZodError) {
              return res.status(400).json({
                message: `Invalid data in line: ${JSON.stringify(line)}`,
                errors: error.errors,
              });
            }
            throw error;
          }
        }

        const quoteLines = await storage.batchCreateOrUpdateQuoteLines(
          quoteId,
          processedLines,
          companyContext || undefined,
        );
        
        if (quoteLines.length === 0 && processedLines.length > 0) {
          return res.status(404).json({ message: "Quote not found or does not belong to your company" });
        }
        
        res.status(200).json(quoteLines);
      } catch (error) {
        console.error("Error batch creating/updating quote lines:", error);
        res
          .status(500)
          .json({ message: "Failed to batch create/update quote lines" });
      }
    },
  );

  app.delete(
    "/api/quotes/:quoteId/quote-lines/batch",
    isAuthenticated,
    async (req, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        const ids = req.body.ids;

        if (!Array.isArray(ids)) {
          return res
            .status(400)
            .json({ message: "Request body must contain 'ids' array" });
        }

        const deletedCount = await storage.batchDeleteQuoteLines(
          ids,
          companyContext || undefined,
        );
        
        if (deletedCount === 0 && ids.length > 0) {
          return res.status(404).json({
            message: "Quote lines not found or do not belong to your company",
          });
        }
        
        res.status(200).json({ deletedCount });
      } catch (error) {
        console.error("Error batch deleting quote lines:", error);
        res
          .status(500)
          .json({ message: "Failed to batch delete quote lines" });
      }
    },
  );
}
