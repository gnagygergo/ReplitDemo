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
  insertKnowledgeArticleSchema,
  insertDevPatternSchema,
  insertLicenceSchema,
  insertLicenceAgreementTemplateSchema,
  insertLicenceAgreementSchema,
  insertEmailSchema,
  insertCompanySettingMasterDomainSchema,
  insertCompanySettingMasterFunctionalitySchema,
  insertCompanySettingsMasterSchema,
} from "@shared/schema";
import { z } from "zod";
import { sendEmail } from "./email";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { pool } from "./db";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

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
        companyRegistrationId: z
          .string()
          .min(1, "Company registration number is required"),
      });

      const validatedData = registrationSchema.parse(req.body);

      // Find active online registration license agreement template first
      const activeTemplate =
        await storage.getActiveOnlineRegistrationTemplate();
      if (!activeTemplate) {
        return res.status(400).json({
          message:
            "The system did not find a valid Licence Agreement Template to which this registration could be linked.",
        });
      }

      // Check if company with this registration ID already exists
      const existingCompany = await storage.getCompanyByRegistrationId(
        validatedData.companyRegistrationId,
      );
      if (existingCompany) {
        return res.status(400).json({
          message: "A company with this registration number already exists",
        });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({
          message: "A user with this email already exists",
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

      // Create automated license agreement for the new company
      await storage.createLicenceAgreementAutomated(
        activeTemplate.id,
        company.id,
      );

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
          errors: error.errors,
        });
      }
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ message: "Registration failed. Please try again." });
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

  // Get my company details based on logged-in user's company context
  app.get("/api/auth/my-company", isAuthenticated, async (req: any, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      const isCompanyAdmin = await storage.verifyCompanyAdmin(req);
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only company admins can view company details" });
      }

      const company = await storage.getCompany(companyContext);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error fetching my company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Update my company details (only alias, bank account, address allowed)
  app.patch("/api/auth/my-company", isAuthenticated, async (req: any, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      const isCompanyAdmin = await storage.verifyCompanyAdmin(req);
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only company admins can update company details" });
      }

      // Only allow updating specific fields
      const allowedUpdates = {
        companyAlias: req.body.companyAlias,
        bankAccountNumber: req.body.bankAccountNumber,
        address: req.body.address,
      };

      const company = await storage.updateCompany(
        companyContext,
        allowedUpdates,
      );
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      console.error("Error updating my company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Get licence agreements for my company
  app.get(
    "/api/auth/my-company-licence-agreements",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        if (!companyContext) {
          return res.status(403).json({ message: "No company context" });
        }

        const isCompanyAdmin = await storage.verifyCompanyAdmin(req);
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isCompanyAdmin && !isGlobalAdmin) {
          return res.status(403).json({
            message: "Only company admins can view licence agreements",
          });
        }

        const agreements =
          await storage.getLicenceAgreementsByCompany(companyContext);

        // Format the response to include template name and licence seats
        const formattedAgreements = agreements.map((agreement) => ({
          id: agreement.id,
          templateName: agreement.licenceAgreementTemplate?.name || "N/A",
          validFrom: agreement.validFrom,
          validTo: agreement.validTo,
          licenceSeats: agreement.licenceSeats || "N/A",
          licenceSeatsRemaining: agreement.licenceSeatsRemaining || "N/A",
          licenceSeatsUsed: agreement.licenceSeatsUsed || "N/A",
        }));

        res.json(formattedAgreements);
      } catch (error) {
        console.error("Error fetching your company licence agreements:", error);
        res.status(500).json({ message: "Failed to fetch licence agreements" });
      }
    },
  );

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

  // Company admin verification endpoint
  app.get(
    "/api/auth/verify-company-admin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const isCompanyAdmin = await storage.verifyCompanyAdmin(req);
        res.json({ isCompanyAdmin });
      } catch (error) {
        console.error("Error verifying company admin status:", error);
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

  // Switch company context endpoint (global admin only)
  app.post(
    "/api/auth/switch-company-context",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res
            .status(403)
            .json({ message: "Only global admins can switch company context" });
        }

        const { companyId } = req.body;
        if (!companyId) {
          return res.status(400).json({ message: "Company ID is required" });
        }

        // Verify the company exists
        const company = await storage.getCompany(companyId);
        if (!company) {
          return res.status(404).json({ message: "Company not found" });
        }

        // Extract user ID from session
        const sessionUser = (req.session as any).user;
        let userId;
        if (sessionUser && sessionUser.isDbUser) {
          userId = sessionUser.id;
        } else {
          userId = req.user?.claims?.sub;
        }

        if (!userId) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        // Switch the company context
        await storage.switchCompanyContext(userId, companyId);

        res.json({ 
          message: "Company context switched successfully",
          companyId,
          companyName: company.companyOfficialName
        });
      } catch (error) {
        console.error("Error switching company context:", error);
        res.status(500).json({ message: "Failed to switch company context" });
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
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can view all companies" });
      }

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
        licenceAgreementId: z.string().optional(),
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

      // Update licence agreement seat counts if licenceAgreementId is provided
      if (validatedData.licenceAgreementId) {
        await storage.actualizeLicenceAgreementSeatsUsed(
          validatedData.licenceAgreementId,
        );
      }

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      res.status(500).json({ message: errorMessage });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      // Security: Remove isAdmin from update schema - privilege escalation protection
      const userUpdateSchema = z.object({
        licenceAgreementId: z.string().optional(),
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        preferredLanguage: z.string().optional(),
        profileImageUrl: z.string().optional(),
        // isAdmin removed - only admin endpoints should change this
      });

      const validatedData = userUpdateSchema.parse(req.body);

      // Get the user's old licence agreement ID before updating
      const oldUser = await storage.getUser(req.params.id);
      const oldLicenceAgreementId = oldUser?.licenceAgreementId;

      const user = await storage.updateUser(req.params.id, validatedData);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update licence agreement seat counts if licenceAgreementId changed
      if (
        validatedData.licenceAgreementId &&
        validatedData.licenceAgreementId !== oldLicenceAgreementId
      ) {
        // Update new licence agreement
        await storage.actualizeLicenceAgreementSeatsUsed(
          validatedData.licenceAgreementId,
        );
        // Update old licence agreement if it exists
        if (oldLicenceAgreementId) {
          await storage.actualizeLicenceAgreementSeatsUsed(
            oldLicenceAgreementId,
          );
        }
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
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      res.status(500).json({ message: errorMessage });
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
        return res
          .status(403)
          .json({ message: "Only global admins can create languages" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can update languages" });
      }

      const validatedData = insertLanguageSchema.partial().parse(req.body);
      const language = await storage.updateLanguage(
        req.params.id,
        validatedData,
      );
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
        return res
          .status(403)
          .json({ message: "Only global admins can delete languages" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can create translations" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can update translations" });
      }

      const validatedData = insertTranslationSchema.partial().parse(req.body);
      const translation = await storage.updateTranslation(
        req.params.id,
        validatedData,
      );
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
        return res
          .status(403)
          .json({ message: "Only global admins can delete translations" });
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

  // Knowledge Article routes (Global - no company context, read: all users, write: global admins only)
  app.get("/api/knowledge-articles", isAuthenticated, async (req, res) => {
    try {
      const articles = await storage.getKnowledgeArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching knowledge articles:", error);
      res.status(500).json({ message: "Failed to fetch knowledge articles" });
    }
  });

  app.get("/api/knowledge-articles/:id", isAuthenticated, async (req, res) => {
    try {
      const article = await storage.getKnowledgeArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Knowledge article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching knowledge article:", error);
      res.status(500).json({ message: "Failed to fetch knowledge article" });
    }
  });

  app.post("/api/knowledge-articles", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can create knowledge articles" });
      }

      const validatedData = insertKnowledgeArticleSchema.parse(req.body);
      
      // Convert empty strings to null for foreign key fields
      if (validatedData.languageCode === "") {
        validatedData.languageCode = null;
      }
      
      const article = await storage.createKnowledgeArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating knowledge article:", error);
      res.status(500).json({ message: "Failed to create knowledge article" });
    }
  });

  app.patch("/api/knowledge-articles/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can update knowledge articles" });
      }

      const validatedData = insertKnowledgeArticleSchema.partial().parse(req.body);
      
      // Convert empty strings to null for foreign key fields
      if (validatedData.languageCode === "") {
        validatedData.languageCode = null;
      }
      
      const article = await storage.updateKnowledgeArticle(
        req.params.id,
        validatedData,
      );
      if (!article) {
        return res.status(404).json({ message: "Knowledge article not found" });
      }
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating knowledge article:", error);
      res.status(500).json({ message: "Failed to update knowledge article" });
    }
  });

  app.delete("/api/knowledge-articles/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can delete knowledge articles" });
      }

      const deleted = await storage.deleteKnowledgeArticle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Knowledge article not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting knowledge article:", error);
      res.status(500).json({ message: "Failed to delete knowledge article" });
    }
  });

  app.get("/api/knowledge-articles/by-code/:code", isAuthenticated, async (req, res) => {
    try {
      // Verify user is company admin or global admin
      const [isCompanyAdmin, isGlobalAdmin] = await Promise.all([
        storage.verifyCompanyAdmin(req),
        storage.verifyGlobalAdmin(req),
      ]);
      
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      const article = await storage.getKnowledgeArticleByCode(req.params.code);
      if (!article) {
        return res.status(404).json({ message: "Knowledge article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching knowledge article by code:", error);
      res.status(500).json({ message: "Failed to fetch knowledge article" });
    }
  });

  // Company Setting Master Domain routes (Global - read: all users, write: global admins only)
  app.get("/api/company-setting-master-domains", isAuthenticated, async (req, res) => {
    try {
      const domains = await storage.getCompanySettingMasterDomains();
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.get("/api/company-setting-master-domains/:id", isAuthenticated, async (req, res) => {
    try {
      const domain = await storage.getCompanySettingMasterDomain(req.params.id);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.json(domain);
    } catch (error) {
      console.error("Error fetching domain:", error);
      res.status(500).json({ message: "Failed to fetch domain" });
    }
  });

  app.post("/api/company-setting-master-domains", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create domains" });
      }

      const validatedData = insertCompanySettingMasterDomainSchema.parse(req.body);
      const domain = await storage.createCompanySettingMasterDomain(validatedData);
      res.status(201).json(domain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating domain:", error);
      res.status(500).json({ message: "Failed to create domain" });
    }
  });

  app.patch("/api/company-setting-master-domains/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update domains" });
      }

      const validatedData = insertCompanySettingMasterDomainSchema.partial().parse(req.body);
      const domain = await storage.updateCompanySettingMasterDomain(req.params.id, validatedData);
      if (!domain) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.json(domain);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating domain:", error);
      res.status(500).json({ message: "Failed to update domain" });
    }
  });

  app.delete("/api/company-setting-master-domains/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete domains" });
      }

      const deleted = await storage.deleteCompanySettingMasterDomain(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Domain not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // Company Setting Master Functionality routes (Global - read: all users, write: global admins only)
  app.get("/api/company-setting-master-functionalities", isAuthenticated, async (req, res) => {
    try {
      const functionalities = await storage.getCompanySettingMasterFunctionalities();
      res.json(functionalities);
    } catch (error) {
      console.error("Error fetching functionalities:", error);
      res.status(500).json({ message: "Failed to fetch functionalities" });
    }
  });

  app.get("/api/company-setting-master-functionalities/:id", isAuthenticated, async (req, res) => {
    try {
      const functionality = await storage.getCompanySettingMasterFunctionality(req.params.id);
      if (!functionality) {
        return res.status(404).json({ message: "Functionality not found" });
      }
      res.json(functionality);
    } catch (error) {
      console.error("Error fetching functionality:", error);
      res.status(500).json({ message: "Failed to fetch functionality" });
    }
  });

  app.post("/api/company-setting-master-functionalities", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create functionalities" });
      }

      const validatedData = insertCompanySettingMasterFunctionalitySchema.parse(req.body);
      const functionality = await storage.createCompanySettingMasterFunctionality(validatedData);
      res.status(201).json(functionality);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating functionality:", error);
      res.status(500).json({ message: "Failed to create functionality" });
    }
  });

  app.patch("/api/company-setting-master-functionalities/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update functionalities" });
      }

      const validatedData = insertCompanySettingMasterFunctionalitySchema.partial().parse(req.body);
      const functionality = await storage.updateCompanySettingMasterFunctionality(req.params.id, validatedData);
      if (!functionality) {
        return res.status(404).json({ message: "Functionality not found" });
      }
      res.json(functionality);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating functionality:", error);
      res.status(500).json({ message: "Failed to update functionality" });
    }
  });

  app.delete("/api/company-setting-master-functionalities/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete functionalities" });
      }

      const deleted = await storage.deleteCompanySettingMasterFunctionality(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Functionality not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting functionality:", error);
      res.status(500).json({ message: "Failed to delete functionality" });
    }
  });

  // Company Settings Master routes (Global - read: all users, write: global admins only)
  app.get("/api/company-settings-masters", isAuthenticated, async (req, res) => {
    try {
      const settingsMasters = await storage.getCompanySettingsMasters();
      res.json(settingsMasters);
    } catch (error) {
      console.error("Error fetching settings masters:", error);
      res.status(500).json({ message: "Failed to fetch settings masters" });
    }
  });

  app.get("/api/company-settings-masters/:id", isAuthenticated, async (req, res) => {
    try {
      const settingsMaster = await storage.getCompanySettingsMaster(req.params.id);
      if (!settingsMaster) {
        return res.status(404).json({ message: "Settings master not found" });
      }
      res.json(settingsMaster);
    } catch (error) {
      console.error("Error fetching settings master:", error);
      res.status(500).json({ message: "Failed to fetch settings master" });
    }
  });

  app.post("/api/company-settings-masters", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can create settings masters" });
      }

      const validatedData = insertCompanySettingsMasterSchema.parse(req.body);
      const settingsMaster = await storage.createCompanySettingsMaster(validatedData);
      res.status(201).json(settingsMaster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating settings master:", error);
      res.status(500).json({ message: "Failed to create settings master" });
    }
  });

  app.patch("/api/company-settings-masters/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can update settings masters" });
      }

      const validatedData = insertCompanySettingsMasterSchema.partial().parse(req.body);
      const settingsMaster = await storage.updateCompanySettingsMaster(req.params.id, validatedData);
      if (!settingsMaster) {
        return res.status(404).json({ message: "Settings master not found" });
      }
      res.json(settingsMaster);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating settings master:", error);
      res.status(500).json({ message: "Failed to update settings master" });
    }
  });

  app.delete("/api/company-settings-masters/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({ message: "Only global admins can delete settings masters" });
      }

      const deleted = await storage.deleteCompanySettingsMaster(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Settings master not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting settings master:", error);
      res.status(500).json({ message: "Failed to delete settings master" });
    }
  });

  // Business Objects Manager - Company Settings by Domain (Company-scoped)
  app.get("/api/business-objects/company-settings/:domain", isAuthenticated, async (req, res) => {
    try {
      // Verify user is company admin or global admin
      const [isCompanyAdmin, isGlobalAdmin] = await Promise.all([
        storage.verifyCompanyAdmin(req),
        storage.verifyGlobalAdmin(req),
      ]);
      
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      // Get user's company context
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(400).json({
          message: "Company context not found for user",
        });
      }

      // Get the functional domain from URL parameter
      const { domain } = req.params;

      // Fetch company settings filtered by functional domain and company
      const settings = await storage.GetCompanySettingsByFunctionalDomain(
        domain,
        companyContext
      );

      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({
        message: "Failed to fetch company settings",
      });
    }
  });

  // Get or create company setting by code
  app.get("/api/business-objects/company-settings/by-code/:code", isAuthenticated, async (req, res) => {
    try {
      // Verify user is company admin or global admin
      const [isCompanyAdmin, isGlobalAdmin] = await Promise.all([
        storage.verifyCompanyAdmin(req),
        storage.verifyGlobalAdmin(req),
      ]);
      
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      // Get user's company context and user ID
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(400).json({
          message: "Company context not found for user",
        });
      }

      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser) {
        userId = sessionUser.id;
      } else {
        userId = (req.user as any)?.claims?.sub;
      }

      if (!userId) {
        return res.status(400).json({
          message: "User ID not found",
        });
      }

      const setting = await storage.getOrCreateCompanySettingByCode(
        req.params.code,
        companyContext,
        userId
      );

      res.json(setting);
    } catch (error) {
      console.error("Error fetching/creating company setting:", error);
      res.status(500).json({
        message: "Failed to fetch/create company setting",
      });
    }
  });

  // Update company setting value
  app.patch("/api/business-objects/company-settings/:id", isAuthenticated, async (req, res) => {
    try {
      // Verify user is company admin or global admin
      const [isCompanyAdmin, isGlobalAdmin] = await Promise.all([
        storage.verifyCompanyAdmin(req),
        storage.verifyGlobalAdmin(req),
      ]);
      
      if (!isCompanyAdmin && !isGlobalAdmin) {
        return res.status(403).json({
          message: "Access denied. Admin role required.",
        });
      }

      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser) {
        userId = sessionUser.id;
      } else {
        userId = (req.user as any)?.claims?.sub;
      }

      if (!userId) {
        return res.status(400).json({
          message: "User ID not found",
        });
      }

      const { settingValue } = req.body;
      if (settingValue === undefined) {
        return res.status(400).json({
          message: "settingValue is required",
        });
      }

      const updatedSetting = await storage.updateCompanySetting(
        req.params.id,
        settingValue,
        userId
      );

      if (!updatedSetting) {
        return res.status(404).json({ message: "Company setting not found" });
      }

      res.json(updatedSetting);
    } catch (error) {
      console.error("Error updating company setting:", error);
      res.status(500).json({
        message: "Failed to update company setting",
      });
    }
  });

  // Dev Pattern routes (Global - no company context, all operations require global admin)
  app.get("/api/dev-patterns", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can view dev patterns" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can view dev patterns" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can create dev patterns" });
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
        return res
          .status(403)
          .json({ message: "Only global admins can update dev patterns" });
      }

      const validatedData = insertDevPatternSchema.partial().parse(req.body);
      const devPattern = await storage.updateDevPattern(
        req.params.id,
        validatedData,
      );
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
        return res
          .status(403)
          .json({ message: "Only global admins can delete dev patterns" });
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

  // Licence routes (Global - broader read access for registration, admin-only CUD)
  app.get("/api/licences", async (req, res) => {
    try {
      const licences = await storage.getLicences();
      res.json(licences);
    } catch (error) {
      console.error("Error fetching licences:", error);
      res.status(500).json({ message: "Failed to fetch licences" });
    }
  });

  app.get("/api/licences/:id", async (req, res) => {
    try {
      const licence = await storage.getLicence(req.params.id);
      if (!licence) {
        return res.status(404).json({ message: "Licence not found" });
      }
      res.json(licence);
    } catch (error) {
      console.error("Error fetching licence:", error);
      res.status(500).json({ message: "Failed to fetch licence" });
    }
  });

  app.post("/api/licences", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can create licences" });
      }

      const validatedData = insertLicenceSchema.parse(req.body);
      const licence = await storage.createLicence(validatedData);
      res.status(201).json(licence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating licence:", error);
      res.status(500).json({ message: "Failed to create licence" });
    }
  });

  app.patch("/api/licences/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can update licences" });
      }

      const validatedData = insertLicenceSchema.partial().parse(req.body);
      const licence = await storage.updateLicence(req.params.id, validatedData);
      if (!licence) {
        return res.status(404).json({ message: "Licence not found" });
      }
      res.json(licence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating licence:", error);
      res.status(500).json({ message: "Failed to update licence" });
    }
  });

  app.delete("/api/licences/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can delete licences" });
      }

      const deleted = await storage.deleteLicence(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Licence not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting licence:", error);
      res.status(500).json({ message: "Failed to delete licence" });
    }
  });

  // Licence Agreement Template routes (Global - broader read access for registration, admin-only CUD)
  app.get("/api/licence-agreement-templates", async (req, res) => {
    try {
      const templates = await storage.getLicenceAgreementTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching licence agreement templates:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch licence agreement templates" });
    }
  });

  app.get("/api/licence-agreement-templates/:id", async (req, res) => {
    try {
      const template = await storage.getLicenceAgreementTemplate(req.params.id);
      if (!template) {
        return res
          .status(404)
          .json({ message: "Licence agreement template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching licence agreement template:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch licence agreement template" });
    }
  });

  app.post(
    "/api/licence-agreement-templates",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message:
              "Only global admins can create licence agreement templates",
          });
        }

        const validatedData = insertLicenceAgreementTemplateSchema.parse(
          req.body,
        );
        const template =
          await storage.createLicenceAgreementTemplate(validatedData);
        res.status(201).json(template);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error creating licence agreement template:", error);
        res
          .status(500)
          .json({ message: "Failed to create licence agreement template" });
      }
    },
  );

  app.patch(
    "/api/licence-agreement-templates/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message:
              "Only global admins can update licence agreement templates",
          });
        }

        const validatedData = insertLicenceAgreementTemplateSchema
          .partial()
          .parse(req.body);
        const template = await storage.updateLicenceAgreementTemplate(
          req.params.id,
          validatedData,
        );
        if (!template) {
          return res
            .status(404)
            .json({ message: "Licence agreement template not found" });
        }
        res.json(template);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error updating licence agreement template:", error);
        res
          .status(500)
          .json({ message: "Failed to update licence agreement template" });
      }
    },
  );

  app.delete(
    "/api/licence-agreement-templates/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message:
              "Only global admins can delete licence agreement templates",
          });
        }

        const deleted = await storage.deleteLicenceAgreementTemplate(
          req.params.id,
        );
        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Licence agreement template not found" });
        }
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting licence agreement template:", error);
        res
          .status(500)
          .json({ message: "Failed to delete licence agreement template" });
      }
    },
  );

  // Licence Agreement routes (Global admin for CUD, company-specific GET endpoint)
  app.get("/api/licence-agreements", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({
          message: "Only global admins can view all licence agreements",
        });
      }

      const agreements = await storage.getLicenceAgreements();
      res.json(agreements);
    } catch (error) {
      console.error("Error fetching licence agreements:", error);
      res.status(500).json({ message: "Failed to fetch licence agreements" });
    }
  });

  app.get(
    "/api/licence-agreements/company/:companyId",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message:
              "Only global admins can view licence agreements by company",
          });
        }

        const agreements = await storage.getLicenceAgreementsByCompany(
          req.params.companyId,
        );
        res.json(agreements);
      } catch (error) {
        console.error("Error fetching licence agreements by company:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch licence agreements by company" });
      }
    },
  );
  // this is used to get agreements where seats are available
  app.get(
    "/api/licence-agreements/available",
    isAuthenticated,
    async (req, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        if (!companyContext) {
          return res.status(403).json({ message: "No company context available" });
        }
        const agreements =
          await storage.getLicenceAgreementsByCompany(companyContext);
        const availableAgreements = agreements.filter(
          (agreement) => (agreement.licenceSeatsRemaining ?? 0) > 0,
        );
        res.json(availableAgreements);
      } catch (error) {
        console.error("Error fetching available licence agreements:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch available licence agreements" });
      }
    },
  );

  app.get("/api/licence-agreements/:id", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res
          .status(403)
          .json({ message: "Only global admins can view licence agreements" });
      }

      const agreement = await storage.getLicenceAgreement(req.params.id);
      if (!agreement) {
        return res.status(404).json({ message: "Licence agreement not found" });
      }
      res.json(agreement);
    } catch (error) {
      console.error("Error fetching licence agreement:", error);
      res.status(500).json({ message: "Failed to fetch licence agreement" });
    }
  });

  app.post("/api/licence-agreements", isAuthenticated, async (req, res) => {
    try {
      const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
      if (!isGlobalAdmin) {
        return res.status(403).json({
          message: "Only global admins can create licence agreements",
        });
      }

      const validatedData = insertLicenceAgreementSchema.parse(req.body);
      const agreement = await storage.createLicenceAgreement(validatedData);
      res.status(201).json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating licence agreement:", error);
      res.status(500).json({ message: "Failed to create licence agreement" });
    }
  });

  // Public endpoint for automated licence agreement creation
  app.post("/api/licence-agreements-automated", async (req, res) => {
    try {
      const schema = z.object({
        licenceAgreementTemplateId: z
          .string()
          .min(1, "Template ID is required"),
        companyId: z.string().min(1, "Company ID is required"),
      });
      const validatedData = schema.parse(req.body);
      const agreement = await storage.createLicenceAgreementAutomated(
        validatedData.licenceAgreementTemplateId,
        validatedData.companyId,
      );
      res.status(201).json(agreement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating automated licence agreement:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to create licence agreement",
      });
    }
  });

  app.patch(
    "/api/licence-agreements/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message: "Only global admins can update licence agreements",
          });
        }

        const validatedData = insertLicenceAgreementSchema
          .partial()
          .parse(req.body);
        const agreement = await storage.updateLicenceAgreement(
          req.params.id,
          validatedData,
        );
        if (!agreement) {
          return res
            .status(404)
            .json({ message: "Licence agreement not found" });
        }
        res.json(agreement);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error.errors });
        }
        console.error("Error updating licence agreement:", error);
        res.status(500).json({ message: "Failed to update licence agreement" });
      }
    },
  );

  app.delete(
    "/api/licence-agreements/:id",
    isAuthenticated,
    async (req, res) => {
      try {
        const isGlobalAdmin = await storage.verifyGlobalAdmin(req);
        if (!isGlobalAdmin) {
          return res.status(403).json({
            message: "Only global admins can delete licence agreements",
          });
        }

        const deleted = await storage.deleteLicenceAgreement(req.params.id);
        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Licence agreement not found" });
        }
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting licence agreement:", error);
        res.status(500).json({ message: "Failed to delete licence agreement" });
      }
    },
  );

  // Email routes (Company-scoped)
  app.get(
    "/api/emails/:parentType/:parentId",
    isAuthenticated,
    async (req, res) => {
      try {
        const companyContext = await storage.GetCompanyContext(req);
        if (!companyContext) {
          return res.status(403).json({ message: "No company context" });
        }

        const { parentType, parentId } = req.params;
        const emails = await storage.getEmailsByParent(
          parentType,
          parentId,
          companyContext,
        );
        res.json(emails);
      } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ message: "Failed to fetch emails" });
      }
    },
  );

  app.post("/api/emails", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      const validatedData = insertEmailSchema.parse({
        ...req.body,
        companyId: companyContext,
      });

      const email = await storage.createEmail(validatedData);

      // Send the email via SendGrid
      const emailResult = await sendEmail({
        to: validatedData.toEmail,
        from: validatedData.fromEmail,
        subject: validatedData.subject,
        text: validatedData.body,
        cc: validatedData.ccEmail
          ? validatedData.ccEmail.split(",").map((e) => e.trim())
          : undefined,
        bcc: validatedData.bccEmail
          ? validatedData.bccEmail.split(",").map((e) => e.trim())
          : undefined,
      });

      if (!emailResult.success) {
        console.error("Error sending email:", emailResult.error);
        // Email record is created but sending failed
        return res.status(500).json({
          message:
            emailResult.error || "Email record created but failed to send",
          email,
        });
      }

      res.status(201).json(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating email:", error);
      res.status(500).json({ message: "Failed to create email" });
    }
  });

  app.delete("/api/emails/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      // First check if email exists and belongs to this company
      const email = await storage.getEmail(req.params.id);
      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }
      if (email.companyId !== companyContext) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this email" });
      }

      const deleted = await storage.deleteEmail(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Email not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email:", error);
      res.status(500).json({ message: "Failed to delete email" });
    }
  });

  // Object Storage Routes - For company logo uploads
  // This endpoint serves private objects (company logos in this case) that can be accessed publicly
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for object entity (logo)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  // Update company logo after upload
  app.put("/api/companies/:id/logo", isAuthenticated, async (req, res) => {
    if (!req.body.logoUrl) {
      return res.status(400).json({ error: "logoUrl is required" });
    }

    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      // Check if the company exists and user has access
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      if (company.id !== companyContext) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this company's logo" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.logoUrl,
      );

      // Update company with the logo path
      const updatedCompany = await storage.updateCompany(req.params.id, {
        logoUrl: objectPath,
      });

      res.status(200).json({
        logoUrl: objectPath,
        company: updatedCompany,
      });
    } catch (error) {
      console.error("Error setting company logo:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete company logo
  app.delete("/api/companies/:id/logo", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      if (!companyContext) {
        return res.status(403).json({ message: "No company context" });
      }

      // Check if the company exists and user has access
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      if (company.id !== companyContext) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this company's logo" });
      }

      // Update company to remove logo
      const updatedCompany = await storage.updateCompany(req.params.id, {
        logoUrl: null,
      });

      res.status(200).json({
        message: "Logo deleted successfully",
        company: updatedCompany,
      });
    } catch (error) {
      console.error("Error deleting company logo:", error);
      res.status(500).json({ error: "Internal server error" });
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
