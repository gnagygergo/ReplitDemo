import { db } from "../db";
import { accounts, users, opportunities, cases } from "@shared/schema";
import type { Account, InsertAccount, AccountWithOwner } from "@shared/schema";
import { eq } from "drizzle-orm";

export class AccountStorage {
  // Reference to getUser from main storage - will be injected
  private getUser: (id: string) => Promise<any>;

  constructor(getUserFn: (id: string) => Promise<any>) {
    this.getUser = getUserFn;
  }

  async getAccounts(companyContext?: string): Promise<AccountWithOwner[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(eq(accounts.companyId, companyContext))
      .then((rows) =>
        rows.map((row) => ({
          ...row.accounts,
          owner: row.users,
        })),
      );
  }

  async getAccount(id: string): Promise<AccountWithOwner | undefined> {
    const [result] = await db
      .select()
      .from(accounts)
      .innerJoin(users, eq(accounts.ownerId, users.id))
      .where(eq(accounts.id, id));

    if (!result) return undefined;

    return {
      ...result.accounts,
      owner: result.users,
    };
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    // Verify owner exists
    const owner = await this.getUser(insertAccount.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    // Debug: Log owner details
    console.log("DEBUG createAccount - Owner:", {
      id: owner.id,
      email: owner.email,
      companyId: owner.companyId,
      fullOwner: owner,
    });

    // Automatically populate CompanyId from owner's CompanyId
    const accountData = {
      ...insertAccount,
      companyId: owner.companyId || null,
    };

    console.log("DEBUG createAccount - Account data to insert:", accountData);

    const [account] = await db.insert(accounts).values(accountData).returning();

    console.log("DEBUG createAccount - Created account:", account);

    return account;
  }

  async updateAccount(
    id: string,
    updates: Partial<InsertAccount>,
  ): Promise<Account | undefined> {
    // If updating ownerId, verify the new owner exists
    if (updates.ownerId) {
      const owner = await this.getUser(updates.ownerId);
      if (!owner) {
        throw new Error("Owner not found");
      }
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [account] = await db
      .update(accounts)
      .set(allowedUpdates)
      .where(eq(accounts.id, id))
      .returning();
    return account || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    // Check if account has opportunities or cases
    const existingOpportunities = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.accountId, id));
    const existingCases = await db
      .select()
      .from(cases)
      .where(eq(cases.accountId, id));

    if (existingOpportunities.length > 0 || existingCases.length > 0) {
      return false; // Cannot delete account with opportunities or cases
    }

    const result = await db.delete(accounts).where(eq(accounts.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
