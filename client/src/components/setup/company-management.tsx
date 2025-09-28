import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type {
  Company as CompanyType,
  User as UserType,
  InsertCompany,
} from "@shared/schema";

const companySchema = z.object({
  companyOfficialName: z.string().min(1, "Company official name is required"),
  companyAlias: z.string().optional(),
  companyRegistrationId: z.string().optional(),
});

type CompanyForm = z.infer<typeof companySchema>;

function CompanyEditDialog({
  company,
  onClose,
}: {
  company: CompanyType;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyOfficialName: company.companyOfficialName || "",
      companyAlias: company.companyAlias || "",
      companyRegistrationId: company.companyRegistrationId || "",
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyForm) => {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Success",
        description: "Company updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update company",
      });
    },
  });

  const onSubmit = (data: CompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Company</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyOfficialName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Official Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company official name"
                    {...field}
                    data-testid="input-company-official-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyAlias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Alias</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company alias (optional)"
                    {...field}
                    data-testid="input-company-alias"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyRegistrationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Registration ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter registration ID (optional)"
                    {...field}
                    data-testid="input-company-registration-id"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateCompanyMutation.isPending}
              data-testid="button-update-company"
            >
              {updateCompanyMutation.isPending
                ? "Updating..."
                : "Update Company"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function CompanyCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyOfficialName: "",
      companyAlias: "",
      companyRegistrationId: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyForm) => {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Success",
        description: "Company created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create company",
      });
    },
  });

  const onSubmit = (data: CompanyForm) => {
    createCompanyMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Company</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyOfficialName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Official Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company official name"
                    {...field}
                    data-testid="input-create-company-official-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyAlias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Alias</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter company alias (optional)"
                    {...field}
                    data-testid="input-create-company-alias"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyRegistrationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Registration ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter registration ID (optional)"
                    {...field}
                    data-testid="input-create-company-registration-id"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createCompanyMutation.isPending}
              data-testid="button-create-company-submit"
            >
              {createCompanyMutation.isPending
                ? "Creating..."
                : "Create Company"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function CompanyManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCompany, setEditingCompany] = useState<CompanyType | null>(
    null,
  );
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<CompanyType[]>({
    queryKey: ["/api/companies"],
  });

  // Fetch users for the selected company
  const { data: selectedCompanyUsers = [], isLoading: isLoadingUsers } =
    useQuery<UserType[]>({
      queryKey: ["/api/companies", selectedCompanyId, "users"],
      enabled: !!selectedCompanyId,
    });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      // DELETE returns 204 No Content, so don't try to parse JSON
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete company",
      });
    },
  });

  const filteredCompanies = companies.filter((company: CompanyType) => {
    const query = searchQuery.toLowerCase();
    return (
      company.companyOfficialName?.toLowerCase().includes(query) ||
      company.companyAlias?.toLowerCase().includes(query) ||
      company.companyRegistrationId?.toLowerCase().includes(query)
    );
  });

  const handleDeleteCompany = (companyId: string) => {
    deleteCompanyMutation.mutate(companyId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Companies</h3>
            <p className="text-sm text-muted-foreground">
              Manage company information and details
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading companies...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Companies</h3>
          <p className="text-sm text-muted-foreground">
            Manage company information and select a company to view its users
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingCompany(true)}
          data-testid="button-create-company"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-2 gap-6 h-[600px]">
        {/* Left Pane - Companies */}
        <div className="space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-company-search"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company List */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px] overflow-y-auto">
              {filteredCompanies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>
                    {searchQuery
                      ? "No companies match your search"
                      : "No companies found"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company: CompanyType) => (
                      <TableRow
                        key={company.id}
                        data-testid={`company-row-${company.id}`}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedCompanyId === company.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedCompanyId(company.id)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span
                                data-testid={`text-company-name-${company.id}`}
                              >
                                {company.companyOfficialName}
                              </span>
                              {company.companyAlias && (
                                <div className="text-xs text-muted-foreground">
                                  {company.companyAlias}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCompany(company);
                              }}
                              data-testid={`button-edit-company-${company.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`button-delete-company-${company.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Company
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {company.companyOfficialName}"? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteCompany(company.id)
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-testid={`button-confirm-delete-company-${company.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane - Users for Selected Company */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCompanyId
                ? `Users in ${companies.find((c) => c.id === selectedCompanyId)?.companyOfficialName || "Selected Company"}`
                : "Company Users"}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] overflow-y-auto">
            {!selectedCompanyId ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Select a company to view its users</p>
              </div>
            ) : isLoadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-pulse">Loading users...</div>
              </div>
            ) : selectedCompanyUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No users found for this company</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCompanyUsers.map((user: UserType) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <span data-testid={`text-user-name-${user.id}`}>
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email?.split("@")[0] || "User"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-user-email-${user.id}`}>
                        {user.email}
                      </TableCell>
                      <TableCell data-testid={`text-user-admin-${user.id}`}>
                        {user.isGlobalAdmin ? (
                          <span className="text-green-600 font-medium">
                            Global Admin
                          </span>
                        ) : user.isAdmin ? (
                          <span className="text-blue-600 font-medium">
                            Admin
                          </span>
                        ) : (
                          <span className="text-muted-foreground">User</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Company Dialog */}
      {isCreatingCompany && (
        <Dialog open={isCreatingCompany} onOpenChange={setIsCreatingCompany}>
          <CompanyCreateDialog onClose={() => setIsCreatingCompany(false)} />
        </Dialog>
      )}

      {/* Edit Company Dialog */}
      {editingCompany && (
        <Dialog
          open={!!editingCompany}
          onOpenChange={() => setEditingCompany(null)}
        >
          <CompanyEditDialog
            company={editingCompany}
            onClose={() => setEditingCompany(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
