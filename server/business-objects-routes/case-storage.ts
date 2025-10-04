import { db } from "../db";
import { cases, accounts, users } from "@shared/schema";
import type { Case, InsertCase, CaseWithAccountAndOwner } from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";

export class CaseStorage {
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

  async getCases(sortBy?: string, sortOrder?: string): Promise<CaseWithAccountAndOwner[]> { // Added sortBy, sortOrder for sorting capability on Tables
    // Added for sorting capability on Tables - Determine sort column - default to 'subject'
    let sortColumn;
    if (sortBy === 'fromEmail') {
      sortColumn = cases.fromEmail;
    } else {
      sortColumn = cases.subject;
    }

    // Added for sorting capability on Tables - Determine sort direction - default to 'asc'
    const orderDirection = sortOrder === 'desc' ? desc : asc;

    return await db
      .select()
      .from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .innerJoin(users, eq(cases.ownerId, users.id))
      .orderBy(orderDirection(sortColumn)) // Added for sorting capability on Tables
      .then((rows) =>
        rows.map((row) => ({
          ...row.cases,
          account: row.accounts,
          owner: row.users,
        })),
      );
  }

  async getCase(id: string): Promise<CaseWithAccountAndOwner | undefined> {
    const [result] = await db
      .select()
      .from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .innerJoin(users, eq(cases.ownerId, users.id))
      .where(eq(cases.id, id));

    if (!result) return undefined;

    return {
      ...result.cases,
      account: result.accounts,
      owner: result.users,
    };
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    // Verify account exists
    const account = await this.getAccount(insertCase.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Verify owner exists
    const owner = await this.getUser(insertCase.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    // Automatically populate CompanyId from owner's CompanyId
    const caseData = {
      ...insertCase,
      companyId: owner.companyId || null,
    };

    const [caseRecord] = await db.insert(cases).values(caseData).returning();
    return caseRecord;
  }

  async updateCase(
    id: string,
    updates: Partial<InsertCase>,
  ): Promise<Case | undefined> {
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
    const { companyId, ...allowedUpdates } = updates as any;

    const [caseRecord] = await db
      .update(cases)
      .set(allowedUpdates)
      .where(eq(cases.id, id))
      .returning();
    return caseRecord || undefined;
  }

  async deleteCase(id: string): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}
