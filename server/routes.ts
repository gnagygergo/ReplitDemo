import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertOpportunitySchema, insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail } from "./email";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - Required for Replit Auth
  await setupAuth(app);

  // Auth routes - Required for Replit Auth
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected routes - Apply authentication to all CRM endpoints
  app.use(["/api/accounts", "/api/opportunities", "/api/cases", "/api/send-email", "/api/users"], isAuthenticated);

  // Account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
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

  app.post("/api/accounts", async (req, res) => {
    try {
      const validatedData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Owner not found") {
        return res.status(400).json({ message: "Owner not found" });
      }
      res.status(500).json({ message: "Failed to create account" });
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
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
        return res.status(400).json({ message: "Cannot delete account with active opportunities or cases" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Opportunity routes
  app.get("/api/opportunities", async (req, res) => {
    try {
      const opportunities = await storage.getOpportunities();
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
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
      const opportunity = await storage.updateOpportunity(req.params.id, validatedData);
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
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

  // Case routes
  app.get("/api/cases", async (req, res) => {
    try {
      const cases = await storage.getCases();
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
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
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
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

  // Email sending route
  const emailSchema = z.object({
    to: z.string().email("Invalid recipient email"),
    from: z.string().email("Invalid sender email"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required")
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const validatedData = emailSchema.parse(req.body);
      const result = await sendEmail({
        to: validatedData.to,
        from: validatedData.from,
        subject: validatedData.subject,
        text: validatedData.body,
        html: validatedData.body.replace(/\n/g, '<br>')
      });
      
      if (result.success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res.status(400).json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userUpdateSchema = z.object({
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        profileImageUrl: z.string().optional()
      });
      
      const validatedData = userUpdateSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete user who owns accounts, opportunities, or cases" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
