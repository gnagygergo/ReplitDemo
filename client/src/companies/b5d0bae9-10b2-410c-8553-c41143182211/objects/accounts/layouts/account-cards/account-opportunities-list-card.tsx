import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp } from "lucide-react";
import type { OpportunityWithAccountAndOwner } from "@shared/schema";

interface AccountOpportunitiesListCardProps {
  accountId: string;
  isEditing: boolean;
}

export default function AccountOpportunitiesListCard({
  accountId,
  isEditing,
}: AccountOpportunitiesListCardProps) {
  // Fetch opportunities for this account
  const { data: opportunities = [], isLoading } =
    useQuery<OpportunityWithAccountAndOwner[]>({
      queryKey: ["/api/accounts", accountId, "opportunities"],
      enabled: !!accountId,
    });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          <span>Opportunities</span>
          <Badge variant="secondary" className="ml-2" data-testid="badge-opportunities-count">
            {opportunities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading opportunities...</div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No opportunities found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity Name</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opportunity) => (
                  <TableRow
                    key={opportunity.id}
                    data-testid={`row-opportunity-${opportunity.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-opportunity-name-${opportunity.id}`}
                    >
                      {opportunity.name}
                    </TableCell>
                    <TableCell
                      data-testid={`text-opportunity-close-date-${opportunity.id}`}
                    >
                      {formatDate(opportunity.closeDate)}
                    </TableCell>
                    <TableCell
                      className="text-right font-medium"
                      data-testid={`text-opportunity-revenue-${opportunity.id}`}
                    >
                      {formatCurrency(opportunity.totalRevenue)}
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
