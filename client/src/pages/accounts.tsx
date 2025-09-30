import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Search, Filter, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { type Account, type AccountWithOwner } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AccountForm from "@/components/accounts/account-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Accounts() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts"],
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

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.address || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !industryFilter || industryFilter === "all" || account.industry === industryFilter;
    return matchesSearch && matchesIndustry;
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

  const handleCloseForm = () => {
    setShowForm(false);
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
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-account"
          >
            <Plus className="w-4 h-4" />
            <span>Create Account</span>
          </Button>
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
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-foreground mb-2">Industry</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger data-testid="select-industry-filter">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
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
                  <TableHead className="cursor-pointer hover:bg-muted/80">
                    <div className="flex items-center space-x-1">
                      <span>Account Name</span>
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/80">
                    <div className="flex items-center space-x-1">
                      <span>Industry</span>
                    </div>
                  </TableHead>
                  <TableHead>Address</TableHead>
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
                          {searchTerm || industryFilter ? "No accounts found matching your filters" : "No accounts yet. Create your first account to get started."}
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

      <AccountForm 
        open={showForm} 
        onClose={handleCloseForm}
      />
    </>
  );
}
