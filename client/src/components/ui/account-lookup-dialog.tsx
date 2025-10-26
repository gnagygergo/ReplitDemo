import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building } from "lucide-react";
import { type AccountWithOwner } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface AccountLookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (account: AccountWithOwner) => void;
  selectedAccountId?: string;
  filters?: {
    isLegalEntity?: boolean;
    isPersonAccount?: boolean;
    isSelfEmployed?: boolean;
  };
}

export default function AccountLookupDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedAccountId,
  filters
}: AccountLookupDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(selectedAccountId || "");

  // Build query key and params based on filters
  const hasFilters = filters && (filters.isLegalEntity || filters.isPersonAccount || filters.isSelfEmployed);
  
  // Build the query URL with proper query parameters
  const buildQueryUrl = () => {
    if (!hasFilters) {
      return "/api/accounts";
    }
    
    const params = new URLSearchParams();
    if (filters?.isLegalEntity) params.append('isLegalEntity', 'true');
    if (filters?.isPersonAccount) params.append('isPersonAccount', 'true');
    if (filters?.isSelfEmployed) params.append('isSelfEmployed', 'true');
    
    return `/api/accounts/search?${params.toString()}`;
  };

  const queryKey = hasFilters 
    ? ["/api/accounts/search", filters]
    : ["/api/accounts"];

  const { data: accounts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildQueryUrl());
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      return response.json();
    },
    enabled: open,
  });

  // Update selected ID when prop changes
  useEffect(() => {
    setSelectedId(selectedAccountId || "");
  }, [selectedAccountId]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredAccounts = accounts.filter((account) =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (account.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    const selectedAccount = accounts.find(account => account.id === selectedId);
    if (selectedAccount) {
      onSelect(selectedAccount);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handleRowClick = (accountId: string) => {
    setSelectedId(accountId);
  };

  const getIndustryBadge = (industry: string) => {
    const variants = {
      tech: "bg-blue-100 text-blue-800",
      construction: "bg-orange-100 text-orange-800",
      services: "bg-green-100 text-green-800",
    };
    
    const labels = {
      tech: "Technology",
      construction: "Construction", 
      services: "Services",
    };

    return (
      <Badge className={variants[industry as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {labels[industry as keyof typeof labels] || industry}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Account Lookup</DialogTitle>
          <DialogDescription>
            Search and select an account to assign as the customer.
          </DialogDescription>
        </DialogHeader>

        {/* Search Box */}
        <div className="flex items-center space-x-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-accounts"
              autoFocus
            />
          </div>
        </div>

        {/* Account Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      {searchTerm ? `No accounts found matching "${searchTerm}"` : "No accounts available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow
                      key={account.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedId === account.id ? 'bg-muted/30' : ''}`}
                      onClick={() => handleRowClick(account.id)}
                      data-testid={`row-account-${account.id}`}
                    >
                      <TableCell>
                        <RadioGroupItem 
                          value={account.id} 
                          id={account.id}
                          data-testid={`radio-account-${account.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building className="w-4 h-4 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={account.id} 
                          className="font-medium cursor-pointer"
                          data-testid={`text-account-name-${account.id}`}
                        >
                          {account.name}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={account.id} 
                          className="cursor-pointer"
                        >
                          {account.industry ? getIndustryBadge(account.industry) : <Badge className="bg-gray-100 text-gray-800">No Industry</Badge>}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={account.id} 
                          className="cursor-pointer text-muted-foreground"
                        >
                          {account.address || 'No address'}
                        </Label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            data-testid="button-cancel-lookup"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedId || isLoading}
            data-testid="button-select-account"
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
