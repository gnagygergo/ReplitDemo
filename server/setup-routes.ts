import type { Express } from "express";
import type { IStorage } from "./storage";
import {
  insertCompanySchema,
  insertReleaseSchema,
  insertLanguageSchema,
  insertTranslationSchema,
  insertKnowledgeArticleSchema,
  insertDevPatternSchema,
  insertLicenceSchema,
  insertLicenceAgreementTemplateSchema,
  insertLicenceAgreementSchema,
  insertCompanySettingMasterDomainSchema,
  insertCompanySettingMasterFunctionalitySchema,
  insertCompanySettingsMasterSchema,
} from "@shared/schema";
import { z } from "zod";
import { isAuthenticated } from "./replitAuth";

export function registerSetupRoutes(app: Express, storage: IStorage) {
  // Company routes
  app.get("/api/companies", isAuthenticated, async (req, res) => {
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

  app.get("/api/companies/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/companies", isAuthenticated, async (req, res) => {
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

  app.patch("/api/companies/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/companies/:id", isAuthenticated, async (req, res) => {
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

  app.get("/api/companies/:companyId/users", isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getUsersByCompany(req, req.params.companyId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users for company" });
    }
  });

  // User management routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const users = await storage.getUsers(companyContext || undefined);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req: any, res) => {
    try {
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
            "Your account is not associated with a company; cannot create users",
        });
      }

      const userDataWithCompany = {
        ...validatedData,
        companyId: currentUser.companyId,
        isAdmin: false,
      };

      const user = await storage.createUser(userDataWithCompany);

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
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userUpdateSchema = z.object({
        licenceAgreementId: z.string().optional(),
        email: z.string().email("Please enter a valid email address").optional(),
        firstName: z.string().min(1, "First name is required").optional(),
        lastName: z.string().min(1, "Last name is required").optional(),
        profileImageUrl: z
          .string()
          .url("Please enter a valid URL")
          .optional()
          .or(z.literal("")),
        phone: z.string().optional(),
        preferredLanguage: z.string().optional(),
      });

      const validatedData = userUpdateSchema.parse(req.body);
      const user = await storage.updateUser(req.params.id, validatedData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (validatedData.licenceAgreementId) {
        await storage.actualizeLicenceAgreementSeatsUsed(
          validatedData.licenceAgreementId,
        );
      }

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(400).json({
          message:
            "Cannot delete user who owns accounts, opportunities, or cases",
        });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Release routes
  app.get("/api/releases", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const releases = await storage.getReleases(companyContext || undefined);
      res.json(releases);
    } catch (error) {
      console.error("Error fetching releases:", error);
      res.status(500).json({ message: "Failed to fetch releases" });
    }
  });

  app.get("/api/releases/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/releases", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertReleaseSchema.parse(req.body);

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

  app.patch("/api/releases/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/releases/:id", isAuthenticated, async (req, res) => {
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
        res
          .status(500)
          .json({ message: "Failed to update licence agreement" });
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
        res
          .status(500)
          .json({ message: "Failed to delete licence agreement" });
      }
    },
  );
}
