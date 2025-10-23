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
import { Building } from "lucide-react";
import { Link } from "wouter";
import type { AccountWithOwner } from "@shared/schema";

interface AccountParentAccountsListCardProps {
  accountId: string;
}

export default function AccountParentAccountsListCard({
  accountId,
}: AccountParentAccountsListCardProps) {
  const { data: parentAccounts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts", accountId, "parents"],
    queryFn: async () => {
      const response = await fetch(`/api/accounts/${accountId}/parents`);
      if (!response.ok) throw new Error("Failed to fetch parent accounts");
      return response.json();
    },
    enabled: !!accountId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="w-5 h-5" />
          <span>Parent Accounts</span>
          <Badge variant="secondary" className="ml-2" data-testid="badge-parent-accounts-count">
            {parentAccounts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading parent accounts...</div>
          </div>
        ) : parentAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>This account has no parent accounts</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parentAccounts.map((parent) => (
                  <TableRow
                    key={parent.id}
                    data-testid={`row-parent-account-${parent.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-parent-account-name-${parent.id}`}
                    >
                      <Link href={`/accounts/${parent.id}`}>
                        <span className="hover:text-primary cursor-pointer">
                          {parent.name || "N/A"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell data-testid={`text-parent-account-industry-${parent.id}`}>
                      {parent.industry || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-parent-account-address-${parent.id}`}>
                      {parent.address || "N/A"}
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
