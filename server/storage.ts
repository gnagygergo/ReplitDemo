import {
  type Company,
  type InsertCompany,
  type Account,
  type InsertAccount,
  type Opportunity,
  type InsertOpportunity,
  type OpportunityWithAccount,
  type OpportunityWithAccountAndOwner,
  type Case,
  type InsertCase,
  type CaseWithAccount,
  type CaseWithAccountAndOwner,
  type AccountWithOwner,
  type User,
  type UpsertUser,
  type CompanyRole,
  type InsertCompanyRole,
  type UserRoleAssignment,
  type InsertUserRoleAssignment,
  type CompanyRoleWithParent,
  type UserRoleAssignmentWithUserAndRole,
  type Release,
  type InsertRelease,
  type UnitOfMeasure,
  type InsertUnitOfMeasure,
  type Product,
  type InsertProduct,
  type ProductWithUom,
  type Language,
  type InsertLanguage,
  type Translation,
  type InsertTranslation,
  companies,
  accounts,
  opportunities,
  cases,
  users,
  companyRoles,
  userRoleAssignments,
  releases,
  unitOfMeasures,
  products,
  languages,
  translations,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import * as bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(companyContext?: string): Promise<User[]>;
  getUsersByCompany(companyId?: string): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  verifyUserPassword(email: string, password: string): Promise<User | null>;
  verifyGlobalAdmin(req: any): Promise<boolean>;
  verifyCompanyAdmin(req: any): Promise<boolean>;

  // Company methods
  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(
    id: string,
    company: Partial<InsertCompany>,
  ): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // Account methods
  getAccounts(companyContext?: string): Promise<AccountWithOwner[]>;
  getAccount(id: string): Promise<AccountWithOwner | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(
    id: string,
    account: Partial<InsertAccount>,
  ): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  // Opportunity methods
  getOpportunities(
    companyContext?: string,
  ): Promise<OpportunityWithAccountAndOwner[]>;
  getOpportunitiesByAccount(
    accountId: string,
    companyContext?: string,
  ): Promise<OpportunityWithAccountAndOwner[]>;
  getOpportunity(
    id: string,
  ): Promise<OpportunityWithAccountAndOwner | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(
    id: string,
    opportunity: Partial<InsertOpportunity>,
  ): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<boolean>;

  // Case methods
  getCases(): Promise<CaseWithAccountAndOwner[]>;
  getCase(id: string): Promise<CaseWithAccountAndOwner | undefined>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(
    id: string,
    caseData: Partial<InsertCase>,
  ): Promise<Case | undefined>;
  deleteCase(id: string): Promise<boolean>;

  // Company Role methods
  getCompanyRoles(): Promise<CompanyRoleWithParent[]>;
  getCompanyRole(id: string): Promise<CompanyRoleWithParent | undefined>;
  createCompanyRole(companyRole: InsertCompanyRole): Promise<CompanyRole>;
  updateCompanyRole(
    id: string,
    companyRole: Partial<InsertCompanyRole>,
  ): Promise<CompanyRole | undefined>;
  deleteCompanyRole(id: string): Promise<boolean>;

  // User Role Assignment methods
  getUserRoleAssignments(): Promise<UserRoleAssignmentWithUserAndRole[]>;
  getUserRoleAssignmentsByRole(
    companyRoleId: string,
  ): Promise<UserRoleAssignmentWithUserAndRole[]>;
  getUserRoleAssignment(
    id: string,
  ): Promise<UserRoleAssignmentWithUserAndRole | undefined>;
  createUserRoleAssignment(
    userRoleAssignment: InsertUserRoleAssignment,
  ): Promise<UserRoleAssignment>;
  updateUserRoleAssignment(
    id: string,
    userRoleAssignment: Partial<InsertUserRoleAssignment>,
  ): Promise<UserRoleAssignment | undefined>;
  deleteUserRoleAssignment(id: string): Promise<boolean>;

  // Release methods
  getReleases(companyContext?: string): Promise<Release[]>;
  getRelease(id: string, companyContext?: string): Promise<Release | undefined>;
  createRelease(release: InsertRelease): Promise<Release>;
  updateRelease(
    id: string,
    release: Partial<InsertRelease>,
    companyContext?: string,
  ): Promise<Release | undefined>;
  deleteRelease(id: string, companyContext?: string): Promise<boolean>;

  // Unit of Measure methods
  getUnitOfMeasures(): Promise<UnitOfMeasure[]>;
  getUnitOfMeasure(id: string): Promise<UnitOfMeasure | undefined>;
  createUnitOfMeasure(
    unitOfMeasure: InsertUnitOfMeasure,
  ): Promise<UnitOfMeasure>;
  updateUnitOfMeasure(
    id: string,
    unitOfMeasure: Partial<InsertUnitOfMeasure>,
  ): Promise<UnitOfMeasure | undefined>;
  deleteUnitOfMeasure(id: string): Promise<boolean>;

  // Product methods
  getProducts(companyContext?: string): Promise<ProductWithUom[]>;
  getProduct(id: string, companyContext?: string): Promise<ProductWithUom | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(
    id: string,
    product: Partial<InsertProduct>,
    companyContext?: string,
  ): Promise<Product | undefined>;
  deleteProduct(id: string, companyContext?: string): Promise<boolean>;

  // Language methods (Global - no company context)
  getLanguages(): Promise<Language[]>;
  getLanguage(id: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  updateLanguage(
    id: string,
    language: Partial<InsertLanguage>,
  ): Promise<Language | undefined>;
  deleteLanguage(id: string): Promise<boolean>;

  // Translation methods (Global - no company context)
  getTranslations(): Promise<Translation[]>;
  getTranslation(id: string): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  updateTranslation(
    id: string,
    translation: Partial<InsertTranslation>,
  ): Promise<Translation | undefined>;
  deleteTranslation(id: string): Promise<boolean>;

  // Row Level Security context methods
  setCompanyContext(companyId: string): Promise<void>;
  GetCompanyContext(req: any): Promise<string | null>; // Method called by all GETTERs of business objects
  GetCompanyNameBasedOnContext(req: any): Promise<string | null>; // Method to get company name based on current user's company context

  // Transaction-scoped operations for RLS
  runWithCompanyContext<T>(
    companyId: string,
    operation: () => Promise<T>,
  ): Promise<T>;
}

export class DatabaseStorage implements IStorage {
  // Method called by all GETTERs of business objects
  async GetCompanyContext(req: any): Promise<string | null> {
    try {
      // Extract user ID from session
      const sessionUser = (req.session as any).user;
      let userId;

      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }
      if (!userId) return null;
      // Get user's company context
      const user = await this.getUser(userId);
      return user?.companyContext || null;
    } catch (error) {
      console.error("Error getting company context:", error);
      return null;
    }
  }

  // Method to get company name based on current user's company context
  async GetCompanyNameBasedOnContext(req: any): Promise<string | null> {
    try {
      // Use existing method to get company context ID
      const companyId = await this.GetCompanyContext(req);
      if (!companyId) return null;

      // Query companies table to get company name
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      return company[0]?.companyOfficialName || null;
    } catch (error) {
      console.error("Error getting company name:", error);
      return null;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(companyContext?: string): Promise<User[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }
    return await db
      .select()
      .from(users)
      .where(eq(users.companyId, companyContext));
  }

  async getUsersByCompany(req: any, companyId?: string): Promise<User[]> {
    // First check if user is global admin
    const isGlobalAdmin = await this.verifyGlobalAdmin(req);
    if (!isGlobalAdmin) {
      return []; // Return empty results if not admin
    }
    // If no company ID provided, return empty results for security
    if (!companyId) {
      return [];
    }
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async verifyUserPassword(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const saltRounds = 10;
    const hashedUserData = { ...userData };

    // Hash password if provided
    if (userData.password) {
      hashedUserData.password = await bcrypt.hash(
        userData.password,
        saltRounds,
      );
    }

    const [user] = await db.insert(users).values(hashedUserData).returning();
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<UpsertUser>,
  ): Promise<User | undefined> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    // Check if user owns any accounts, opportunities, or cases
    const ownedAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.ownerId, id));
    const ownedOpportunities = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.ownerId, id));
    const ownedCases = await db
      .select()
      .from(cases)
      .where(eq(cases.ownerId, id));

    if (
      ownedAccounts.length > 0 ||
      ownedOpportunities.length > 0 ||
      ownedCases.length > 0
    ) {
      return false; // Cannot delete user who owns records
    }

    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async verifyGlobalAdmin(req: any): Promise<boolean> {
    try {
      // Extract user ID from session (same pattern as GetCompanyContext)
      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }

      if (!userId) return false;

      // Get user record from database
      const user = await this.getUser(userId);

      // Return the is_global_admin value (false if user not found)
      return user?.isGlobalAdmin || false;
    } catch (error) {
      console.error("Error verifying global admin:", error);
      return false;
    }
  }

  async verifyCompanyAdmin(req: any): Promise<boolean> {
    try {
      // Extract user ID from session (same pattern as GetCompanyContext)
      const sessionUser = (req.session as any).user;
      let userId;
      if (sessionUser && sessionUser.isDbUser) {
        userId = sessionUser.id;
      } else {
        userId = req.user?.claims?.sub;
      }

      if (!userId) return false;

      // Get user record from database
      const user = await this.getUser(userId);

      // Return the is_admin value (false if user not found)
      return user?.isAdmin || false;
    } catch (error) {
      console.error("Error verifying global admin:", error);
      return false;
    }
  }

  // Company methods
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));

    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async updateCompany(
    id: string,
    updates: Partial<InsertCompany>,
  ): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(companies).where(eq(companies.id, id));
    return (result.rowCount ?? 0) > 0;
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

  async getOpportunities(
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
      .where(eq(opportunities.companyId, companyContext))
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

  async getCases(): Promise<CaseWithAccountAndOwner[]> {
    return await db
      .select()
      .from(cases)
      .innerJoin(accounts, eq(cases.accountId, accounts.id))
      .innerJoin(users, eq(cases.ownerId, users.id))
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

  // Company Role methods
  async getCompanyRoles(): Promise<CompanyRoleWithParent[]> {
    const parentRole = alias(companyRoles, "parent_role");
    return await db
      .select()
      .from(companyRoles)
      .leftJoin(parentRole, eq(companyRoles.parentCompanyRoleId, parentRole.id))
      .then((rows) =>
        rows.map((row) => ({
          ...row.company_roles,
          parentCompanyRole: row.parent_role || null,
        })),
      );
  }

  async getCompanyRole(id: string): Promise<CompanyRoleWithParent | undefined> {
    const parentRole = alias(companyRoles, "parent_role");
    const [result] = await db
      .select()
      .from(companyRoles)
      .leftJoin(parentRole, eq(companyRoles.parentCompanyRoleId, parentRole.id))
      .where(eq(companyRoles.id, id));

    if (!result) return undefined;

    return {
      ...result.company_roles,
      parentCompanyRole: result.parent_role || null,
    };
  }

  private async checkRoleHierarchyCycle(
    roleId: string,
    parentRoleId: string,
  ): Promise<boolean> {
    if (roleId === parentRoleId) {
      return true; // Direct self-reference
    }

    let currentParentId = parentRoleId;
    const visited = new Set<string>();

    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parentRole = await this.getCompanyRole(currentParentId);
      if (!parentRole || !parentRole.parentCompanyRole) {
        break;
      }
      currentParentId = parentRole.parentCompanyRole.id;
      if (currentParentId === roleId) {
        return true; // Cycle detected
      }
    }

    return false;
  }

  async createCompanyRole(
    insertCompanyRole: InsertCompanyRole,
  ): Promise<CompanyRole> {
    // If parent role is specified, verify it exists
    if (insertCompanyRole.parentCompanyRoleId) {
      const parentRole = await this.getCompanyRole(
        insertCompanyRole.parentCompanyRoleId,
      );
      if (!parentRole) {
        throw new Error("Parent company role not found");
      }
    }

    const [companyRole] = await db
      .insert(companyRoles)
      .values(insertCompanyRole)
      .returning();
    return companyRole;
  }

  async updateCompanyRole(
    id: string,
    updates: Partial<InsertCompanyRole>,
  ): Promise<CompanyRole | undefined> {
    // If updating parentCompanyRoleId, verify the new parent exists and check for cycles
    if (updates.parentCompanyRoleId !== undefined) {
      if (updates.parentCompanyRoleId) {
        const parentRole = await this.getCompanyRole(
          updates.parentCompanyRoleId,
        );
        if (!parentRole) {
          throw new Error("Parent company role not found");
        }

        // Check for cycles in the hierarchy
        const wouldCreateCycle = await this.checkRoleHierarchyCycle(
          id,
          updates.parentCompanyRoleId,
        );
        if (wouldCreateCycle) {
          throw new Error(
            "Cannot create circular reference in company role hierarchy",
          );
        }
      }
    }

    const [companyRole] = await db
      .update(companyRoles)
      .set(updates)
      .where(eq(companyRoles.id, id))
      .returning();
    return companyRole || undefined;
  }

  async deleteCompanyRole(id: string): Promise<boolean> {
    // Check if role has child roles
    const childRoles = await db
      .select()
      .from(companyRoles)
      .where(eq(companyRoles.parentCompanyRoleId, id));
    if (childRoles.length > 0) {
      return false; // Cannot delete role with child roles
    }

    // Check if role has user assignments
    const userAssignments = await db
      .select()
      .from(userRoleAssignments)
      .where(eq(userRoleAssignments.companyRoleId, id));
    if (userAssignments.length > 0) {
      return false; // Cannot delete role with user assignments
    }

    const result = await db.delete(companyRoles).where(eq(companyRoles.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User Role Assignment methods
  async getUserRoleAssignments(): Promise<UserRoleAssignmentWithUserAndRole[]> {
    return await db
      .select()
      .from(userRoleAssignments)
      .innerJoin(users, eq(userRoleAssignments.userId, users.id))
      .innerJoin(
        companyRoles,
        eq(userRoleAssignments.companyRoleId, companyRoles.id),
      )
      .then((rows) =>
        rows.map((row) => ({
          ...row.user_role_assignments,
          user: row.users,
          companyRole: row.company_roles,
        })),
      );
  }

  async getUserRoleAssignmentsByRole(
    companyRoleId: string,
  ): Promise<UserRoleAssignmentWithUserAndRole[]> {
    return await db
      .select()
      .from(userRoleAssignments)
      .innerJoin(users, eq(userRoleAssignments.userId, users.id))
      .innerJoin(
        companyRoles,
        eq(userRoleAssignments.companyRoleId, companyRoles.id),
      )
      .where(eq(userRoleAssignments.companyRoleId, companyRoleId))
      .then((rows) =>
        rows.map((row) => ({
          ...row.user_role_assignments,
          user: row.users,
          companyRole: row.company_roles,
        })),
      );
  }

  async getUserRoleAssignment(
    id: string,
  ): Promise<UserRoleAssignmentWithUserAndRole | undefined> {
    const [result] = await db
      .select()
      .from(userRoleAssignments)
      .innerJoin(users, eq(userRoleAssignments.userId, users.id))
      .innerJoin(
        companyRoles,
        eq(userRoleAssignments.companyRoleId, companyRoles.id),
      )
      .where(eq(userRoleAssignments.id, id));

    if (!result) return undefined;

    return {
      ...result.user_role_assignments,
      user: result.users,
      companyRole: result.company_roles,
    };
  }

  async createUserRoleAssignment(
    insertUserRoleAssignment: InsertUserRoleAssignment,
  ): Promise<UserRoleAssignment> {
    // Verify user exists
    const user = await this.getUser(insertUserRoleAssignment.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify company role exists
    const companyRole = await this.getCompanyRole(
      insertUserRoleAssignment.companyRoleId,
    );
    if (!companyRole) {
      throw new Error("Company role not found");
    }

    // Check if assignment already exists
    const existingAssignment = await db
      .select()
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.userId, insertUserRoleAssignment.userId),
          eq(
            userRoleAssignments.companyRoleId,
            insertUserRoleAssignment.companyRoleId,
          ),
        ),
      );

    if (existingAssignment.length > 0) {
      throw new Error("User is already assigned to this role");
    }

    const [userRoleAssignment] = await db
      .insert(userRoleAssignments)
      .values(insertUserRoleAssignment)
      .returning();
    return userRoleAssignment;
  }

  async updateUserRoleAssignment(
    id: string,
    updates: Partial<InsertUserRoleAssignment>,
  ): Promise<UserRoleAssignment | undefined> {
    // If updating userId, verify the new user exists
    if (updates.userId) {
      const user = await this.getUser(updates.userId);
      if (!user) {
        throw new Error("User not found");
      }
    }

    // If updating companyRoleId, verify the new role exists
    if (updates.companyRoleId) {
      const companyRole = await this.getCompanyRole(updates.companyRoleId);
      if (!companyRole) {
        throw new Error("Company role not found");
      }
    }

    const [userRoleAssignment] = await db
      .update(userRoleAssignments)
      .set(updates)
      .where(eq(userRoleAssignments.id, id))
      .returning();
    return userRoleAssignment || undefined;
  }

  async deleteUserRoleAssignment(id: string): Promise<boolean> {
    const result = await db
      .delete(userRoleAssignments)
      .where(eq(userRoleAssignments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Release methods
  async getReleases(companyContext?: string): Promise<Release[]> {
    // If no company context provided, return empty results for security
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(releases)
      .where(eq(releases.companyId, companyContext))
      .orderBy(releases.order);
  }

  async getRelease(
    id: string,
    companyContext?: string,
  ): Promise<Release | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [release] = await db
      .select()
      .from(releases)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)));
    return release || undefined;
  }

  async createRelease(insertRelease: InsertRelease): Promise<Release> {
    const [release] = await db
      .insert(releases)
      .values(insertRelease)
      .returning();
    return release;
  }

  async updateRelease(
    id: string,
    updates: Partial<InsertRelease>,
    companyContext?: string,
  ): Promise<Release | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [release] = await db
      .update(releases)
      .set(allowedUpdates)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)))
      .returning();
    return release || undefined;
  }

  async deleteRelease(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(releases)
      .where(and(eq(releases.id, id), eq(releases.companyId, companyContext)));
    return (result.rowCount ?? 0) > 0;
  }

  // Unit of Measure methods
  async getUnitOfMeasures(): Promise<UnitOfMeasure[]> {
    return await db
      .select()
      .from(unitOfMeasures)
      .orderBy(unitOfMeasures.type, unitOfMeasures.uomName);
  }

  async getUnitOfMeasure(id: string): Promise<UnitOfMeasure | undefined> {
    const [unitOfMeasure] = await db
      .select()
      .from(unitOfMeasures)
      .where(and(eq(unitOfMeasures.id, id)));
    return unitOfMeasure || undefined;
  }

  async createUnitOfMeasure(
    insertUnitOfMeasure: InsertUnitOfMeasure,
  ): Promise<UnitOfMeasure> {
    const [unitOfMeasure] = await db
      .insert(unitOfMeasures)
      .values(insertUnitOfMeasure)
      .returning();
    return unitOfMeasure;
  }

  async updateUnitOfMeasure(
    id: string,
    updates: Partial<InsertUnitOfMeasure>,
  ): Promise<UnitOfMeasure | undefined> {
    const [unitOfMeasure] = await db
      .update(unitOfMeasures)
      .set(updates)
      .where(eq(unitOfMeasures.id, id))
      .returning();
    return unitOfMeasure || undefined;
  }

  async deleteUnitOfMeasure(
    id: string,
    companyContext?: string,
  ): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(unitOfMeasures)
      .where(
        and(
          eq(unitOfMeasures.id, id),
          eq(unitOfMeasures.companyId, companyContext),
        ),
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Product methods
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

  // Language methods (Global - no company context filtering)
  async getLanguages(): Promise<Language[]> {
    return await db
      .select()
      .from(languages)
      .orderBy(languages.languageName);
  }

  async getLanguage(id: string): Promise<Language | undefined> {
    const [language] = await db
      .select()
      .from(languages)
      .where(eq(languages.id, id));
    return language || undefined;
  }

  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const [language] = await db
      .insert(languages)
      .values(insertLanguage)
      .returning();
    return language;
  }

  async updateLanguage(
    id: string,
    updates: Partial<InsertLanguage>,
  ): Promise<Language | undefined> {
    const [language] = await db
      .update(languages)
      .set(updates)
      .where(eq(languages.id, id))
      .returning();
    return language || undefined;
  }

  async deleteLanguage(id: string): Promise<boolean> {
    const result = await db
      .delete(languages)
      .where(eq(languages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Translation methods (Global - no company context filtering)
  async getTranslations(): Promise<Translation[]> {
    return await db
      .select()
      .from(translations)
      .orderBy(translations.labelCode);
  }

  async getTranslation(id: string): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(eq(translations.id, id));
    return translation || undefined;
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    return translation;
  }

  async updateTranslation(
    id: string,
    updates: Partial<InsertTranslation>,
  ): Promise<Translation | undefined> {
    const [translation] = await db
      .update(translations)
      .set(updates)
      .where(eq(translations.id, id))
      .returning();
    return translation || undefined;
  }

  async deleteTranslation(id: string): Promise<boolean> {
    const result = await db
      .delete(translations)
      .where(eq(translations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Row Level Security context methods
  async setCompanyContext(userId: string): Promise<void> {
    // Get user record to find their company_id
    const user = await this.getUser(userId);
    if (!user || !user.companyId) {
      throw new Error("User not found or has no company association");
    }

    // Update user's company_context field to their company_id
    await db
      .update(users)
      .set({
        companyContext: user.companyId,
      })
      .where(eq(users.id, userId));

    // Set session variable for RLS policies to identify current user
    await pool.query(`SET LOCAL app.current_user_id = '${userId}'`);

    console.log(
      "[RLS DEBUG] Set company context for user:",
      userId,
      "to company:",
      user.companyId,
    );
  }

  async clearCompanyContext(userId: string): Promise<void> {
    // Clear user's company_context field
    await db
      .update(users)
      .set({
        companyContext: null,
      })
      .where(eq(users.id, userId));

    console.log("[RLS DEBUG] Cleared company context for user:", userId);
  }

  // Transaction-scoped operations for RLS
  async runWithCompanyContext<T>(
    companyId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      // Set company context using SET LOCAL (transaction-scoped)
      await tx.execute(`SET LOCAL app.current_company_id = '${companyId}'`);

      // Execute the operation within this transaction
      return await operation();
    });
  }
}

export const storage = new DatabaseStorage();
