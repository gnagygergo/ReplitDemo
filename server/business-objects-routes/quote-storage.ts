import { db } from "../db";
import { quotes } from "@shared/schema";
import type {
  Quote,
  InsertQuote,
  AccountWithOwner,
  Company,
  User,
} from "@shared/schema";
import { eq, and, asc, desc } from "drizzle-orm";

export class QuoteStorage {
  private getAccount: (id: string) => Promise<AccountWithOwner | undefined>;
  private getCompany: (id: string) => Promise<Company | undefined>;
  private getUser: (id: string) => Promise<User | undefined>;

  constructor(
    getAccountFn: (id: string) => Promise<AccountWithOwner | undefined>,
    getCompanyFn: (id: string) => Promise<Company | undefined>,
    getUserFn: (id: string) => Promise<User | undefined>,
  ) {
    this.getAccount = getAccountFn;
    this.getCompany = getCompanyFn;
    this.getUser = getUserFn;
  }

  async getQuotes(companyContext?: string, sortBy?: string, sortOrder?: string): Promise<Quote[]> { // Added sortBy, sortOrder for sorting capability on Tables
    if (!companyContext) {
      return [];
    }

    // Added for sorting capability on Tables - Determine sort column - default to 'createdDate'
    let sortColumn;
    if (sortBy === 'quoteName') {
      sortColumn = quotes.quoteName;
    } else if (sortBy === 'quoteExpirationDate') {
      sortColumn = quotes.quoteExpirationDate;
    } else {
      sortColumn = quotes.createdDate;
    }

    // Added for sorting capability on Tables - Determine sort direction - default to 'desc' for createdDate
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.companyId, companyContext))
      .orderBy(orderDirection(sortColumn)); // Added for sorting capability on Tables
  }

  async getQuote(
    id: string,
    companyContext?: string,
  ): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.companyId, companyContext)));
    return quote || undefined;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    // If customerId is provided, auto-populate customer fields from Account
    if (quote.customerId && quote.customerId.trim() !== "") {
      const account = await this.getAccount(quote.customerId);
      if (account) {
        quote.customerName = account.name;
        quote.customerAddress = account.address;
      }
    }

    // If companyId is provided, auto-populate seller fields from Company
    if (quote.companyId && quote.companyId.trim() !== "") {
      const company = await this.getCompany(quote.companyId);
      if (company) {
        quote.sellerName = company.companyOfficialName;
        quote.sellerBankAccount = company.bankAccountNumber;
        quote.sellerAddress = company.address;
      }
    }

    // If createdBy is provided, auto-populate seller phone and email from User
    if (quote.createdBy && quote.createdBy.trim() !== "") {
      const user = await this.getUser(quote.createdBy);
      if (user) {
        quote.sellerPhone = user.phone;
        quote.sellerEmail = user.email;
      }
    }

    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  async updateQuote(
    id: string,
    updates: Partial<InsertQuote>,
    companyContext?: string,
  ): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [quote] = await db
      .update(quotes)
      .set(updates)
      .where(and(eq(quotes.id, id), eq(quotes.companyId, companyContext)))
      .returning();
    return quote || undefined;
  }

  async deleteQuote(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.companyId, companyContext)));
    return (result.rowCount ?? 0) > 0;
  }

  async getQuotesByCustomer(
    customerId: string,
    companyContext?: string,
  ): Promise<Quote[]> {
    if (!companyContext) {
      return [];
    }

    return await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.customerId, customerId),
          eq(quotes.companyId, companyContext),
        ),
      )
      .orderBy(quotes.createdDate);
  }
}
