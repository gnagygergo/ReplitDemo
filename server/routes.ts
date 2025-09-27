import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCompanySchema, insertAccountSchema, insertOpportunitySchema, insertCaseSchema, insertCompanyRoleSchema, insertUserRoleAssignmentSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail } from "./email";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - Required for Replit Auth
  await setupAuth(app);

  // Email/Password login endpoint
  app.post('/api/auth/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.verifyUserPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Regenerate session ID for security BEFORE setting user data
      req.session.regenerate((err: any) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        
        // Set session data after regeneration
        req.session.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
          isDbUser: true // Flag to distinguish from OIDC users
        };
        
        // Save session and respond
        req.session.save((saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }
          
          res.json({ 
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              isAdmin: user.isAdmin
            }
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth routes - Handle both OIDC and database users
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const sessionUser = (req.session as any).user;
      
      // Handle database user (email/password login)
      if (sessionUser && sessionUser.isDbUser) {
        const user = await storage.getUser(sessionUser.id);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        // Return only safe fields, exclude password hash
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        return;
      }
      
      // Handle OIDC user (original Replit Auth)
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        // Return only safe fields, exclude password hash
        res.json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected routes - Apply authentication to all CRM endpoints
  app.use(["/api/companies", "/api/accounts", "/api/opportunities", "/api/cases", "/api/send-email", "/api/users", "/api/company-roles", "/api/user-role-assignments"], isAuthenticated);

  // Set user's company_id as session variable for Row Level Security
  app.use(["/api/accounts", "/api/opportunities", "/api/cases"], async (req: any, res, next) => {
    try {
      const sessionUser = (req.session as any).user;
      let userId;
      
      // Get user ID from session (database user) or claims (OIDC user)
      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }
      
      if (userId) {
        const user = await storage.getUser(userId);
        if (user && user.companyId) {
          // Set the user's company_id as a session variable for RLS
          await storage.setCompanyContext(user.companyId);
        }
      }
      
      next();
    } catch (error) {
      console.error("Error setting company context:", error);
      // Continue even if setting context fails - don't block the request
      next();
    }
  });

  // Company routes
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Owner not found") {
        return res.status(400).json({ message: "Owner not found" });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, validatedData);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Owner not found") {
        return res.status(400).json({ message: "Owner not found" });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCompany(req.params.id);
      if (!deleted) {
        return res.status(400).json({ message: "Failed to delete company" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

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

  app.post("/api/users", async (req: any, res) => {
    try {
      // Security: Remove isAdmin from client schema - only admins can set this
      const userCreateSchema = z.object({
        email: z.string().email("Please enter a valid email address"),
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        profileImageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
        password: z.string().min(6, "Password must be at least 6 characters")
      });
      
      const validatedData = userCreateSchema.parse(req.body);
      
      // Get current logged-in user's company_id to assign to new user
      const sessionUser = (req.session as any).user;
      let currentUserId;
      
      // Get user ID from session (database user) or claims (OIDC user)
      if (sessionUser && sessionUser.isDbUser) {
        currentUserId = sessionUser.id;
      } else {
        currentUserId = req.user?.claims?.sub;
      }
      
      if (!currentUserId) {
        return res.status(400).json({ message: "Unable to identify current user" });
      }
      
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || !currentUser.companyId) {
        return res.status(400).json({ 
          message: "Your account is not associated with a company; cannot create users" 
        });
      }
      
      // Add current user's company_id to the new user data
      // Security: isAdmin defaults to false and cannot be set by regular users
      const userDataWithCompany = {
        ...validatedData,
        companyId: currentUser.companyId,
        isAdmin: false // Security: Force to false, only admin endpoints should set this
      };
      
      const user = await storage.createUser(userDataWithCompany);
      
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      // Security: Remove isAdmin from update schema - privilege escalation protection
      const userUpdateSchema = z.object({
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        profileImageUrl: z.string().optional()
        // isAdmin removed - only admin endpoints should change this
      });
      
      const validatedData = userUpdateSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Security: Remove sensitive fields from response
      const { password, ...safeUser } = user as any;
      res.json(safeUser);
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
