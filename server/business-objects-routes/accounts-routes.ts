import type { Express } from "express";
import { z } from "zod";
import { insertAccountSchema } from "@shared/schema";
import type { IStorage } from "../storage";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

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

  // Search accounts with filters
  app.get("/api/accounts/search", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const filters = {
        isLegalEntity: req.query.isLegalEntity === "true",
        isPersonAccount: req.query.isPersonAccount === "true",
        isSelfEmployed: req.query.isSelfEmployed === "true",
      };
      
      const accounts = await storage.searchAccounts(companyContext || undefined, filters);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to search accounts" });
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

  // Find company data (registration ID and address) using Tavily web search + OpenAI
  app.post("/api/accounts/:id/find-registration-id", async (req, res) => {
    try {
      // Get the account
      const account = await storage.getAccount(req.params.id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      // Get the user's company to access AI settings
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(400).json({ message: "Company context not found" });
      }

      const company = await storage.getCompany(companyContext);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Check if Tavily is configured
      if (!company.tavilyApiKey) {
        return res.status(400).json({ 
          message: "Tavily API is not configured. Please add your Tavily API key in AI Services settings." 
        });
      }

      // Check if OpenAI is configured
      if (!company.openaiApiKey) {
        return res.status(400).json({ 
          message: "OpenAI is not configured. Please configure it in AI Services settings." 
        });
      }

      // Build search query for Tavily - broader search to find both registration and address
      const companyInfo = [
        `Company: ${account.name}`,
        account.companyOfficialName ? `Official Name: ${account.companyOfficialName}` : null,
        account.address ? `Current Address: ${account.address}` : null,
      ].filter(Boolean).join(", ");

      const searchQuery = `${account.name} company registration number address contact information`;

      // Use Tavily to search the web
      const tvly = tavily({ apiKey: company.tavilyApiKey });
      const searchResults = await tvly.search(searchQuery, {
        maxResults: 5,
        searchDepth: "advanced",
      });

      // If no results found
      if (!searchResults.results || searchResults.results.length === 0) {
        return res.json({ 
          registrationId: "Not found",
          address: "Not found",
          accountId: account.id,
          accountName: account.name
        });
      }

      // Use OpenAI to extract both registration ID and address from search results
      const openai = new OpenAI({
        apiKey: company.openaiApiKey,
        organization: company.openaiOrganizationId || undefined,
      });

      // Prepare context from search results
      const searchContext = searchResults.results
        .map((result: any, idx: number) => 
          `[Result ${idx + 1}]\nTitle: ${result.title}\nContent: ${result.content}\n`
        )
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: company.openaiPreferredModel || "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that extracts company information from web search results. Extract two pieces of information:
1. Company registration number/ID (look for official registration numbers, company IDs, business numbers, VAT numbers, or tax IDs)
2. Company address (the official business address)

Return your response in this exact JSON format:
{
  "registrationId": "the registration number or 'Not found'",
  "address": "the full address or 'Not found'"
}

Be concise and only include information that is clearly stated in the search results.`
          },
          {
            role: "user",
            content: `Company Information: ${companyInfo}\n\nWeb Search Results:\n${searchContext}\n\nExtract the official company registration number/ID and business address for ${account.name}. Return the data in JSON format as specified.`
          }
        ],
        max_tokens: 300,
        temperature: 0.2,
      });

      const resultText = completion.choices[0]?.message?.content || "{}";
      
      // Parse the JSON response from OpenAI
      // Strip markdown code blocks if present (```json ... ```)
      let extractedData = { registrationId: "Not found", address: "Not found" };
      try {
        let cleanedText = resultText.trim();
        // Remove markdown code block syntax
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }
        
        const parsed = JSON.parse(cleanedText);
        extractedData = {
          registrationId: parsed.registrationId || "Not found",
          address: parsed.address || "Not found"
        };
      } catch (parseError) {
        console.error("Failed to parse OpenAI response as JSON:", resultText);
      }

      res.json({ 
        registrationId: extractedData.registrationId,
        address: extractedData.address,
        accountId: account.id,
        accountName: account.name
      });
    } catch (error) {
      console.error("Error finding company data:", error);
      if (error instanceof Error) {
        return res.status(500).json({ 
          message: "Failed to search for company data", 
          error: error.message 
        });
      }
      res.status(500).json({ message: "Failed to search for company data" });
    }
  });
}
