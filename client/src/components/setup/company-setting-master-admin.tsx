import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  insertCompanySettingMasterDomainSchema,
  insertCompanySettingMasterFunctionalitySchema,
  insertCompanySettingsMasterSchema,
} from "@shared/schema";
import type {
  CompanySettingMasterDomain,
  CompanySettingMasterFunctionality,
  CompanySettingsMaster,
} from "@shared/schema";

type DomainFormData = z.infer<typeof insertCompanySettingMasterDomainSchema>;
type FunctionalityFormData = z.infer<typeof insertCompanySettingMasterFunctionalitySchema>;
type SettingsMasterFormData = z.infer<typeof insertCompanySettingsMasterSchema>;

export default function CompanySettingMasterAdmin() {
  const { toast } = useToast();
  const [domainDialogOpen, setDomainDialogOpen] = useState(false);
  const [functionalityDialogOpen, setFunctionalityDialogOpen] = useState(false);
  const [settingsMasterDialogOpen, setSettingsMasterDialogOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<CompanySettingMasterDomain | null>(null);
  const [editingFunctionality, setEditingFunctionality] = useState<CompanySettingMasterFunctionality | null>(null);
  const [editingSettingsMaster, setEditingSettingsMaster] = useState<CompanySettingsMaster | null>(null);
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("");
  const [selectedFunctionalityFilter, setSelectedFunctionalityFilter] = useState<string>("");

  // Domains Query
  const { data: domains = [], isLoading: domainsLoading } = useQuery<CompanySettingMasterDomain[]>({
    queryKey: ["/api/company-setting-master-domains"],
  });

  // Functionalities Query
  const { data: functionalities = [], isLoading: functionalitiesLoading } = useQuery<CompanySettingMasterFunctionality[]>({
    queryKey: ["/api/company-setting-master-functionalities"],
  });

  // Settings Masters Query
  const { data: settingsMasters = [], isLoading: settingsMastersLoading } = useQuery<CompanySettingsMaster[]>({
    queryKey: ["/api/company-settings-masters"],
  });

  // Domain Form
  const domainForm = useForm<DomainFormData>({
    resolver: zodResolver(insertCompanySettingMasterDomainSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  // Functionality Form
  const functionalityForm = useForm<FunctionalityFormData>({
    resolver: zodResolver(insertCompanySettingMasterFunctionalitySchema),
    defaultValues: {
      code: "",
      name: "",
      domainId: "",
    },
  });

  // Settings Master Form
  const settingsMasterForm = useForm<SettingsMasterFormData>({
    resolver: zodResolver(insertCompanySettingsMasterSchema),
    defaultValues: {
      functionalityId: "",
      settingFunctionalDomainCode: "",
      settingFunctionalDomainName: "",
      settingFunctionalityName: "",
      settingFunctionalityCode: "",
      settingCode: "",
      settingName: "",
      settingDescription: "",
      settingValues: "",
      defaultValue: "",
      articleCode: "",
    },
  });

  // Domain Mutations
  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) =>
      await apiRequest("POST", "/api/company-setting-master-domains", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-domains"] });
      toast({ title: "Domain created successfully" });
      setDomainDialogOpen(false);
      domainForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error creating domain", description: error.message, variant: "destructive" });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DomainFormData> }) =>
      await apiRequest("PATCH", `/api/company-setting-master-domains/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-domains"] });
      toast({ title: "Domain updated successfully" });
      setDomainDialogOpen(false);
      setEditingDomain(null);
      domainForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error updating domain", description: error.message, variant: "destructive" });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) =>
      await apiRequest("DELETE", `/api/company-setting-master-domains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-domains"] });
      toast({ title: "Domain deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting domain", description: error.message, variant: "destructive" });
    },
  });

  // Functionality Mutations
  const createFunctionalityMutation = useMutation({
    mutationFn: async (data: FunctionalityFormData) =>
      await apiRequest("POST", "/api/company-setting-master-functionalities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-functionalities"] });
      toast({ title: "Functionality created successfully" });
      setFunctionalityDialogOpen(false);
      functionalityForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error creating functionality", description: error.message, variant: "destructive" });
    },
  });

  const updateFunctionalityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FunctionalityFormData> }) =>
      await apiRequest("PATCH", `/api/company-setting-master-functionalities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-functionalities"] });
      toast({ title: "Functionality updated successfully" });
      setFunctionalityDialogOpen(false);
      setEditingFunctionality(null);
      functionalityForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error updating functionality", description: error.message, variant: "destructive" });
    },
  });

  const deleteFunctionalityMutation = useMutation({
    mutationFn: async (id: string) =>
      await apiRequest("DELETE", `/api/company-setting-master-functionalities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-setting-master-functionalities"] });
      toast({ title: "Functionality deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting functionality", description: error.message, variant: "destructive" });
    },
  });

  // Settings Master Mutations
  const createSettingsMasterMutation = useMutation({
    mutationFn: async (data: SettingsMasterFormData) =>
      await apiRequest("POST", "/api/company-settings-masters", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings-masters"] });
      toast({ title: "Settings master created successfully" });
      setSettingsMasterDialogOpen(false);
      settingsMasterForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error creating settings master", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingsMasterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SettingsMasterFormData> }) =>
      await apiRequest("PATCH", `/api/company-settings-masters/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings-masters"] });
      toast({ title: "Settings master updated successfully" });
      setSettingsMasterDialogOpen(false);
      setEditingSettingsMaster(null);
      settingsMasterForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error updating settings master", description: error.message, variant: "destructive" });
    },
  });

  const deleteSettingsMasterMutation = useMutation({
    mutationFn: async (id: string) =>
      await apiRequest("DELETE", `/api/company-settings-masters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings-masters"] });
      toast({ title: "Settings master deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting settings master", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleDomainSubmit = (data: DomainFormData) => {
    if (editingDomain) {
      updateDomainMutation.mutate({ id: editingDomain.id, data });
    } else {
      createDomainMutation.mutate(data);
    }
  };

  const handleFunctionalitySubmit = (data: FunctionalityFormData) => {
    if (editingFunctionality) {
      updateFunctionalityMutation.mutate({ id: editingFunctionality.id, data });
    } else {
      createFunctionalityMutation.mutate(data);
    }
  };

  const handleSettingsMasterSubmit = (data: SettingsMasterFormData) => {
    if (editingSettingsMaster) {
      updateSettingsMasterMutation.mutate({ id: editingSettingsMaster.id, data });
    } else {
      createSettingsMasterMutation.mutate(data);
    }
  };

  const handleEditDomain = (domain: CompanySettingMasterDomain) => {
    setEditingDomain(domain);
    domainForm.reset(domain);
    setDomainDialogOpen(true);
  };

  const handleEditFunctionality = (functionality: CompanySettingMasterFunctionality) => {
    setEditingFunctionality(functionality);
    functionalityForm.reset(functionality);
    setFunctionalityDialogOpen(true);
  };

  const handleEditSettingsMaster = (settingsMaster: CompanySettingsMaster) => {
    setEditingSettingsMaster(settingsMaster);
    settingsMasterForm.reset({
      functionalityId: settingsMaster.functionalityId || "",
      settingFunctionalDomainCode: settingsMaster.settingFunctionalDomainCode || "",
      settingFunctionalDomainName: settingsMaster.settingFunctionalDomainName || "",
      settingFunctionalityName: settingsMaster.settingFunctionalityName || "",
      settingFunctionalityCode: settingsMaster.settingFunctionalityCode || "",
      settingCode: settingsMaster.settingCode || "",
      settingName: settingsMaster.settingName || "",
      settingDescription: settingsMaster.settingDescription || "",
      settingValues: settingsMaster.settingValues || "",
      defaultValue: settingsMaster.defaultValue || "",
      articleCode: settingsMaster.articleCode || "",
    });
    setSettingsMasterDialogOpen(true);
  };

  const handleFunctionalityChange = (functionalityId: string) => {
    const selectedFunctionality = functionalities.find(f => f.id === functionalityId);
    if (selectedFunctionality) {
      const selectedDomain = domains.find(d => d.id === selectedFunctionality.domainId);
      if (selectedDomain) {
        settingsMasterForm.setValue("settingFunctionalDomainCode", selectedDomain.code);
        settingsMasterForm.setValue("settingFunctionalDomainName", selectedDomain.name);
      }
      settingsMasterForm.setValue("settingFunctionalityCode", selectedFunctionality.code);
      settingsMasterForm.setValue("settingFunctionalityName", selectedFunctionality.name);
    }
  };

  // Filter settings masters based on selected filters
  const filteredSettingsMasters = settingsMasters.filter((setting) => {
    // If domain filter is set and not "all", check if setting's domain matches
    if (selectedDomainFilter && selectedDomainFilter !== "all") {
      const settingFunctionality = functionalities.find(f => f.id === setting.functionalityId);
      if (!settingFunctionality || settingFunctionality.domainId !== selectedDomainFilter) {
        return false;
      }
    }

    // If functionality filter is set and not "all", check if setting's functionality matches
    if (selectedFunctionalityFilter && selectedFunctionalityFilter !== "all") {
      if (setting.functionalityId !== selectedFunctionalityFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Company Setting Master Admin</h2>
        <p className="text-muted-foreground">
          Manage functional domains, functionalities, and company settings master data
        </p>
      </div>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="domains" data-testid="tab-domains">Functional Domains</TabsTrigger>
          <TabsTrigger value="functionalities" data-testid="tab-functionalities">Functionalities</TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">Settings Master</TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Functional Domains</CardTitle>
                  <CardDescription>Manage the top-level functional domains</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingDomain(null);
                    domainForm.reset({ code: "", name: "" });
                    setDomainDialogOpen(true);
                  }}
                  data-testid="button-create-domain"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {domainsLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain) => (
                      <TableRow key={domain.id} data-testid={`row-domain-${domain.id}`}>
                        <TableCell data-testid={`text-domain-code-${domain.id}`}>{domain.code}</TableCell>
                        <TableCell data-testid={`text-domain-name-${domain.id}`}>{domain.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditDomain(domain)}
                              data-testid={`button-edit-domain-${domain.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDomainMutation.mutate(domain.id)}
                              data-testid={`button-delete-domain-${domain.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Functionalities Tab */}
        <TabsContent value="functionalities">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Functionalities</CardTitle>
                  <CardDescription>Manage functionalities within each domain</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingFunctionality(null);
                    functionalityForm.reset({ code: "", name: "", domainId: "" });
                    setFunctionalityDialogOpen(true);
                  }}
                  data-testid="button-create-functionality"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Functionality
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {functionalitiesLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {functionalities.map((functionality) => {
                      const domain = domains.find(d => d.id === functionality.domainId);
                      return (
                        <TableRow key={functionality.id} data-testid={`row-functionality-${functionality.id}`}>
                          <TableCell data-testid={`text-functionality-code-${functionality.id}`}>{functionality.code}</TableCell>
                          <TableCell data-testid={`text-functionality-name-${functionality.id}`}>{functionality.name}</TableCell>
                          <TableCell data-testid={`text-functionality-domain-${functionality.id}`}>{domain?.name || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditFunctionality(functionality)}
                                data-testid={`button-edit-functionality-${functionality.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteFunctionalityMutation.mutate(functionality.id)}
                                data-testid={`button-delete-functionality-${functionality.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </TabsContent>

        {/* Settings Master Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Company Settings Master</CardTitle>
                  <CardDescription>Manage master settings for companies</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingSettingsMaster(null);
                    settingsMasterForm.reset({
                      functionalityId: "",
                      settingFunctionalDomainCode: "",
                      settingFunctionalDomainName: "",
                      settingFunctionalityName: "",
                      settingFunctionalityCode: "",
                      settingCode: "",
                      settingName: "",
                      settingDescription: "",
                      settingValues: "",
                      defaultValue: "",
                    });
                    setSettingsMasterDialogOpen(true);
                  }}
                  data-testid="button-create-settings-master"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Setting
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Filter by Domain</label>
                  <Select
                    value={selectedDomainFilter}
                    onValueChange={setSelectedDomainFilter}
                  >
                    <SelectTrigger data-testid="select-filter-domain">
                      <SelectValue placeholder="All Domains" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="select-filter-domain-all">All Domains</SelectItem>
                      {domains.map((domain) => (
                        <SelectItem 
                          key={domain.id} 
                          value={domain.id}
                          data-testid={`select-filter-domain-${domain.id}`}
                        >
                          {domain.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Filter by Functionality</label>
                  <Select
                    value={selectedFunctionalityFilter}
                    onValueChange={setSelectedFunctionalityFilter}
                  >
                    <SelectTrigger data-testid="select-filter-functionality">
                      <SelectValue placeholder="All Functionalities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" data-testid="select-filter-functionality-all">All Functionalities</SelectItem>
                      {functionalities.map((functionality) => (
                        <SelectItem 
                          key={functionality.id} 
                          value={functionality.id}
                          data-testid={`select-filter-functionality-${functionality.id}`}
                        >
                          {functionality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDomainFilter("");
                    setSelectedFunctionalityFilter("");
                  }}
                  disabled={!selectedDomainFilter && !selectedFunctionalityFilter}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
              {settingsMastersLoading ? (
                <div>Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setting Name</TableHead>
                      <TableHead>Setting Code</TableHead>
                      <TableHead>Functionality</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSettingsMasters.map((settingsMaster) => (
                      <TableRow key={settingsMaster.id} data-testid={`row-settings-master-${settingsMaster.id}`}>
                        <TableCell data-testid={`text-settings-name-${settingsMaster.id}`}>{settingsMaster.settingName}</TableCell>
                        <TableCell data-testid={`text-settings-code-${settingsMaster.id}`}>{settingsMaster.settingCode}</TableCell>
                        <TableCell data-testid={`text-settings-functionality-${settingsMaster.id}`}>{settingsMaster.settingFunctionalityName}</TableCell>
                        <TableCell data-testid={`text-settings-domain-${settingsMaster.id}`}>{settingsMaster.settingFunctionalDomainName}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSettingsMaster(settingsMaster)}
                              data-testid={`button-edit-settings-master-${settingsMaster.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSettingsMasterMutation.mutate(settingsMaster.id)}
                              data-testid={`button-delete-settings-master-${settingsMaster.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Domain Dialog */}
      <Dialog open={domainDialogOpen} onOpenChange={setDomainDialogOpen}>
        <DialogContent data-testid="dialog-domain-form">
          <DialogHeader>
            <DialogTitle>{editingDomain ? "Edit Domain" : "Create Domain"}</DialogTitle>
            <DialogDescription>
              {editingDomain ? "Update the functional domain" : "Create a new functional domain"}
            </DialogDescription>
          </DialogHeader>
          <Form {...domainForm}>
            <form onSubmit={domainForm.handleSubmit(handleDomainSubmit)} className="space-y-4">
              <FormField
                control={domainForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-domain-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={domainForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-domain-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDomainDialogOpen(false)}
                  data-testid="button-cancel-domain"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDomainMutation.isPending || updateDomainMutation.isPending}
                  data-testid="button-submit-domain"
                >
                  {editingDomain ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Functionality Dialog */}
      <Dialog open={functionalityDialogOpen} onOpenChange={setFunctionalityDialogOpen}>
        <DialogContent data-testid="dialog-functionality-form">
          <DialogHeader>
            <DialogTitle>{editingFunctionality ? "Edit Functionality" : "Create Functionality"}</DialogTitle>
            <DialogDescription>
              {editingFunctionality ? "Update the functionality" : "Create a new functionality"}
            </DialogDescription>
          </DialogHeader>
          <Form {...functionalityForm}>
            <form onSubmit={functionalityForm.handleSubmit(handleFunctionalitySubmit)} className="space-y-4">
              <FormField
                control={functionalityForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-functionality-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={functionalityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-functionality-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={functionalityForm.control}
                name="domainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-functionality-domain">
                          <SelectValue placeholder="Select a domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {domains.map((domain) => (
                          <SelectItem key={domain.id} value={domain.id} data-testid={`option-domain-${domain.id}`}>
                            {domain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFunctionalityDialogOpen(false)}
                  data-testid="button-cancel-functionality"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFunctionalityMutation.isPending || updateFunctionalityMutation.isPending}
                  data-testid="button-submit-functionality"
                >
                  {editingFunctionality ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Settings Master Dialog */}
      <Dialog open={settingsMasterDialogOpen} onOpenChange={setSettingsMasterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-settings-master-form">
          <DialogHeader>
            <DialogTitle>{editingSettingsMaster ? "Edit Settings Master" : "Create Settings Master"}</DialogTitle>
            <DialogDescription>
              {editingSettingsMaster ? "Update the settings master" : "Create a new settings master"}
            </DialogDescription>
          </DialogHeader>
          <Form {...settingsMasterForm}>
            <form onSubmit={settingsMasterForm.handleSubmit(handleSettingsMasterSubmit)} className="space-y-4">
              <FormField
                control={settingsMasterForm.control}
                name="functionalityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Functionality</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleFunctionalityChange(value);
                      }}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-settings-functionality">
                          <SelectValue placeholder="Select a functionality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {functionalities.map((functionality) => (
                          <SelectItem key={functionality.id} value={functionality.id} data-testid={`option-functionality-${functionality.id}`}>
                            {functionality.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsMasterForm.control}
                  name="settingFunctionalDomainCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Code (Auto)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled data-testid="input-domain-code-auto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingsMasterForm.control}
                  name="settingFunctionalDomainName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name (Auto)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled data-testid="input-domain-name-auto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsMasterForm.control}
                  name="settingFunctionalityCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functionality Code (Auto)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled data-testid="input-functionality-code-auto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={settingsMasterForm.control}
                  name="settingFunctionalityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Functionality Name (Auto)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} disabled data-testid="input-functionality-name-auto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={settingsMasterForm.control}
                name="settingName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-setting-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsMasterForm.control}
                name="settingCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-setting-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsMasterForm.control}
                name="settingDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} data-testid="input-setting-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsMasterForm.control}
                name="settingValues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setting Values</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-setting-values" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsMasterForm.control}
                name="defaultValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-default-value" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={settingsMasterForm.control}
                name="articleCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-article-code-settings" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsMasterDialogOpen(false)}
                  data-testid="button-cancel-settings-master"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSettingsMasterMutation.isPending || updateSettingsMasterMutation.isPending}
                  data-testid="button-submit-settings-master"
                >
                  {editingSettingsMaster ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
