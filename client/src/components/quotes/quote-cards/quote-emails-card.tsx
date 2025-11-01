import { type Quote } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmailPanel from "@/components/emails/email-panel";

interface QuoteEmailsCardProps {
  quote: Quote | null;
  isNewQuote: boolean;
}

export default function QuoteEmailsCard({ quote, isNewQuote }: QuoteEmailsCardProps) {
  if (isNewQuote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Save the quote first to access email functionality.</p>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return null;
  }

  return <EmailPanel parentType="Quote" parentId={quote.id} />;
}
