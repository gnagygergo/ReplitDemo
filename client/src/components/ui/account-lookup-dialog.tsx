import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { type Account } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AccountLookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  selectedAccountId?: string;
}

export default function AccountLookupDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedAccountId 
}: AccountLookupDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(selectedAccountId || "");

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
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
    account.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.industry.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Account Lookup</DialogTitle>
          <DialogDescription>
            Search and select an account to associate with this opportunity.
          </DialogDescription>
        </DialogHeader>

        {/* Search Box */}
        <div className="flex items-center space-x-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts by name, address, or industry..."
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
                  <TableHead>Account Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Industry</TableHead>
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
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                          className="cursor-pointer text-muted-foreground"
                          data-testid={`text-account-address-${account.id}`}
                        >
                          {account.address || 'No address'}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={account.id} 
                          className="cursor-pointer"
                          data-testid={`text-account-industry-${account.id}`}
                        >
                          {account.industry}
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