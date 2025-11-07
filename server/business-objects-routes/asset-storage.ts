import { db } from "../db";
import { assets, accounts, products } from "@shared/schema";
import type { Asset, InsertAsset, AssetWithRelations, Account, Product } from "@shared/schema";
import { eq, asc, desc, and, like, or } from "drizzle-orm";

export class AssetStorage {
  async getAssets(companyContext?: string, sortBy?: string, sortOrder?: string): Promise<AssetWithRelations[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    // Determine sort column - default to 'name'
    let sortColumn;
    if (sortBy === 'installationDate') {
      sortColumn = assets.installationDate;
    } else if (sortBy === 'serialNumber') {
      sortColumn = assets.serialNumber;
    } else {
      sortColumn = assets.name;
    }

    // Determine sort direction - default to 'asc'
    const orderDirection = sortOrder === 'desc' ? desc : asc;

    return await db
      .select()
      .from(assets)
      .leftJoin(accounts, eq(assets.accountId, accounts.id))
      .leftJoin(products, eq(assets.productId, products.id))
      .where(eq(assets.companyId, companyContext))
      .orderBy(orderDirection(sortColumn))
      .then((rows) =>
        rows.map((row) => ({
          ...row.assets,
          account: row.accounts || null,
          product: row.products || null,
        })),
      );
  }

  async searchAssets(companyContext: string | undefined, searchTerm?: string): Promise<AssetWithRelations[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    // If no search term, return all assets
    if (!searchTerm || searchTerm.trim() === "") {
      return this.getAssets(companyContext);
    }

    const searchPattern = `%${searchTerm}%`;

    return await db
      .select()
      .from(assets)
      .leftJoin(accounts, eq(assets.accountId, accounts.id))
      .leftJoin(products, eq(assets.productId, products.id))
      .where(
        and(
          eq(assets.companyId, companyContext),
          or(
            like(assets.name, searchPattern),
            like(assets.serialNumber, searchPattern),
            like(assets.description, searchPattern)
          )
        )
      )
      .orderBy(asc(assets.name))
      .then((rows) =>
        rows.map((row) => ({
          ...row.assets,
          account: row.accounts || null,
          product: row.products || null,
        })),
      );
  }

  async getAsset(id: string, companyContext: string): Promise<AssetWithRelations | undefined> {
    // Always filter by company context for multi-tenant security
    const [result] = await db
      .select()
      .from(assets)
      .leftJoin(accounts, eq(assets.accountId, accounts.id))
      .leftJoin(products, eq(assets.productId, products.id))
      .where(and(eq(assets.id, id), eq(assets.companyId, companyContext)));

    if (!result) return undefined;

    return {
      ...result.assets,
      account: result.accounts || null,
      product: result.products || null,
    };
  }

  async getAssetsByAccount(accountId: string, companyContext?: string): Promise<AssetWithRelations[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(assets)
      .leftJoin(accounts, eq(assets.accountId, accounts.id))
      .leftJoin(products, eq(assets.productId, products.id))
      .where(
        and(
          eq(assets.accountId, accountId),
          eq(assets.companyId, companyContext)
        )
      )
      .orderBy(asc(assets.name))
      .then((rows) =>
        rows.map((row) => ({
          ...row.assets,
          account: row.accounts || null,
          product: row.products || null,
        })),
      );
  }

  async createAsset(insertAsset: InsertAsset, companyId: string): Promise<Asset> {
    // Automatically populate CompanyId from authenticated context
    const assetData = {
      ...insertAsset,
      companyId: companyId,
    };

    const [asset] = await db.insert(assets).values(assetData).returning();

    return asset;
  }

  async updateAsset(
    id: string,
    updates: Partial<InsertAsset>,
    companyContext: string,
  ): Promise<Asset | undefined> {
    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    // Always filter by company context for multi-tenant security
    const [asset] = await db
      .update(assets)
      .set(allowedUpdates)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyContext)))
      .returning();
    return asset || undefined;
  }

  async deleteAsset(id: string, companyContext: string): Promise<boolean> {
    // Always filter by company context for multi-tenant security
    const result = await db.delete(assets).where(
      and(eq(assets.id, id), eq(assets.companyId, companyContext))
    );
    return (result.rowCount ?? 0) > 0;
  }
}
