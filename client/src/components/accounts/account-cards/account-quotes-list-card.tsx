// This Card is used on the Account Detail View.
// It shows Quote list related to the Account.

import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AccountWithOwner,
  type InsertAccount,
  insertAccountSchema,
  type User,
  type OpportunityWithAccountAndOwner,
  type Quote,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Edit,
  Save,
  X,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Plus,
  User as UserIcon,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Fetch account data
const { data: account, isLoading: isLoadingAccount } =
  useQuery<AccountWithOwner>({
    queryKey: ["/api/accounts", params?.id],
    enabled: !!params?.id,
  });

// Fetch quotes for this account
const { data: quotes = [], isLoading: isLoadingQuotes } = useQuery<Quote[]>({
  queryKey: ["/api/accounts", params?.id, "quotes"],
  enabled: !!params?.id,
});

interface AccountDetailQuotesListCardProps {
  account: AccountWithOwner;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  selectedOwner: User | null;
  setShowUserLookup: (show: boolean) => void;
  getUserInitials: (user: User) => string;
  getUserDisplayName: (user: User) => string;
}

export default function AccountDetailQuotesListCard({
  account,
  isEditing,
  form,
  updateMutation,
  selectedOwner,
  setShowUserLookup,
  getUserInitials,
  getUserDisplayName,
}: AccountDetailQuotesListCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span>Quotes</span>
            <Badge variant="secondary" className="ml-2">
              {quotes.length}
            </Badge>
          </CardTitle>
          <Link
            href={`/quotes/new?customerId=${params?.id}&accountName=${encodeURIComponent(account?.name || "")}`}
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingQuotes ? (
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
                  <TableHead>Customer Name</TableHead>
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
                      data-testid={`text-quote-customer-name-${quote.id}`}
                    >
                      {quote.customerName || "N/A"}
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
