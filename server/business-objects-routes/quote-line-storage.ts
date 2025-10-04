import { db } from "../db";
import { quoteLines, quotes } from "@shared/schema";
import type { QuoteLine, InsertQuoteLine } from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export class QuoteLineStorage {
  async getQuoteLines(companyContext?: string): Promise<QuoteLine[]> {
    if (!companyContext) {
      return [];
    }

    // Get quote lines that belong to quotes in this company
    return await db
      .select({
        id: quoteLines.id,
        quoteId: quoteLines.quoteId,
        quoteName: quoteLines.quoteName,
        productId: quoteLines.productId,
        productName: quoteLines.productName,
        unitPrice: quoteLines.unitPrice,
        unitPriceCurrency: quoteLines.unitPriceCurrency,
        unitPriceOverride: quoteLines.unitPriceOverride,
        unitPriceDiscountPercent: quoteLines.unitPriceDiscountPercent,
        unitPriceDiscountAmount: quoteLines.unitPriceDiscountAmount,
        unitPriceDiscountedAmount: quoteLines.unitPriceDiscountedAmount,
        salesUom: quoteLines.salesUom,
        quotedQuantity: quoteLines.quotedQuantity,
        subtotalBeforeRowDiscounts: quoteLines.subtotalBeforeRowDiscounts,
        discountPercentOnSubtotal: quoteLines.discountPercentOnSubtotal,
        discountAmountOnSubtotal: quoteLines.discountAmountOnSubtotal,
        discountedSubtotal: quoteLines.discountedSubtotal,
        vatPercent: quoteLines.vatPercent,
        vatUnitAmount: quoteLines.vatUnitAmount,
        vatOnSubtotal: quoteLines.vatOnSubtotal,
        grossSubtotal: quoteLines.grossSubtotal,
      })
      .from(quoteLines)
      .innerJoin(quotes, eq(quoteLines.quoteId, quotes.id))
      .where(eq(quotes.companyId, companyContext));
  }

  async getQuoteLine(
    id: string,
    companyContext?: string,
  ): Promise<QuoteLine | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // Get quote line only if its parent quote belongs to this company
    const [quoteLine] = await db
      .select({
        id: quoteLines.id,
        quoteId: quoteLines.quoteId,
        quoteName: quoteLines.quoteName,
        productId: quoteLines.productId,
        productName: quoteLines.productName,
        unitPrice: quoteLines.unitPrice,
        unitPriceCurrency: quoteLines.unitPriceCurrency,
        unitPriceOverride: quoteLines.unitPriceOverride,
        unitPriceDiscountPercent: quoteLines.unitPriceDiscountPercent,
        unitPriceDiscountAmount: quoteLines.unitPriceDiscountAmount,
        unitPriceDiscountedAmount: quoteLines.unitPriceDiscountedAmount,
        salesUom: quoteLines.salesUom,
        quotedQuantity: quoteLines.quotedQuantity,
        subtotalBeforeRowDiscounts: quoteLines.subtotalBeforeRowDiscounts,
        discountPercentOnSubtotal: quoteLines.discountPercentOnSubtotal,
        discountAmountOnSubtotal: quoteLines.discountAmountOnSubtotal,
        discountedSubtotal: quoteLines.discountedSubtotal,
        vatPercent: quoteLines.vatPercent,
        vatUnitAmount: quoteLines.vatUnitAmount,
        vatOnSubtotal: quoteLines.vatOnSubtotal,
        grossSubtotal: quoteLines.grossSubtotal,
      })
      .from(quoteLines)
      .innerJoin(quotes, eq(quoteLines.quoteId, quotes.id))
      .where(and(eq(quoteLines.id, id), eq(quotes.companyId, companyContext)));
    return quoteLine || undefined;
  }

  async getQuoteLinesByQuote(quoteId: string): Promise<QuoteLine[]> {
    // Note: Caller should verify quote ownership before calling this
    return await db
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId));
  }

  async createQuoteLine(quoteLine: InsertQuoteLine): Promise<QuoteLine> {
    // Note: Caller should verify quote ownership before calling this
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
    // Note: Caller should verify ownership before calling this
    const [quoteLine] = await db
      .update(quoteLines)
      .set(updates)
      .where(eq(quoteLines.id, id))
      .returning();
    return quoteLine || undefined;
  }

  async deleteQuoteLine(id: string): Promise<boolean> {
    // Note: Caller should verify ownership before calling this
    const result = await db
      .delete(quoteLines)
      .where(eq(quoteLines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async batchCreateOrUpdateQuoteLines(
    quoteId: string,
    lines: Array<Partial<InsertQuoteLine> & { id?: string }>,
  ): Promise<QuoteLine[]> {
    // Note: Caller should verify quote ownership before calling this
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

  async batchDeleteQuoteLines(ids: string[]): Promise<number> {
    // Note: Caller should verify ownership before calling this
    if (ids.length === 0) {
      return 0;
    }

    const result = await db
      .delete(quoteLines)
      .where(inArray(quoteLines.id, ids));
    return result.rowCount ?? 0;
  }
}
