import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, FileText, Pencil, ExternalLink } from "lucide-react";
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
import type { LicenceAgreementTemplate, Licence } from "@shared/schema";
import { insertLicenceAgreementTemplateSchema } from "@shared/schema";

type TemplateForm = z.infer<typeof insertLicenceAgreementTemplateSchema>;

function LicenceLookupDialog({
  onSelect,
  onClose,
}: {
  onSelect: (licence: Licence) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: licences = [] } = useQuery<Licence[]>({
    queryKey: ["/api/licences"],
  });

  const filteredLicences = licences.filter((licence) =>
    licence.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Select Licence</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search licences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-lookup-licence-search"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {filteredLicences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No licences found
            </p>
          ) : (
            filteredLicences.map((licence) => (
              <button
                key={licence.id}
                onClick={() => {
                  onSelect(licence);
                  onClose();
                }}
                className="w-full text-left p-3 hover:bg-muted rounded-lg transition-colors"
                data-testid={`button-select-licence-${licence.id}`}
              >
                <div className="font-medium">{licence.name}</div>
                {licence.description && (
                  <div className="text-sm text-muted-foreground">
                    {licence.description}
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

function TemplateDialog({ 
  template, 
  onClose 
}: { 
  template?: LicenceAgreementTemplate; 
  onClose: () => void 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!template;
  const [showLicenceLookup, setShowLicenceLookup] = useState(false);

  const { data: licences = [] } = useQuery<Licence[]>({
    queryKey: ["/api/licences"],
  });

  const form = useForm<TemplateForm>({
    resolver: zodResolver(insertLicenceAgreementTemplateSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      licenceId: template?.licenceId || "",
      agreementPeriodMonths: template?.agreementPeriodMonths || 12,
      paymentTermsDays: template?.paymentTermsDays || 30,
      gracePeriodDays: template?.gracePeriodDays || 0,
    },
  });

  const selectedLicenceId = form.watch("licenceId");
  const selectedLicence = licences.find(l => l.id === selectedLicenceId);

  const mutation = useMutation({
    mutationFn: async (data: TemplateForm) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/licence-agreement-templates/${template.id}`, data);
      }
      return await apiRequest("POST", "/api/licence-agreement-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licence-agreement-templates"] });
      toast({
        title: "Success",
        description: `Template ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} template`,
      });
    },
  });

  const onSubmit = (data: TemplateForm) => {
    mutation.mutate(data);
  };

  return (
    <>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Licence Agreement Template</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter template name"
                      {...field}
                      data-testid="input-template-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter template description"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-template-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Licence</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Select licence"
                        value={selectedLicence?.name || ""}
                        readOnly
                        data-testid="input-template-licence"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLicenceLookup(true)}
                        data-testid="button-lookup-licence"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="agreementPeriodMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-template-period"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTermsDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-template-payment-terms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gracePeriodDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-template-grace-period"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-save-template"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      {showLicenceLookup && (
        <Dialog open={showLicenceLookup} onOpenChange={setShowLicenceLookup}>
          <LicenceLookupDialog
            onSelect={(licence) => form.setValue("licenceId", licence.id)}
            onClose={() => setShowLicenceLookup(false)}
          />
        </Dialog>
      )}
    </>
  );
}

export default function LicenceAgreementTemplatesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LicenceAgreementTemplate | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; template?: LicenceAgreementTemplate }>({
    open: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<LicenceAgreementTemplate[]>({
    queryKey: ["/api/licence-agreement-templates"],
  });

  const { data: licences = [] } = useQuery<Licence[]>({
    queryKey: ["/api/licences"],
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => apiRequest("DELETE", `/api/licence-agreement-templates/${templateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licence-agreement-templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      if (selectedTemplate) {
        setSelectedTemplate(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete template",
      });
    },
  });

  const filteredTemplates = templates.filter((template: LicenceAgreementTemplate) => {
    const query = searchQuery.toLowerCase();
    const licence = licences.find(l => l.id === template.licenceId);
    return (
      template.name?.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      licence?.name?.toLowerCase().includes(query)
    );
  });

  const handleDelete = (templateId: string) => {
    deleteMutation.mutate(templateId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Licence Agreement Templates</h3>
            <p className="text-sm text-muted-foreground">
              Manage agreement templates
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading templates...</div>
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
          <h3 className="text-lg font-semibold">Licence Agreement Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage agreement templates
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ open: true })}
          data-testid="button-new-template"
        >
          <Plus className="mr-2 h-4 w-4" />
          New
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
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-template-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Templates List */}
            <Card>
              <CardHeader>
                <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No templates match your search"
                        : "No templates found"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((template: LicenceAgreementTemplate) => {
                          const licence = licences.find(l => l.id === template.licenceId);
                          return (
                            <TableRow
                              key={template.id}
                              data-testid={`row-template-${template.id}`}
                              className={selectedTemplate?.id === template.id ? "bg-muted/50" : ""}
                            >
                              <TableCell className="font-medium">
                                <button
                                  onClick={() => setSelectedTemplate(template)}
                                  className="text-left hover:underline flex items-center space-x-3 w-full"
                                  data-testid={`link-template-${template.id}`}
                                >
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div data-testid={`text-template-name-${template.id}`}>
                                      {template.name}
                                    </div>
                                    {licence && (
                                      <div className="text-xs text-muted-foreground">
                                        {licence.name}
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
                                    onClick={() => setDialogState({ open: true, template })}
                                    data-testid={`button-edit-template-${template.id}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        data-testid={`button-delete-template-${template.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(template.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          data-testid={`button-confirm-delete-template-${template.id}`}
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
            {selectedTemplate ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {selectedTemplate.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-template-description-${selectedTemplate.id}`}>
                        {selectedTemplate.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Licence</h4>
                    <p className="text-sm text-muted-foreground">
                      {licences.find(l => l.id === selectedTemplate.licenceId)?.name || "N/A"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Agreement Period</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.agreementPeriodMonths} months</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Payment Terms</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.paymentTermsDays} days</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Grace Period</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.gracePeriodDays} days</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogState({ open: true, template: selectedTemplate })}
                      data-testid="button-edit-selected-template"
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
                    <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select a template to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Create/Edit Dialog */}
      {dialogState.open && (
        <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState({ open })}>
          <TemplateDialog 
            template={dialogState.template} 
            onClose={() => setDialogState({ open: false })} 
          />
        </Dialog>
      )}
    </div>
  );
}
