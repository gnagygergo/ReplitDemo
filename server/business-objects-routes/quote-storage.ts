//Quote Storage - methods don't contain specific fields. This is a generic storage class, meeting standardization requirements.
import { db } from "../db";
import { quotes } from "@shared/schema";
import type { Quote, InsertQuote } from "@shared/schema";
import { eq, and, getTableColumns, asc, desc, sql } from "drizzle-orm";

export class QuoteStorage {
  async getQuotes(companyContext?: string, sortBy?: string, sortOrder?: string): Promise<Quote[]> {
    if (!companyContext) {
      return [];
    }

    let query = db
      .select(getTableColumns(quotes))
      .from(quotes)
      .where(eq(quotes.companyId, companyContext));

    // Apply sorting if provided
    if (sortBy) {
      const column = (quotes as any)[sortBy];
      if (column) {
        query = query.orderBy(sortOrder === 'desc' ? desc(column) : asc(column)) as any;
      } else {
        query = query.orderBy(quotes.name) as any;
      }
    } else {
      query = query.orderBy(quotes.name) as any;
    }

    return await query;
  }
  
  async getQuotesByCustomer(customerId: string, companyContext?: string): Promise<Quote[]> {
    if (!companyContext) {
      return [];
    }

    const result = await db
      .select(getTableColumns(quotes))
      .from(quotes)
      .where(and(eq(quotes.customerId, customerId), eq(quotes.companyId, companyContext)))
      .orderBy(quotes.name);

    return result;
  }
  
  async updateQuoteTotals(quoteId: string, companyContext?: string): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Just return the quote - totals are calculated dynamically in the query
    const [quote] = await db
      .select(getTableColumns(quotes))
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyContext)));

    return quote;
  }

  async getQuote(id: string, companyContext?: string): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [quote] = await db
      .select(getTableColumns(quotes))
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.companyId, companyContext)));

    return quote;
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db
      .insert(quotes)
      .values(insertQuote as any)
      .returning();
    return quote;
  }

  async updateQuote(
    id: string,
    updates: Partial<InsertQuote>,
    companyContext?: string,
  ): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Remove companyId from updates - it cannot be changed once set
    const { companyId, ...allowedUpdates } = updates as any;

    const [quote] = await db
      .update(quotes)
      .set(allowedUpdates)
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
}
