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

  async getQuoteLinesByQuote(
    quoteId: string,
    companyContext?: string,
  ): Promise<QuoteLine[]> {
    if (!companyContext) {
      return [];
    }

    // Return quote lines only if the parent quote belongs to this company
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
      .where(and(eq(quoteLines.quoteId, quoteId), eq(quotes.companyId, companyContext)));
  }

  async createQuoteLine(
    quoteLine: InsertQuoteLine,
    companyContext?: string,
  ): Promise<QuoteLine | null> {
    if (!companyContext) {
      return null;
    }

    // Verify the parent quote belongs to this company before creating
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteLine.quoteId), eq(quotes.companyId, companyContext)));

    if (!quote) {
      return null;
    }

    const [newQuoteLine] = await db
      .insert(quoteLines)
      .values(quoteLine)
      .returning();
    return newQuoteLine;
  }

  async updateQuoteLine(
    id: string,
    updates: Partial<InsertQuoteLine>,
    companyContext?: string,
  ): Promise<QuoteLine | undefined> {
    if (!companyContext) {
      return undefined;
    }

    // First verify the quote line belongs to a quote in this company
    const existingLine = await this.getQuoteLine(id, companyContext);
    if (!existingLine) {
      return undefined;
    }

    const [quoteLine] = await db
      .update(quoteLines)
      .set(updates)
      .where(eq(quoteLines.id, id))
      .returning();
    return quoteLine || undefined;
  }

  async deleteQuoteLine(id: string, companyContext?: string): Promise<boolean> {
    if (!companyContext) {
      return false;
    }

    // First verify the quote line belongs to a quote in this company
    const existingLine = await this.getQuoteLine(id, companyContext);
    if (!existingLine) {
      return false;
    }

    const result = await db
      .delete(quoteLines)
      .where(eq(quoteLines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async batchCreateOrUpdateQuoteLines(
    quoteId: string,
    lines: Array<Partial<InsertQuoteLine> & { id?: string }>,
    companyContext?: string,
  ): Promise<QuoteLine[]> {
    if (!companyContext) {
      return [];
    }

    // Verify the parent quote belongs to this company before batch operations
    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.companyId, companyContext)));

    if (!quote) {
      return [];
    }

    const results: QuoteLine[] = [];

    for (const line of lines) {
      if (line.id) {
        const updated = await this.updateQuoteLine(
          line.id,
          {
            ...line,
            quoteId,
          },
          companyContext,
        );
        if (updated) {
          results.push(updated);
        }
      } else {
        const created = await this.createQuoteLine(
          {
            ...line,
            quoteId,
          } as InsertQuoteLine,
          companyContext,
        );
        if (created) {
          results.push(created);
        }
      }
    }

    return results;
  }

  async batchDeleteQuoteLines(
    ids: string[],
    companyContext?: string,
  ): Promise<number> {
    if (!companyContext || ids.length === 0) {
      return 0;
    }

    // Verify all quote lines belong to quotes in this company before deleting
    for (const id of ids) {
      const line = await this.getQuoteLine(id, companyContext);
      if (!line) {
        // If any line doesn't belong to this company, abort the entire batch
        return 0;
      }
    }

    const result = await db
      .delete(quoteLines)
      .where(inArray(quoteLines.id, ids));
    return result.rowCount ?? 0;
  }
}
