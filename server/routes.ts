import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertOpportunitySchema, insertCaseSchema, insertCompanyRoleSchema, insertUserRoleAssignmentSchema } from "@shared/schema";
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
  app.use(["/api/accounts", "/api/opportunities", "/api/cases", "/api/send-email", "/api/users", "/api/company-roles", "/api/user-role-assignments"], isAuthenticated);

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

  // Company Role routes
  app.get("/api/company-roles", async (req, res) => {
    try {
      const companyRoles = await storage.getCompanyRoles();
      res.json(companyRoles);
    } catch (error) {
      console.error("Error fetching company roles:", error);
      res.status(500).json({ message: "Failed to fetch company roles" });
    }
  });

  app.get("/api/company-roles/:id", async (req, res) => {
    try {
      const companyRole = await storage.getCompanyRole(req.params.id);
      if (!companyRole) {
        return res.status(404).json({ message: "Company role not found" });
      }
      res.json(companyRole);
    } catch (error) {
      console.error("Error fetching company role:", error);
      res.status(500).json({ message: "Failed to fetch company role" });
    }
  });

  app.post("/api/company-roles", async (req, res) => {
    try {
      const validatedData = insertCompanyRoleSchema.parse(req.body);
      const companyRole = await storage.createCompanyRole(validatedData);
      res.status(201).json(companyRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Parent company role not found") {
        return res.status(400).json({ message: "Parent company role not found" });
      }
      console.error("Error creating company role:", error);
      res.status(500).json({ message: "Failed to create company role" });
    }
  });

  app.patch("/api/company-roles/:id", async (req, res) => {
    try {
      const validatedData = insertCompanyRoleSchema.partial().parse(req.body);
      const companyRole = await storage.updateCompanyRole(req.params.id, validatedData);
      if (!companyRole) {
        return res.status(404).json({ message: "Company role not found" });
      }
      res.json(companyRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "Parent company role not found") {
          return res.status(400).json({ message: "Parent company role not found" });
        }
        if (error.message === "Cannot create circular reference in company role hierarchy") {
          return res.status(400).json({ message: "Cannot create circular reference in company role hierarchy" });
        }
      }
      console.error("Error updating company role:", error);
      res.status(500).json({ message: "Failed to update company role" });
    }
  });

  app.delete("/api/company-roles/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCompanyRole(req.params.id);
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete company role with child roles or user assignments" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting company role:", error);
      res.status(500).json({ message: "Failed to delete company role" });
    }
  });

  // User Role Assignment routes
  app.get("/api/user-role-assignments", async (req, res) => {
    try {
      const assignments = await storage.getUserRoleAssignments();
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user role assignments:", error);
      res.status(500).json({ message: "Failed to fetch user role assignments" });
    }
  });

  app.get("/api/user-role-assignments/by-role/:roleId", async (req, res) => {
    try {
      const assignments = await storage.getUserRoleAssignmentsByRole(req.params.roleId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user role assignments by role:", error);
      res.status(500).json({ message: "Failed to fetch user role assignments" });
    }
  });

  app.get("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getUserRoleAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "User role assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching user role assignment:", error);
      res.status(500).json({ message: "Failed to fetch user role assignment" });
    }
  });

  app.post("/api/user-role-assignments", async (req, res) => {
    try {
      const validatedData = insertUserRoleAssignmentSchema.parse(req.body);
      const assignment = await storage.createUserRoleAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(400).json({ message: "User not found" });
        }
        if (error.message === "Company role not found") {
          return res.status(400).json({ message: "Company role not found" });
        }
        if (error.message === "User is already assigned to this role") {
          return res.status(400).json({ message: "User is already assigned to this role" });
        }
      }
      console.error("Error creating user role assignment:", error);
      res.status(500).json({ message: "Failed to create user role assignment" });
    }
  });

  app.patch("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const validatedData = insertUserRoleAssignmentSchema.partial().parse(req.body);
      const assignment = await storage.updateUserRoleAssignment(req.params.id, validatedData);
      if (!assignment) {
        return res.status(404).json({ message: "User role assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(400).json({ message: "User not found" });
        }
        if (error.message === "Company role not found") {
          return res.status(400).json({ message: "Company role not found" });
        }
      }
      console.error("Error updating user role assignment:", error);
      res.status(500).json({ message: "Failed to update user role assignment" });
    }
  });

  app.delete("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUserRoleAssignment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User role assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user role assignment:", error);
      res.status(500).json({ message: "Failed to delete user role assignment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
