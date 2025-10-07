import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerQuoteRoutes } from "./business-objects-routes/quote-routes";
import { registerQuoteLineRoutes } from "./business-objects-routes/quote-line-routes";
import { registerAccountRoutes } from "./business-objects-routes/accounts-routes";
import { registerOpportunityRoutes } from "./business-objects-routes/opportunity-routes";
import { registerCaseRoutes } from "./business-objects-routes/case-routes";
import { registerProductRoutes } from "./business-objects-routes/product-routes";
import {
  insertCompanySchema,
  insertCompanyRoleSchema,
  insertUserRoleAssignmentSchema,
  insertReleaseSchema,
  insertUnitOfMeasureSchema,
  insertLanguageSchema,
  insertTranslationSchema,
  insertDevPatternSchema,
} from "@shared/schema";
import { z } from "zod";
import { sendEmail } from "./email";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication - Required for Replit Auth
  await setupAuth(app);

  // Registration endpoint - Public (no authentication required)
  app.post("/api/auth/register", async (req: any, res) => {
    try {
      const registrationSchema = z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        companyOfficialName: z.string().min(1, "Company full name is required"),
        companyAlias: z.string().optional(),
        companyRegistrationId: z.string().min(1, "Company registration number is required"),
      });

      const validatedData = registrationSchema.parse(req.body);

      // Check if company with this registration ID already exists
      const existingCompany = await storage.getCompanyByRegistrationId(validatedData.companyRegistrationId);
      if (existingCompany) {
        return res.status(400).json({ 
          message: "A company with this registration number already exists" 
        });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ 
          message: "A user with this email already exists" 
        });
      }

      // Create company first
      const company = await storage.createCompany({
        companyOfficialName: validatedData.companyOfficialName,
        companyAlias: validatedData.companyAlias || null,
        companyRegistrationId: validatedData.companyRegistrationId,
      });

      // Create user with isAdmin = true and link to company
      const user = await storage.createUser({
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: validatedData.password,
        isAdmin: true, // First user of new company is admin
        companyId: company.id,
      });

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          companyId: user.companyId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data", 
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  // Email/Password login endpoint
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
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
          isDbUser: true, // Flag to distinguish from OIDC users
        };

        // Save session and respond
        req.session.save(async (saveErr: any) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save failed" });
          }

          // Set company context after successful login
          try {
            await storage.setCompanyContext(user.id);
          } catch (contextErr) {
            console.error("Failed to set company context:", contextErr);
            // Continue with login even if context setting fails
          }

          res.json({
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl,
              isAdmin: user.isAdmin,
            },
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth routes - Handle both OIDC and database users
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
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
          updatedAt: user.updatedAt,
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
          updatedAt: user.updatedAt,
        });
      } else {
        res.json(user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get company name for current user, based on its Company Context
  app.get("/api/auth/company-name", isAuthenticated, async (req: any, res) => {
    try {
      const companyName = await storage.GetCompanyNameBasedOnContext(req);
      if (companyName) {
        res.json({ companyName });
      } else {
        res.status(404).json({ message: "Company not found" });
      }
    } catch (error) {
      console.error("Error fetching company name:", error);
      res.status(500).json({ message: "Failed to fetch company name" });
    }
  });

  // Global admin verification endpoint
  app.get(
    "/api/auth/verify-global-admin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        res.json({ isGlobalAdmin });
      } catch (error) {
        console.error("Error verifying global admin status:", error);
        res.status(500).json({ message: "Failed to verify admin status" });
      }
    },
  );

  // Combined admin status verification endpoint
  app.get(
    "/api/auth/verify-admin-status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const [isGlobalAdmin, isCompanyAdmin] = await Promise.all([
          storage.verifyGlobalAdmin(req),
          storage.verifyCompanyAdmin(req),
        ]);
        res.json({
          isGlobalAdmin,
          isCompanyAdmin,
          hasAdminAccess: isGlobalAdmin || isCompanyAdmin,
        });
      } catch (error) {
        console.error("Error verifying admin status:", error);
        res.status(500).json({ message: "Failed to verify admin status" });
      }
    },
  );

  // Protected routes - Apply authentication to all CRM endpoints
  app.use(
    [
      "/api/companies",
      "/api/accounts",
      "/api/opportunities",
      "/api/cases",
      "/api/send-email",
      "/api/users",
      "/api/company-roles",
      "/api/user-role-assignments",
      "/api/releases",
      "/api/unit-of-measures",
    ],
    isAuthenticated,
  );

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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
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

  app.get("/api/companies/:companyId/users", async (req, res) => {
    try {
      const users = await storage.getUsersByCompany(req, req.params.companyId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users for company" });
    }
  });




  // Email sending route
  const emailSchema = z.object({
    to: z.string().email("Invalid recipient email"),
    from: z.string().email("Invalid sender email"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
  });

  app.post("/api/send-email", async (req, res) => {
    try {
      const validatedData = emailSchema.parse(req.body);
      const result = await sendEmail({
        to: validatedData.to,
        from: validatedData.from,
        subject: validatedData.subject,
        text: validatedData.body,
        html: validatedData.body.replace(/\n/g, "<br>"),
      });

      if (result.success) {
        res.json({ message: "Email sent successfully" });
      } else {
        res
          .status(400)
          .json({ message: result.error || "Failed to send email" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const users = await storage.getUsers(companyContext || undefined);
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
        profileImageUrl: z
          .string()
          .url("Please enter a valid URL")
          .optional()
          .or(z.literal("")),
        password: z.string().min(6, "Password must be at least 6 characters"),
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
        return res
          .status(400)
          .json({ message: "Unable to identify current user" });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || !currentUser.companyId) {
        return res.status(400).json({
          message:
            "Your account is not associated with a company; cannot create users",
        });
      }

      // Add current user's company_id to the new user data
      // Security: isAdmin defaults to false and cannot be set by regular users
      const userDataWithCompany = {
        ...validatedData,
        companyId: currentUser.companyId,
        isAdmin: false, // Security: Force to false, only admin endpoints should set this
      };

      const user = await storage.createUser(userDataWithCompany);

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
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
        preferredLanguage: z.string().optional(),
        profileImageUrl: z.string().optional(),
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(400).json({
          message:
            "Cannot delete user who owns accounts, opportunities, or cases",
        });
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (
        error instanceof Error &&
        error.message === "Parent company role not found"
      ) {
        return res
          .status(400)
          .json({ message: "Parent company role not found" });
      }
      console.error("Error creating company role:", error);
      res.status(500).json({ message: "Failed to create company role" });
    }
  });

  app.patch("/api/company-roles/:id", async (req, res) => {
    try {
      const validatedData = insertCompanyRoleSchema.partial().parse(req.body);
      const companyRole = await storage.updateCompanyRole(
        req.params.id,
        validatedData,
      );
      if (!companyRole) {
        return res.status(404).json({ message: "Company role not found" });
      }
      res.json(companyRole);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "Parent company role not found") {
          return res
            .status(400)
            .json({ message: "Parent company role not found" });
        }
        if (
          error.message ===
          "Cannot create circular reference in company role hierarchy"
        ) {
          return res.status(400).json({
            message:
              "Cannot create circular reference in company role hierarchy",
          });
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
        return res.status(400).json({
          message:
            "Cannot delete company role with child roles or user assignments",
        });
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
      res
        .status(500)
        .json({ message: "Failed to fetch user role assignments" });
    }
  });

  app.get("/api/user-role-assignments/by-role/:roleId", async (req, res) => {
    try {
      const assignments = await storage.getUserRoleAssignmentsByRole(
        req.params.roleId,
      );
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user role assignments by role:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch user role assignments" });
    }
  });

  app.get("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getUserRoleAssignment(req.params.id);
      if (!assignment) {
        return res
          .status(404)
          .json({ message: "User role assignment not found" });
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
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return res.status(400).json({ message: "User not found" });
        }
        if (error.message === "Company role not found") {
          return res.status(400).json({ message: "Company role not found" });
        }
        if (error.message === "User is already assigned to this role") {
          return res
            .status(400)
            .json({ message: "User is already assigned to this role" });
        }
      }
      console.error("Error creating user role assignment:", error);
      res
        .status(500)
        .json({ message: "Failed to create user role assignment" });
    }
  });

  app.patch("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const validatedData = insertUserRoleAssignmentSchema
        .partial()
        .parse(req.body);
      const assignment = await storage.updateUserRoleAssignment(
        req.params.id,
        validatedData,
      );
      if (!assignment) {
        return res
          .status(404)
          .json({ message: "User role assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
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
      res
        .status(500)
        .json({ message: "Failed to update user role assignment" });
    }
  });

  app.delete("/api/user-role-assignments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUserRoleAssignment(req.params.id);
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "User role assignment not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user role assignment:", error);
      res
        .status(500)
        .json({ message: "Failed to delete user role assignment" });
    }
  });

  // Release routes respecting company context
  app.get("/api/releases", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const releases = await storage.getReleases(companyContext || undefined);
      res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get("/api/releases/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const release = await storage.getRelease(
        req.params.id,
        companyContext || undefined,
      );
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      console.error("Error fetching release:", error);
      res.status(500).json({ message: "Failed to fetch release" });
    }
  });

  app.post("/api/releases", async (req: any, res) => {
    try {
      const validatedData = insertReleaseSchema.parse(req.body);

      // Get current user's company context to assign to new release
      const sessionUser = (req.session as any).user;
      let currentUserId;

      if (sessionUser && sessionUser.isDbUser) {
        currentUserId = sessionUser.id;
      } else {
        currentUserId = req.user?.claims?.sub;
      }

      if (!currentUserId) {
        return res
          .status(400)
          .json({ message: "Unable to identify current user" });
      }

      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || !currentUser.companyId) {
        return res.status(400).json({
          message:
            "Your account is not associated with a company; cannot create releases",
        });
      }

      // Add current user's company_id to the release data
      const releaseDataWithCompany = {
        ...validatedData,
        companyId: currentUser.companyId,
      };

      const release = await storage.createRelease(releaseDataWithCompany);
      res.status(201).json(release);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating release:", error);
      res.status(500).json({ message: "Failed to create release" });
    }
  });

  app.patch("/api/releases/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const validatedData = insertReleaseSchema.partial().parse(req.body);
      const release = await storage.updateRelease(
        req.params.id,
        validatedData,
        companyContext || undefined,
      );
      if (!release) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.json(release);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating release:", error);
      res.status(500).json({ message: "Failed to update release" });
    }
  });

  app.delete("/api/releases/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await storage.deleteRelease(
        req.params.id,
        companyContext || undefined,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Release not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting release:", error);
      res.status(500).json({ message: "Failed to delete release" });
    }
  });

  // Unit of Measures routes respecting company context
  app.get("/api/unit-of-measures", async (req, res) => {
    try {
      const unitOfMeasures = await storage.getUnitOfMeasures();
      res.json(unitOfMeasures);
    } catch (error) {
      console.error("Error fetching unit of measures:", error);
      res.status(500).json({ message: "Failed to fetch unit of measures" });
    }
  });

  app.get("/api/unit-of-measures/:id", async (req, res) => {
    try {
      const unitOfMeasure = await storage.getUnitOfMeasure(req.params.id);
      if (!unitOfMeasure) {
        return res.status(404).json({ message: "Unit of measure not found" });
      }
      res.json(unitOfMeasure);
    } catch (error) {
      console.error("Error fetching unit of measure:", error);
      res.status(500).json({ message: "Failed to fetch unit of measure" });
    }
  });

  app.post("/api/unit-of-measures", async (req: any, res) => {
    try {
      const validatedData = insertUnitOfMeasureSchema.parse(req.body);

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

      const unitOfMeasure = await storage.createUnitOfMeasure(validatedData);
      res.status(201).json(unitOfMeasure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating unit of measure:", error);
      res.status(500).json({ message: "Failed to create unit of measure" });
    }
  });

  app.patch("/api/unit-of-measures/:id", async (req, res) => {
    try {
      const validatedData = insertUnitOfMeasureSchema.partial().parse(req.body);
      const unitOfMeasure = await storage.updateUnitOfMeasure(
        req.params.id,
        validatedData,
      );
      if (!unitOfMeasure) {
        return res.status(404).json({ message: "Unit of measure not found" });
      }
      res.json(unitOfMeasure);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating unit of measure:", error);
      res.status(500).json({ message: "Failed to update unit of measure" });
    }
  });

  app.delete("/api/unit-of-measures/:id", async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await storage.deleteUnitOfMeasure(
        req.params.id,
        companyContext || undefined,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Unit of measure not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting unit of measure:", error);
      res.status(500).json({ message: "Failed to delete unit of measure" });
    }
  });


  // Language routes (Global - no company context, read: all users, write: global admins only)
  app.get("/api/languages", isAuthenticated, async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get("/api/languages/:id", isAuthenticated, async (req, res) => {
    try {
      const language = await storage.getLanguage(req.params.id);
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      console.error("Error fetching language:", error);
      res.status(500).json({ message: "Failed to fetch language" });
    }
  });

  app.post("/api/languages", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create languages" });
      }

      const validatedData = insertLanguageSchema.parse(req.body);
      const language = await storage.createLanguage(validatedData);
      res.status(201).json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating language:", error);
      res.status(500).json({ message: "Failed to create language" });
    }
  });

  app.patch("/api/languages/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update languages" });
      }

      const validatedData = insertLanguageSchema.partial().parse(req.body);
      const language = await storage.updateLanguage(req.params.id, validatedData);
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating language:", error);
      res.status(500).json({ message: "Failed to update language" });
    }
  });

  app.delete("/api/languages/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete languages" });
      }

      const deleted = await storage.deleteLanguage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting language:", error);
      res.status(500).json({ message: "Failed to delete language" });
    }
  });

  // Translation routes (Global - no company context, read: all users, write: global admins only)
  app.get("/api/translations", isAuthenticated, async (req, res) => {
    try {
      const translations = await storage.getTranslations();
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  app.get("/api/translations/:id", isAuthenticated, async (req, res) => {
    try {
      const translation = await storage.getTranslation(req.params.id);
      if (!translation) {
        return res.status(404).json({ message: "Translation not found" });
      }
      res.json(translation);
    } catch (error) {
      console.error("Error fetching translation:", error);
      res.status(500).json({ message: "Failed to fetch translation" });
    }
  });

  app.post("/api/translations", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create translations" });
      }

      const validatedData = insertTranslationSchema.parse(req.body);
      const translation = await storage.createTranslation(validatedData);
      res.status(201).json(translation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating translation:", error);
      res.status(500).json({ message: "Failed to create translation" });
    }
  });

  app.patch("/api/translations/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update translations" });
      }

      const validatedData = insertTranslationSchema.partial().parse(req.body);
      const translation = await storage.updateTranslation(req.params.id, validatedData);
      if (!translation) {
        return res.status(404).json({ message: "Translation not found" });
      }
      res.json(translation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating translation:", error);
      res.status(500).json({ message: "Failed to update translation" });
    }
  });

  app.delete("/api/translations/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete translations" });
      }

      const deleted = await storage.deleteTranslation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Translation not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting translation:", error);
      res.status(500).json({ message: "Failed to delete translation" });
    }
  });

  // Dev Pattern routes (Global - no company context, all operations require global admin)
  app.get("/api/dev-patterns", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can view dev patterns" });
      }

      const devPatterns = await storage.getDevPatterns();
      res.json(devPatterns);
    } catch (error) {
      console.error("Error fetching dev patterns:", error);
      res.status(500).json({ message: "Failed to fetch dev patterns" });
    }
  });

  app.get("/api/dev-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can view dev patterns" });
      }

      const devPattern = await storage.getDevPattern(req.params.id);
      if (!devPattern) {
        return res.status(404).json({ message: "Dev pattern not found" });
      }
      res.json(devPattern);
    } catch (error) {
      console.error("Error fetching dev pattern:", error);
      res.status(500).json({ message: "Failed to fetch dev pattern" });
    }
  });

  app.post("/api/dev-patterns", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create dev patterns" });
      }

      const validatedData = insertDevPatternSchema.parse(req.body);
      const devPattern = await storage.createDevPattern(validatedData);
      res.status(201).json(devPattern);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating dev pattern:", error);
      res.status(500).json({ message: "Failed to create dev pattern" });
    }
  });

  app.patch("/api/dev-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update dev patterns" });
      }

      const validatedData = insertDevPatternSchema.partial().parse(req.body);
      const devPattern = await storage.updateDevPattern(req.params.id, validatedData);
      if (!devPattern) {
        return res.status(404).json({ message: "Dev pattern not found" });
      }
      res.json(devPattern);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating dev pattern:", error);
      res.status(500).json({ message: "Failed to update dev pattern" });
    }
  });

  app.delete("/api/dev-patterns/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete dev patterns" });
      }

      const deleted = await storage.deleteDevPattern(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Dev pattern not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting dev pattern:", error);
      res.status(500).json({ message: "Failed to delete dev pattern" });
    }
  });

  // Account routes (Company-scoped) - Delegated to business-objects-routes
  registerAccountRoutes(app, storage);

  // Opportunity routes (Company-scoped) - Delegated to business-objects-routes
  registerOpportunityRoutes(app, storage);

  // Case routes - Delegated to business-objects-routes
  registerCaseRoutes(app, storage);

  // Product routes (Company-scoped) - Delegated to business-objects-routes
  registerProductRoutes(app, storage);

  // Quote routes (Company-scoped) - Delegated to business-objects-routes
  registerQuoteRoutes(app, storage);

  // Quote Line routes - Delegated to business-objects-routes
  registerQuoteLineRoutes(app, storage);

  const httpServer = createServer(app);
  return httpServer;
}
