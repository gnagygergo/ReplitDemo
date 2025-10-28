import { type Quote } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * QuoteFooterCard
 * View-only card that shows quote totals (netGrandTotal, grossGrandTotal).
 * Always view mode — no edit controls.
 */
interface QuoteFooterCardProps {
  quote: Quote | null;
}

export default function QuoteFooterCard({ quote }: QuoteFooterCardProps) {
  const formatAmount = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Totals</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Net Grand Total
            </label>
            <div
              className="mt-1 text-foreground"
              data-testid="text-net-grand-total-value"
            >
              {formatAmount(quote?.netGrandTotal)}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Gross Grand Total
            </label>
            <div
              className="mt-1 text-foreground"
              data-testid="text-gross-grand-total-value"
            >
              {formatAmount(quote?.grossGrandTotal)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}