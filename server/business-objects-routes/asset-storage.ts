//Asset Storage - methods don't contain specific fields. This is a generic storage class, meeting standardization requirements.
import { db } from "../db";
import { assets } from "@shared/schema";
import type { Asset, InsertAsset } from "@shared/schema";
import { eq, and, getTableColumns } from "drizzle-orm";

export class AssetStorage {
  async getAssets(companyContext?: string): Promise<Asset[]> {
    if (!companyContext) {
      return [];
    }

    const result = await db
      .select(getTableColumns(assets))
      .from(assets)
      .where(eq(assets.companyId, companyContext))
      .orderBy(assets.name);

    return result;
  }

  async getAsset(id: string, companyContext?: string): Promise<Asset | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [asset] = await db
      .select(getTableColumns(assets))
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyContext)));

    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset as any)
      .returning();
    return asset;
  }

  async updateAsset(
    id: string,
    updates: Partial<InsertAsset>,
    companyContext?: string,
  ): Promise<Asset | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [asset] = await db
      .update(assets)
      .set(allowedUpdates)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyContext)))
      .returning();
    return asset || undefined;
  }

  async deleteAsset(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(assets)
      .where(and(eq(assets.id, id), eq(assets.companyId, companyContext)));
    return (result.rowCount ?? 0) > 0;
  }
}
