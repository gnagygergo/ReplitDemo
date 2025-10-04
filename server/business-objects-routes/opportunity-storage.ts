import { db } from "../db";
import { opportunities, accounts, users } from "@shared/schema";
import type { Opportunity, InsertOpportunity, OpportunityWithAccountAndOwner } from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export class OpportunityStorage {
  // Reference to getAccount and getUser from main storage - will be injected
  private getAccount: (id: string) => Promise<any>;
  private getUser: (id: string) => Promise<any>;

  constructor(
    getAccountFn: (id: string) => Promise<any>,
    getUserFn: (id: string) => Promise<any>
  ) {
    this.getAccount = getAccountFn;
    this.getUser = getUserFn;
  }

  async getOpportunities(
    companyContext?: string,
    sortBy?: string, // Added for sorting capability on Tables
    sortOrder?: string, // Added for sorting capability on Tables
  ): Promise<OpportunityWithAccountAndOwner[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    // Added for sorting capability on Tables - Determine sort column - default to 'closeDate'
    let sortColumn;
    if (sortBy === 'name') {
      sortColumn = opportunities.name;
    } else if (sortBy === 'totalRevenue') {
      sortColumn = opportunities.totalRevenue;
    } else {
      sortColumn = opportunities.closeDate;
    }

    // Added for sorting capability on Tables - Determine sort direction - default to 'desc' for closeDate
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    return await db
      .select()
      .from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .where(eq(opportunities.companyId, companyContext))
      .orderBy(orderDirection(sortColumn)) // Added for sorting capability on Tables
      .then((rows) =>
        rows.map((row) => ({
          ...row.opportunities,
          account: row.accounts,
          owner: row.users,
        })),
      );
  }

  async getOpportunitiesByAccount(
    accountId: string,
    companyContext?: string,
  ): Promise<OpportunityWithAccountAndOwner[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .where(
        and(
          eq(opportunities.accountId, accountId),
          eq(opportunities.companyId, companyContext),
        ),
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row.opportunities,
          account: row.accounts,
          owner: row.users,
        })),
      );
  }

  async getOpportunity(
    id: string,
  ): Promise<OpportunityWithAccountAndOwner | undefined> {
    const [result] = await db
      .select()
      .from(opportunities)
      .innerJoin(accounts, eq(opportunities.accountId, accounts.id))
      .innerJoin(users, eq(opportunities.ownerId, users.id))
      .where(eq(opportunities.id, id));

    if (!result) return undefined;

    return {
      ...result.opportunities,
      account: result.accounts,
      owner: result.users,
    };
  }

  async createOpportunity(
    insertOpportunity: InsertOpportunity,
  ): Promise<Opportunity> {
    // Verify account exists
    const account = await this.getAccount(insertOpportunity.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify owner exists
    const owner = await this.getUser(insertOpportunity.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    // Automatically populate CompanyId from owner's CompanyId
    const opportunityData = {
      ...insertOpportunity,
      totalRevenue: insertOpportunity.totalRevenue.toString(),
      companyId: owner.companyId || null,
    };

    const [opportunity] = await db
      .insert(opportunities)
      .values(opportunityData)
      .returning();
    return opportunity;
  }

  async updateOpportunity(
    id: string,
    updates: Partial<InsertOpportunity>,
  ): Promise<Opportunity | undefined> {
    // If updating accountId, verify the new account exists
    if (updates.accountId) {
      const account = await this.getAccount(updates.accountId);
      if (!account) {
        throw new Error("Account not found");
      }
    }

    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...filteredUpdates } = updates as any;

    const updateData: any = { ...filteredUpdates };
    if (filteredUpdates.totalRevenue !== undefined) {
      updateData.totalRevenue = filteredUpdates.totalRevenue.toString();
    }

    const [opportunity] = await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, id))
      .returning();
    return opportunity || undefined;
  }

  async deleteOpportunity(id: string): Promise<boolean> {
    const result = await db
      .delete(opportunities)
      .where(eq(opportunities.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
