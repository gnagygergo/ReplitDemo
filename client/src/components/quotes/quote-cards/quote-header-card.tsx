import { FileSpreadsheet } from "lucide-react";

interface QuoteHeaderCardProps {
  quoteName: string | null;
  isNewQuote: boolean;
}

export default function QuoteHeaderCard({ quoteName, isNewQuote }: QuoteHeaderCardProps) {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1
            className="text-3xl font-bold text-foreground"
            data-testid="text-quote-name"
          >
            {isNewQuote ? "New Quote" : quoteName}
          </h1>
          <p className="text-muted-foreground">Quote Details</p>
        </div>
      </div>
    </div>
  );
}
