import type { Express } from "express";
import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerAccountRoutes(app: Express, storage: IStorage) {
  // Account routes getter - user's company context queried and handed over to method
  app.get("/api/accounts", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const sortBy = req.query.sortBy as string | undefined; // Added for sorting capability on Tables
      const sortOrder = req.query.sortOrder as string | undefined; // Added for sorting capability on Tables
      const accounts = await storage.getAccounts(companyContext || undefined, sortBy, sortOrder); // Added sortBy, sortOrder for sorting capability on Tables
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      console.log("[DEBUG] POST /api/accounts received data:", {
        name: req.body.name,
        parentAccountId: req.body.parentAccountId,
        ownerId: req.body.ownerId,
        isShippingAddress: req.body.isShippingAddress,
        isCompanyContact: req.body.isCompanyContact,
      });
      const validatedData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Owner not found") {
        return res.status(400).json({ message: "Owner not found" });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch account" });
    }
  });

  app.patch("/api/accounts/:id", async (req, res) => {
    try {
      const validatedData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(req.params.id, validatedData);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Owner not found") {
        return res.status(400).json({ message: "Owner not found" });
      }
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAccount(req.params.id);
      if (!deleted) {
        return res.status(400).json({
          message: "Cannot delete account with active opportunities or cases",
        });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get("/api/accounts/:accountId/opportunities", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const opportunities = await storage.getOpportunitiesByAccount(
        req.params.accountId,
        companyContext || undefined,
      );
      res.json(opportunities);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch opportunities for account" });
    }
  });

  app.get("/api/accounts/:accountId/quotes", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const quotes = await storage.getQuotesByCustomer(
        req.params.accountId,
        companyContext || undefined,
      );
      res.json(quotes);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch quotes for account" });
    }
  });

  app.get("/api/accounts/:accountId/children", async (req, res) => {
    try {
      const accountType = req.query.type as string | undefined;
      const childAccounts = await storage.getChildAccounts(
        req.params.accountId,
        accountType,
      );
      res.json(childAccounts);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch child accounts" });
    }
  });

  app.get("/api/accounts/:accountId/parents", async (req, res) => {
    try {
      const parentAccounts = await storage.getParentAccounts(req.params.accountId);
      res.json(parentAccounts);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch parent accounts" });
    }
  });
}
