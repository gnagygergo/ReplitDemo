import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Search, Filter, Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { type OpportunityWithAccountAndOwner, type Account } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import OpportunityForm from "@/components/opportunities/opportunity-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Opportunities() {
  const [showForm, setShowForm] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityWithAccountAndOwner | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>('closeDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opportunities = [], isLoading } = useQuery<OpportunityWithAccountAndOwner[]>({
    queryKey: ["/api/opportunities", sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy, sortOrder });
      const res = await fetch(`/api/opportunities?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error('Failed to fetch opportunities');
      return res.json();
    },
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/opportunities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Opportunity deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete opportunity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch = opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = !accountFilter || accountFilter === "all" || opportunity.accountId === accountFilter;
    return matchesSearch && matchesAccount;
  });

  const handleEdit = (opportunity: OpportunityWithAccountAndOwner) => {
    setEditingOpportunity(opportunity);
    setShowForm(true);
  };

  const handleDelete = (opportunity: OpportunityWithAccountAndOwner) => {
    if (confirm(`Are you sure you want to delete "${opportunity.name}"?`)) {
      deleteMutation.mutate(opportunity.id);
    }
  };
  
  const getUserDisplayName = (opportunity: OpportunityWithAccountAndOwner) => {
    if (!opportunity.owner) return 'Unknown User';
    const { firstName, lastName, email } = opportunity.owner;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return email || 'Unknown User';
  };

  const getUserInitials = (opportunity: OpportunityWithAccountAndOwner) => {
    if (!opportunity.owner) return 'U';
    const { firstName, lastName, email } = opportunity.owner;
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOpportunity(undefined);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Opportunities</h2>
            <p className="text-muted-foreground mt-1">Track and manage your sales opportunities</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-opportunity"
          >
            <Plus className="w-4 h-4" />
            <span>Create Opportunity</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Search Opportunities</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name, account..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-opportunities"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-foreground mb-2">Account</label>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger data-testid="select-account-filter">
                    <SelectValue placeholder="All Accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
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
                  <TableHead>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('name')}
                      data-testid="header-sort-name"
                    >
                      <span>Opportunity Name</span>
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'name' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('closeDate')}
                      data-testid="header-sort-closeDate"
                    >
                      <span>Close Date</span>
                      {sortBy === 'closeDate' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'closeDate' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => handleSort('totalRevenue')}
                      data-testid="header-sort-totalRevenue"
                    >
                      <span>Total Revenue</span>
                      {sortBy === 'totalRevenue' && (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sortBy !== 'totalRevenue' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
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
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
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
                ) : filteredOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Target className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || accountFilter ? "No opportunities found matching your filters" : "No opportunities yet. Create your first opportunity to get started."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-opportunity-${opportunity.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Target className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground" data-testid={`text-opportunity-name-${opportunity.id}`}>
                              {opportunity.name}
                            </div>
                            <div className="text-sm text-muted-foreground">Opportunity</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-account-${opportunity.id}`}>
                        {opportunity.account.name}
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-close-date-${opportunity.id}`}>
                        {formatDate(opportunity.closeDate)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-green-600" data-testid={`text-revenue-${opportunity.id}`}>
                        {formatCurrency(opportunity.totalRevenue)}
                      </TableCell>
                      <TableCell data-testid={`text-owner-${opportunity.id}`}>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={opportunity.owner?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(opportunity)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {getUserDisplayName(opportunity)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {opportunity.owner?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(opportunity)}
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-edit-${opportunity.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(opportunity)}
                            className="text-destructive hover:text-destructive/80"
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${opportunity.id}`}
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
          {!isLoading && filteredOpportunities.length > 0 && (
            <div className="bg-muted px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredOpportunities.length} of {opportunities.length} opportunities
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

      <OpportunityForm 
        open={showForm} 
        onClose={handleCloseForm} 
        opportunity={editingOpportunity}
      />
    </>
  );
}
