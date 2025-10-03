import { db } from "../db";
import { products, unitOfMeasures } from "@shared/schema";
import type { Product, InsertProduct, ProductWithUom } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class ProductStorage {
  async getProducts(companyContext?: string): Promise<ProductWithUom[]> {
    if (!companyContext) {
      return [];
    }

    const result = await db
      .select({
        id: products.id,
        salesCategory: products.salesCategory,
        productName: products.productName,
        salesUomId: products.salesUomId,
        salesUnitPrice: products.salesUnitPrice,
        salesUnitPriceCurrency: products.salesUnitPriceCurrency,
        vatPercent: products.vatPercent,
        companyId: products.companyId,
        salesUomName: unitOfMeasures.uomName,
      })
      .from(products)
      .leftJoin(unitOfMeasures, eq(products.salesUomId, unitOfMeasures.id))
      .where(eq(products.companyId, companyContext))
      .orderBy(products.productName);

    return result as ProductWithUom[];
  }

  async getProduct(id: string, companyContext?: string): Promise<ProductWithUom | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [product] = await db
      .select({
        id: products.id,
        salesCategory: products.salesCategory,
        productName: products.productName,
        salesUomId: products.salesUomId,
        salesUnitPrice: products.salesUnitPrice,
        salesUnitPriceCurrency: products.salesUnitPriceCurrency,
        vatPercent: products.vatPercent,
        companyId: products.companyId,
        salesUomName: unitOfMeasures.uomName,
      })
      .from(products)
      .leftJoin(unitOfMeasures, eq(products.salesUomId, unitOfMeasures.id))
      .where(and(eq(products.id, id), eq(products.companyId, companyContext)));
    return product as ProductWithUom | undefined;
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
