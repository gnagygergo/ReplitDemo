//Product Routes - don't contain specific fields. This is a generic codebase, meeting standardization requirements.
import type { Express } from "express";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";
import type { IStorage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerProductRoutes(app: Express, storage: IStorage) {
  // Product routes respecting company context
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const products = await storage.getProducts(companyContext || undefined);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const product = await storage.getProduct(
        req.params.id,
        companyContext || undefined,
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);

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

      const user = await storage.getUser(currentUserId);
      if (!user || !user.companyContext) {
        return res
          .status(400)
          .json({ message: "User has no company context set" });
      }

      const productData = {
        ...validatedData,
        companyId: user.companyContext,
      };

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(
        req.params.id,
        validatedData,
        companyContext || undefined,
      );
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const companyContext = await storage.GetCompanyContext(req);
      const deleted = await storage.deleteProduct(
        req.params.id,
        companyContext || undefined,
      );
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
}
