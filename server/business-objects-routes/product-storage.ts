//Product Storage - methods don't contain specific fields. This is a generic storage class, meeting standardization requirements.
import { db } from "../db";
import { products } from "@shared/schema";
import type { Product, InsertProduct } from "@shared/schema";
import { eq, and, getTableColumns } from "drizzle-orm";

export class ProductStorage {
  async getProducts(companyContext?: string): Promise<Product[]> {
    if (!companyContext) {
      return [];
    }

    const result = await db
      .select(getTableColumns(products))
      .from(products)
      .where(eq(products.companyId, companyContext))
      .orderBy(products.name);

    return result;
  }

  async getProduct(id: string, companyContext?: string): Promise<Product | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [product] = await db
      .select(getTableColumns(products))
      .from(products)
      .where(and(eq(products.id, id), eq(products.companyId, companyContext)));

    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct as any)
      .returning();
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>,
    companyContext?: string,
  ): Promise<Product | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [product] = await db
      .update(products)
      .set(allowedUpdates)
      .where(and(eq(products.id, id), eq(products.companyId, companyContext)))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.companyId, companyContext)));
    return (result.rowCount ?? 0) > 0;
  }
}
