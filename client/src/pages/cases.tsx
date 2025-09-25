import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Search, Filter, Plus, Edit, Trash2, Mail } from "lucide-react";
import { type CaseWithAccountAndOwner, type Account } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import CaseForm from "@/components/cases/case-form";
import EmailDialog from "@/components/cases/email-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Cases() {
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseWithAccountAndOwner | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailingCase, setEmailingCase] = useState<CaseWithAccountAndOwner | undefined>();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery<CaseWithAccountAndOwner[]>({
    queryKey: ["/api/cases"],
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/cases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: "Case deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete case",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = (caseItem.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.account.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = !accountFilter || accountFilter === "all" || caseItem.accountId === accountFilter;
    return matchesSearch && matchesAccount;
  });

  const handleEdit = (caseItem: CaseWithAccountAndOwner) => {
    setEditingCase(caseItem);
    setShowForm(true);
  };

  const handleDelete = (caseItem: CaseWithAccountAndOwner) => {
    const caseTitle = caseItem.subject || `Case from ${caseItem.fromEmail}`;
    if (confirm(`Are you sure you want to delete "${caseTitle}"?`)) {
      deleteMutation.mutate(caseItem.id);
    }
  };

  const handleSendEmail = (caseItem: CaseWithAccountAndOwner) => {
    setEmailingCase(caseItem);
    setShowEmailDialog(true);
  };
  
  const getUserDisplayName = (caseItem: CaseWithAccountAndOwner) => {
    if (!caseItem.owner) return 'Unknown User';
    const { firstName, lastName, email } = caseItem.owner;
    if (firstName || lastName) {
      return `${firstName || ''} ${lastName || ''}`.trim();
    }
    return email || 'Unknown User';
  };

  const getUserInitials = (caseItem: CaseWithAccountAndOwner) => {
    if (!caseItem.owner) return 'U';
    const { firstName, lastName, email } = caseItem.owner;
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
    setEditingCase(undefined);
  };

  const handleCloseEmailDialog = () => {
    setShowEmailDialog(false);
    setEmailingCase(undefined);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cases</h2>
            <p className="text-muted-foreground mt-1">Manage customer support cases and inquiries</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-case"
          >
            <Plus className="w-4 h-4" />
            <span>Create Case</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Search Cases</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by subject, email, account..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-cases"
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
                  <TableHead className="cursor-pointer hover:bg-muted/80">
                    <div className="flex items-center space-x-1">
                      <span>Subject</span>
                    </div>
                  </TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>From Email</TableHead>
                  <TableHead>Description</TableHead>
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
                        <Skeleton className="h-4 w-40" />
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
                ) : filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || accountFilter ? "No cases found matching your filters" : "No cases yet. Create your first case to get started."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((caseItem) => (
                    <TableRow key={caseItem.id} className="hover:bg-muted/50 transition-colors" data-testid={`row-case-${caseItem.id}`}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground" data-testid={`text-case-subject-${caseItem.id}`}>
                              {caseItem.subject || "No Subject"}
                            </div>
                            <div className="text-sm text-muted-foreground">Case</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-account-${caseItem.id}`}>
                        {caseItem.account.name}
                      </TableCell>
                      <TableCell className="text-sm text-foreground" data-testid={`text-from-email-${caseItem.id}`}>
                        {caseItem.fromEmail}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs" data-testid={`text-description-${caseItem.id}`}>
                        <div className="truncate">
                          {caseItem.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-owner-${caseItem.id}`}>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={caseItem.owner?.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(caseItem)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {getUserDisplayName(caseItem)}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {caseItem.owner?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendEmail(caseItem)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`button-send-email-${caseItem.id}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(caseItem)}
                            className="text-primary hover:text-primary/80"
                            data-testid={`button-edit-${caseItem.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(caseItem)}
                            className="text-destructive hover:text-destructive/80"
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${caseItem.id}`}
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
          {!isLoading && filteredCases.length > 0 && (
            <div className="bg-muted px-6 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredCases.length} of {cases.length} cases
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

      <CaseForm 
        open={showForm} 
        onClose={handleCloseForm} 
        case={editingCase}
      />

      <EmailDialog
        open={showEmailDialog}
        onClose={handleCloseEmailDialog}
        case={emailingCase}
      />
    </>
  );
}