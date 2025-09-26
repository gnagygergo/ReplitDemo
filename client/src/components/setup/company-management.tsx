import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Building2 } from "lucide-react";
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
import type { Company as CompanyType, CompanyWithOwner, User as UserType, InsertCompany } from "@shared/schema";

const companySchema = z.object({
  companyOfficialName: z.string().min(1, "Company official name is required"),
  companyAlias: z.string().optional(),
  companyRegistrationId: z.string().optional(),
  ownerId: z.string().min(1, "Owner is required"),
});

type CompanyForm = z.infer<typeof companySchema>;

function CompanyEditDialog({ company, onClose }: { company: CompanyWithOwner; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyOfficialName: company.companyOfficialName || "",
      companyAlias: company.companyAlias || "",
      companyRegistrationId: company.companyRegistrationId || "",
      ownerId: company.ownerId,
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
                  <Input placeholder="Enter company official name" {...field} data-testid="input-company-official-name" />
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
                  <Input placeholder="Enter company alias (optional)" {...field} data-testid="input-company-alias" />
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
                  <Input placeholder="Enter registration ID (optional)" {...field} data-testid="input-company-registration-id" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-company-owner">
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateCompanyMutation.isPending} data-testid="button-update-company">
              {updateCompanyMutation.isPending ? "Updating..." : "Update Company"}
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

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyOfficialName: "",
      companyAlias: "",
      companyRegistrationId: "",
      ownerId: "",
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
                  <Input placeholder="Enter company official name" {...field} data-testid="input-create-company-official-name" />
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
                  <Input placeholder="Enter company alias (optional)" {...field} data-testid="input-create-company-alias" />
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
                  <Input placeholder="Enter registration ID (optional)" {...field} data-testid="input-create-company-registration-id" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-create-company-owner">
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCompanyMutation.isPending} data-testid="button-create-company-submit">
              {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function CompanyManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCompany, setEditingCompany] = useState<CompanyWithOwner | null>(null);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<CompanyWithOwner[]>({
    queryKey: ["/api/companies"],
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

  const filteredCompanies = companies.filter((company: CompanyWithOwner) => {
    const query = searchQuery.toLowerCase();
    return (
      company.companyOfficialName?.toLowerCase().includes(query) ||
      company.companyAlias?.toLowerCase().includes(query) ||
      company.companyRegistrationId?.toLowerCase().includes(query) ||
      company.owner?.email?.toLowerCase().includes(query)
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
            Manage company information and details
          </p>
        </div>
        <Button onClick={() => setIsCreatingCompany(true)} data-testid="button-create-company">
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, alias, or registration ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-company-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery ? "No companies match your search" : "No companies found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Official Name</TableHead>
                  <TableHead>Alias</TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company: CompanyWithOwner) => (
                  <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <span data-testid={`text-company-name-${company.id}`}>
                          {company.companyOfficialName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-company-alias-${company.id}`}>
                      {company.companyAlias || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-company-registration-${company.id}`}>
                      {company.companyRegistrationId || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-company-owner-${company.id}`}>
                      {company.owner && (company.owner.firstName || company.owner.lastName) 
                        ? `${company.owner.firstName || ""} ${company.owner.lastName || ""}`.trim()
                        : company.owner?.email || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCompany(company)}
                          data-testid={`button-edit-company-${company.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-delete-company-${company.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Company</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{company.companyOfficialName}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCompany(company.id)}
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

      {/* Create Company Dialog */}
      {isCreatingCompany && (
        <Dialog open={isCreatingCompany} onOpenChange={setIsCreatingCompany}>
          <CompanyCreateDialog onClose={() => setIsCreatingCompany(false)} />
        </Dialog>
      )}

      {/* Edit Company Dialog */}
      {editingCompany && (
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <CompanyEditDialog company={editingCompany} onClose={() => setEditingCompany(null)} />
        </Dialog>
      )}
    </div>
  );
}