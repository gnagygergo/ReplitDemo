import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Search, Filter, Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { type Account, type AccountWithOwner, type CompanySettingWithMaster } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AccountNatureType = 'privatePerson' | 'selfEmployed' | 'companyContact' | 'legalEntity' | 'shippingAddress';

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [accountNatureFilter, setAccountNatureFilter] = useState<AccountNatureType[]>([]);
  const [tempNatureSelections, setTempNatureSelections] = useState<AccountNatureType[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts", sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy, sortOrder });
      const res = await fetch(`/api/accounts?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch accounts');
      return res.json();
    },
  });

  const { data: accountSettings = [] } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/business-objects/company-settings/by-prefix", "smart_account_management_accountType"],
    queryFn: async () => {
      const response = await fetch(`/api/business-objects/company-settings/by-prefix/smart_account_management_accountType`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch account type settings");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper function to check if a setting is enabled
  const isSettingEnabled = (settingCode: string): boolean => {
    const setting = accountSettings.find(s => s.settingCode === settingCode);
    return setting?.settingValue === "TRUE";
  };

  // Helper function to toggle nature selection in temp state
  const toggleNatureSelection = (nature: AccountNatureType) => {
    setTempNatureSelections(prev =>
      prev.includes(nature)
        ? prev.filter(n => n !== nature)
        : [...prev, nature]
    );
  };

  // Apply filter selections
  const applyNatureFilter = () => {
    setAccountNatureFilter(tempNatureSelections);
    setIsFilterOpen(false);
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by account nature
    const matchesNature = accountNatureFilter.length === 0 || accountNatureFilter.some(nature => {
      switch (nature) {
        case 'privatePerson':
          return account.isPersonAccount === true;
        case 'selfEmployed':
          return account.isSelfEmployed === true;
        case 'companyContact':
          return account.isCompanyContact === true;
        case 'legalEntity':
          return account.isLegalEntity === true;
        case 'shippingAddress':
          return account.isShippingAddress === true;
        default:
          return false;
      }
    });
    
    return matchesSearch && matchesNature;
  });

  const handleDelete = (account: AccountWithOwner) => {
    if (confirm(`Are you sure you want to delete "${account.name}"?`)) {
      deleteMutation.mutate(account.id);
    }
  };
  
  const getUserDisplayName = (account: AccountWithOwner) => {
    if (!account.owner) return 'Unknown User';
    const { firstName, lastName, email } = account.owner;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return email || 'Unknown User';
  };

  const getUserInitials = (account: AccountWithOwner) => {
    if (!account.owner) return 'U';
    const { firstName, lastName, email } = account.owner;
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const handleSort = (column: string) => { // Added for sorting capability on Tables
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
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
    <>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Accounts</h2>
            <p className="text-muted-foreground mt-1">Manage your customer accounts and their information</p>
          </div>
          <Link href="/accounts/new">
            <Button 
              className="flex items-center space-x-2"
              data-testid="button-create-account"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Search Accounts</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name, address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-accounts"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="w-full md:w-64">
                <label className="block text-sm font-medium text-foreground mb-2">Nature of account</label>
                <Popover open={isFilterOpen} onOpenChange={(open) => {
                  setIsFilterOpen(open);
                  if (open) {
                    setTempNatureSelections(accountNatureFilter);
                  }
                }}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between"
                      data-testid="button-nature-filter"
                    >
                      <span className="truncate">
                        {accountNatureFilter.length === 0 
                          ? "All account types" 
                          : `${accountNatureFilter.length} selected`}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4" align="start">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {/* Private Person */}
                        {isSettingEnabled("smart_account_management_accountType_PrivatePerson_enabled") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="nature-privatePerson"
                              checked={tempNatureSelections.includes('privatePerson')}
                              onCheckedChange={() => toggleNatureSelection('privatePerson')}
                              data-testid="checkbox-filter-private-person"
                            />
                            <label 
                              htmlFor="nature-privatePerson"
                              className="text-sm cursor-pointer flex-1"
                            >
                              Private Person
                            </label>
                          </div>
                        )}

                        {/* Self Employed */}
                        {isSettingEnabled("smart_account_management_accountType_SelfEmployed_enabled") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="nature-selfEmployed"
                              checked={tempNatureSelections.includes('selfEmployed')}
                              onCheckedChange={() => toggleNatureSelection('selfEmployed')}
                              data-testid="checkbox-filter-self-employed"
                            />
                            <label 
                              htmlFor="nature-selfEmployed"
                              className="text-sm cursor-pointer flex-1"
                            >
                              Self Employed
                            </label>
                          </div>
                        )}

                        {/* Company Contact */}
                        {isSettingEnabled("smart_account_management_accountType_companyContact_enabled") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="nature-companyContact"
                              checked={tempNatureSelections.includes('companyContact')}
                              onCheckedChange={() => toggleNatureSelection('companyContact')}
                              data-testid="checkbox-filter-company-contact"
                            />
                            <label 
                              htmlFor="nature-companyContact"
                              className="text-sm cursor-pointer flex-1"
                            >
                              Company Contact
                            </label>
                          </div>
                        )}

                        {/* Legal Entity */}
                        {isSettingEnabled("smart_account_management_accountType_LegalEntity_enabled") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="nature-legalEntity"
                              checked={tempNatureSelections.includes('legalEntity')}
                              onCheckedChange={() => toggleNatureSelection('legalEntity')}
                              data-testid="checkbox-filter-legal-entity"
                            />
                            <label 
                              htmlFor="nature-legalEntity"
                              className="text-sm cursor-pointer flex-1"
                            >
                              Legal Entity
                            </label>
                          </div>
                        )}

                        {/* Shipping Address */}
                        {isSettingEnabled("smart_account_management_accountType_shipping_enabled") && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="nature-shippingAddress"
                              checked={tempNatureSelections.includes('shippingAddress')}
                              onCheckedChange={() => toggleNatureSelection('shippingAddress')}
                              data-testid="checkbox-filter-shipping-address"
                            />
                            <label 
                              htmlFor="nature-shippingAddress"
                              className="text-sm cursor-pointer flex-1"
                            >
                              Shipping Address
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <Button 
                          onClick={applyNatureFilter}
                          className="w-full"
                          data-testid="button-apply-nature-filter"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead> {/* Added for sorting capability on Tables */}
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('name')}
                      data-testid="header-sort-name"
                    >
                      <span>Account Name</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'name' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead> {/* Added for sorting capability on Tables */}
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('industry')}
                      data-testid="header-sort-industry"
                    >
                      <span>Industry</span>
                      {sortBy === 'industry' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'industry' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead> {/* Added for sorting capability on Tables */}
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('address')}
                      data-testid="header-sort-address"
                    >
                      <span>Address</span>
                      {sortBy === 'address' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'address' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="w-10 h-10 rounded-full mr-3" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="w-8 h-8 rounded-full mr-3" />
                          <div>
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Building className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || accountNatureFilter.length > 0 ? "No accounts found matching your filters" : "No accounts yet. Create your first account to get started."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-account-${account.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <Building className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <Link href={`/accounts/${account.id}`}>
                              <div className="text-sm font-medium text-foreground hover:text-primary cursor-pointer" data-testid={`link-account-name-${account.id}`}>
                                {account.name}
                              </div>
                            </Link>
                            <div className="text-sm text-muted-foreground">Account</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-industry-${account.id}`}>
                        {getIndustryBadge(account.industry)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-address-${account.id}`}>
                        {account.address || "No address provided"}
                      </TableCell>
                      <TableCell data-testid={`text-owner-${account.id}`}>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={account.owner?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(account)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {getUserDisplayName(account)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {account.owner?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Link href={`/accounts/${account.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/80"
                              data-testid={`button-edit-${account.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account)}
                            className="text-destructive hover:text-destructive/80"
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${account.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {!isLoading && filteredAccounts.length > 0 && (
            <div className="bg-muted px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAccounts.length} of {accounts.length} accounts
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
