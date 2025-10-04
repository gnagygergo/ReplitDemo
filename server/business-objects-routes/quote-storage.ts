import { db } from "../db";
import { quotes } from "@shared/schema";
import type { Quote, InsertQuote } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class QuoteStorage {
  async getQuotes(companyContext?: string): Promise<Quote[]> {
    if (!companyContext) {
      return [];
    }
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.companyId, companyContext))
      .orderBy(quotes.createdDate);
  }
  
  async getQuote(id: string, companyContext?: string): Promise<Quote | undefined> {
    if (!companyContext) {
      return undefined;
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.id, id),
          eq(quotes.companyId, companyContext)
        )
      );
    return quote || undefined;
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db
      .insert(quotes)
      .values(quote)
      .returning();
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
      .where(
        and(
          eq(quotes.id, id),
          eq(quotes.companyId, companyContext)
        )
      )
      .returning();
    return quote || undefined;
  }

  async deleteQuote(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    const result = await db
      .delete(quotes)
      .where(
        and(
          eq(quotes.id, id),
          eq(quotes.companyId, companyContext)
        )
      );
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
