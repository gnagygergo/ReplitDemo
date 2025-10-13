import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Search,
  FileCheck,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type {
  LicenceAgreement,
  LicenceAgreementTemplate,
  Company,
} from "@shared/schema";
import { insertLicenceAgreementSchema } from "@shared/schema";

type AgreementForm = z.infer<typeof insertLicenceAgreementSchema>;

function TemplateLookupDialog({
  onSelect,
  onClose,
}: {
  onSelect: (template: LicenceAgreementTemplate) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: templates = [] } = useQuery<LicenceAgreementTemplate[]>({
    queryKey: ["/api/licence-agreement-templates"],
  });

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Select Template</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-lookup-template-search"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filteredTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No templates found
            </p>
          ) : (
            filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelect(template);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                data-testid={`button-select-template-${template.id}`}
              >
                <div className="font-medium">{template.name}</div>
                {template.description && (
                  <div className="text-sm text-muted-foreground">
                    {template.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {template.price} {template.currency} |{" "}
                  {template.validFrom || "No start"} -{" "}
                  {template.validTo || "No end"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </DialogContent>
  );
}

function CompanyLookupDialog({
  onSelect,
  onClose,
}: {
  onSelect: (company: Company) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const filteredCompanies = companies.filter((company) =>
    company.companyOfficialName
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Select Company</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-lookup-company-search"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No companies found
            </p>
          ) : (
            filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => {
                  onSelect(company);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                data-testid={`button-select-company-${company.id}`}
              >
                <div className="font-medium">{company.companyOfficialName}</div>
                {company.companyRegistrationId && (
                  <div className="text-sm text-muted-foreground">
                    {company.companyRegistrationId}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </DialogContent>
  );
}

function AgreementDialog({
  agreement,
  onClose,
}: {
  agreement?: LicenceAgreement;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!agreement;
  const [showTemplateLookup, setShowTemplateLookup] = useState(false);
  const [showCompanyLookup, setShowCompanyLookup] = useState(false);

  const { data: templates = [] } = useQuery<LicenceAgreementTemplate[]>({
    queryKey: ["/api/licence-agreement-templates"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const form = useForm<AgreementForm>({
    resolver: zodResolver(insertLicenceAgreementSchema),
    defaultValues: {
      licenceAgreementTemplateId: agreement?.licenceAgreementTemplateId || "",
      companyId: agreement?.companyId || "",
      validFrom: agreement?.validFrom || "",
      validTo: agreement?.validTo || "",
      price: agreement?.price ? parseFloat(agreement.price) : undefined,
      currency: agreement?.currency || "",
      licenceSeats: agreement?.licenceSeats || undefined,
    },
  });

  const selectedTemplateId = form.watch("licenceAgreementTemplateId");
  const selectedCompanyId = form.watch("companyId");
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const handleTemplateSelect = (template: LicenceAgreementTemplate) => {
    form.setValue("licenceAgreementTemplateId", template.id);
    form.setValue("validFrom", template.validFrom || "");
    form.setValue("validTo", template.validTo || "");
    form.setValue(
      "price",
      template.price ? parseFloat(template.price) : undefined,
    );
    form.setValue("currency", template.currency || "");
  };

  const mutation = useMutation({
    mutationFn: async (data: AgreementForm) => {
      if (isEditing) {
        return await apiRequest(
          "PATCH",
          `/api/licence-agreements/${agreement.id}`,
          data,
        );
      }
      return await apiRequest("POST", "/api/licence-agreements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licence-agreements"] });
      toast({
        title: "Success",
        description: `Agreement ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.message ||
          `Failed to ${isEditing ? "update" : "create"} agreement`,
      });
    },
  });

  const onSubmit = (data: AgreementForm) => {
    mutation.mutate(data);
  };

  return (
    <>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit" : "Create"} Licence Agreement
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select company"
                        value={selectedCompany?.companyOfficialName || ""}
                        readOnly
                        data-testid="input-agreement-company"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCompanyLookup(true)}
                        data-testid="button-lookup-company"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenceAgreementTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select template"
                        value={selectedTemplate?.name || ""}
                        readOnly
                        data-testid="input-agreement-template"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowTemplateLookup(true)}
                        data-testid="button-lookup-template"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="validFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid From</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-agreement-valid-from"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid To</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-agreement-valid-to"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                        data-testid="input-agreement-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., USD, EUR, GBP"
                        data-testid="input-agreement-currency"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenceSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>All Seats</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                        data-testid="input-agreement-all-seats"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Seats Used</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={agreement?.licenceSeatsUsed ?? ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-agreement-seats-used"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Seats Remaining</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    value={agreement?.licenceSeatsRemaining ?? ""}
                    disabled
                    className="bg-muted"
                    data-testid="input-agreement-seats-remaining"
                  />
                </FormControl>
              </FormItem>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-save-agreement"
              >
                {mutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update"
                    : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {showTemplateLookup && (
        <Dialog open={showTemplateLookup} onOpenChange={setShowTemplateLookup}>
          <TemplateLookupDialog
            onSelect={handleTemplateSelect}
            onClose={() => setShowTemplateLookup(false)}
          />
        </Dialog>
      )}

      {showCompanyLookup && (
        <Dialog open={showCompanyLookup} onOpenChange={setShowCompanyLookup}>
          <CompanyLookupDialog
            onSelect={(company) => form.setValue("companyId", company.id)}
            onClose={() => setShowCompanyLookup(false)}
          />
        </Dialog>
      )}
    </>
  );
}

export default function LicenceAgreementsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgreement, setSelectedAgreement] =
    useState<LicenceAgreement | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    agreement?: LicenceAgreement;
  }>({
    open: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agreements = [], isLoading } = useQuery<LicenceAgreement[]>({
    queryKey: ["/api/licence-agreements"],
  });

  const { data: templates = [] } = useQuery<LicenceAgreementTemplate[]>({
    queryKey: ["/api/licence-agreement-templates"],
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const deleteMutation = useMutation({
    mutationFn: (agreementId: string) =>
      apiRequest("DELETE", `/api/licence-agreements/${agreementId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licence-agreements"] });
      toast({
        title: "Success",
        description: "Agreement deleted successfully",
      });
      if (selectedAgreement) {
        setSelectedAgreement(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete agreement",
      });
    },
  });

  const filteredAgreements = agreements.filter(
    (agreement: LicenceAgreement) => {
      const query = searchQuery.toLowerCase();
      const template = templates.find(
        (t) => t.id === agreement.licenceAgreementTemplateId,
      );
      const company = companies.find((c) => c.id === agreement.companyId);
      return (
        template?.name?.toLowerCase().includes(query) ||
        company?.companyOfficialName?.toLowerCase().includes(query)
      );
    },
  );

  const handleDelete = (agreementId: string) => {
    deleteMutation.mutate(agreementId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Licence Agreements</h3>
            <p className="text-sm text-muted-foreground">
              Manage company licence agreements
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading agreements...</div>
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
          <h3 className="text-lg font-semibold">Licence Agreements</h3>
          <p className="text-sm text-muted-foreground">
            Manage company licence agreements
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ open: true })}
          data-testid="button-new-agreement"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Agreement
        </Button>
      </div>

      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Panel - List */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="space-y-4 pr-4">
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search agreements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-agreement-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agreements List */}
            <Card>
              <CardHeader>
                <CardTitle>Agreements ({filteredAgreements.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredAgreements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No agreements match your search"
                        : "No agreements found"}
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
                      {filteredAgreements.map((agreement: LicenceAgreement) => {
                        const template = templates.find(
                          (t) => t.id === agreement.licenceAgreementTemplateId,
                        );
                        const company = companies.find(
                          (c) => c.id === agreement.companyId,
                        );
                        return (
                          <TableRow
                            key={agreement.id}
                            data-testid={`row-agreement-${agreement.id}`}
                            className={
                              selectedAgreement?.id === agreement.id
                                ? "bg-muted/50"
                                : ""
                            }
                          >
                            <TableCell className="font-medium">
                              <button
                                onClick={() => setSelectedAgreement(agreement)}
                                className="text-left hover:underline flex items-center space-x-3 w-full"
                                data-testid={`link-agreement-${agreement.id}`}
                              >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <FileCheck className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div
                                    data-testid={`text-agreement-company-${agreement.id}`}
                                  >
                                    {company?.companyOfficialName || "Unknown"}
                                  </div>
                                  {template && (
                                    <div className="text-xs text-muted-foreground">
                                      {template.name}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDialogState({ open: true, agreement })
                                  }
                                  data-testid={`button-edit-agreement-${agreement.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      data-testid={`button-delete-agreement-${agreement.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Agreement
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this
                                        agreement? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(agreement.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        data-testid={`button-confirm-delete-agreement-${agreement.id}`}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Panel - Detail View */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="pl-4">
            {selectedAgreement ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    {companies.find((c) => c.id === selectedAgreement.companyId)
                      ?.companyOfficialName || "Unknown"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Template</h4>
                    <p className="text-sm text-muted-foreground">
                      {templates.find(
                        (t) =>
                          t.id === selectedAgreement.licenceAgreementTemplateId,
                      )?.name || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Valid From</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgreement.validFrom || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Valid To</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgreement.validTo || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Price</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgreement.price || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Currency</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedAgreement.currency || "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">All Seats</h4>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid={`text-agreement-all-seats-${selectedAgreement.id}`}
                      >
                        {selectedAgreement.licenceSeats ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Seats Used</h4>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid={`text-agreement-seats-used-${selectedAgreement.id}`}
                      >
                        {selectedAgreement.licenceSeatsUsed ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">
                        Seats Remaining
                      </h4>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid={`text-agreement-seats-remaining-${selectedAgreement.id}`}
                      >
                        {selectedAgreement.licenceSeatsRemaining ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDialogState({
                          open: true,
                          agreement: selectedAgreement,
                        })
                      }
                      data-testid="button-edit-selected-agreement"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <FileCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select an agreement to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Create/Edit Dialog */}
      {dialogState.open && (
        <Dialog
          open={dialogState.open}
          onOpenChange={(open) => setDialogState({ open })}
        >
          <AgreementDialog
            agreement={dialogState.agreement}
            onClose={() => setDialogState({ open: false })}
          />
        </Dialog>
      )}
    </div>
  );
}
