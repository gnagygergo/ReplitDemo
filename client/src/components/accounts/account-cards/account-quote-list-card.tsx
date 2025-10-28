import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileSpreadsheet, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Quote } from "@shared/schema";

interface AccountQuoteListCardProps {
  accountId: string;
  accountName: string;
  isEditing: boolean;
}

export default function AccountQuoteListCard({
  accountId,
  accountName,
  isEditing,
}: AccountQuoteListCardProps) {
  // Fetch quotes for this account
  const { data: quotes = [], isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/accounts", accountId, "quotes"],
    enabled: !!accountId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Quotes</span>
            <Badge variant="secondary" className="ml-2" data-testid="badge-quotes-count">
              {quotes.length}
            </Badge>
          </CardTitle>
          {!isEditing && (
            <Link
              href={`/quotes/new?customerId=${accountId}&accountName=${encodeURIComponent(accountName)}`}
            >
              <Button
                size="sm"
                className="flex items-center space-x-1"
                data-testid="button-new-quote-from-account"
              >
                <Plus className="w-4 h-4" />
                <span>New Quote</span>
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading quotes...</div>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No quotes found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote Name</TableHead>
                  <TableHead>Expiration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((quote) => (
                  <TableRow
                    key={quote.id}
                    data-testid={`row-quote-${quote.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-quote-name-${quote.id}`}
                    >
                      <Link href={`/quotes/${quote.id}`}>
                        <span className="hover:text-primary cursor-pointer">
                          {quote.quoteName || "N/A"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell
                      data-testid={`text-quote-expiration-${quote.id}`}
                    >
                      {quote.quoteExpirationDate
                        ? formatDate(quote.quoteExpirationDate)
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
