import type { Express } from "express";
import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import type { IStorage } from "../storage";

export function registerAccountRoutes(app: Express, storage: IStorage) {
  // Account routes getter - user's company context queried and handed over to method
  app.get("/api/accounts", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req); 
      const accounts = await storage.getAccounts(companyContext || undefined);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
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
}
