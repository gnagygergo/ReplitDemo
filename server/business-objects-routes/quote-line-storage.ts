import { db } from "../db";
import { quoteLines, quotes } from "@shared/schema";
import type { QuoteLine, InsertQuoteLine } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export class QuoteLineStorage {
  async getQuoteLines(): Promise<QuoteLine[]> {
    return await db.select().from(quoteLines);
  }

  async getQuoteLine(id: string): Promise<QuoteLine | undefined> {
    const [quoteLine] = await db
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.id, id));
    return quoteLine || undefined;
  }

  async getQuoteLinesByQuote(quoteId: string): Promise<QuoteLine[]> {
    return await db
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId));
  }

  async createQuoteLine(quoteLine: InsertQuoteLine): Promise<QuoteLine> {
    const [newQuoteLine] = await db
      .insert(quoteLines)
      .values(quoteLine)
      .returning();
    return newQuoteLine;
  }

  async updateQuoteLine(
    id: string,
    updates: Partial<InsertQuoteLine>,
  ): Promise<QuoteLine | undefined> {
    const [quoteLine] = await db
      .update(quoteLines)
      .set(updates)
      .where(eq(quoteLines.id, id))
      .returning();
    return quoteLine || undefined;
  }

  async deleteQuoteLine(id: string): Promise<boolean> {
    const result = await db
      .delete(quoteLines)
      .where(eq(quoteLines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async batchCreateOrUpdate(
    quoteId: string,
    lines: Array<Partial<InsertQuoteLine> & { id?: string }>,
  ): Promise<QuoteLine[]> {
    const results: QuoteLine[] = [];

    for (const line of lines) {
      if (line.id) {
        const updated = await this.updateQuoteLine(line.id, {
          ...line,
          quoteId,
        });
        if (updated) {
          results.push(updated);
        }
      } else {
        const created = await this.createQuoteLine({
          ...line,
          quoteId,
        } as InsertQuoteLine);
        results.push(created);
      }
    }

    return results;
  }

  async batchDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await db
      .delete(quoteLines)
      .where(inArray(quoteLines.id, ids));
    return result.rowCount ?? 0;
  }
}
