import { Router } from "express";
import type { Request, Response } from "express";
import { storage } from "../storage";
import { businessObjectsManagerStorage } from "./storage-business-objects-manager";

export const businessObjectsManagerRoutes = Router();

/**
 * GET /api/business-objects/company-settings/:domain
 * Get company settings by functional domain
 * Requires: Company Admin role
 */
businessObjectsManagerRoutes.get(
  "/company-settings/:domain",
  async (req: Request, res: Response) => {
    try {
      // Verify user is company admin
      const isCompanyAdmin = await storage.verifyCompanyAdmin(req);
      if (!isCompanyAdmin) {
        return res.status(403).json({
          message: "Access denied. Company admin role required.",
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
      const settings = await businessObjectsManagerStorage.GetCompanySettingsByFunctionalDomain(
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
  }
);
