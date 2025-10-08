import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, Award, Pencil } from "lucide-react";
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
import type { Licence } from "@shared/schema";
import { insertLicenceSchema } from "@shared/schema";

type LicenceForm = z.infer<typeof insertLicenceSchema>;

function LicenceDialog({ 
  licence, 
  onClose 
}: { 
  licence?: Licence; 
  onClose: () => void 
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!licence;

  const form = useForm<LicenceForm>({
    resolver: zodResolver(insertLicenceSchema),
    defaultValues: {
      name: licence?.name || "",
      description: licence?.description || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LicenceForm) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/licences/${licence.id}`, data);
      }
      return await apiRequest("POST", "/api/licences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licences"] });
      toast({
        title: "Success",
        description: `Licence ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${isEditing ? "update" : "create"} licence`,
      });
    },
  });

  const onSubmit = (data: LicenceForm) => {
    mutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit" : "Create"} Licence</DialogTitle>
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
                    placeholder="Enter licence name"
                    {...field}
                    data-testid="input-licence-name"
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
                    placeholder="Enter licence description"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-licence-description"
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
              disabled={mutation.isPending}
              data-testid="button-save-licence"
            >
              {mutation.isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function LicencesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicence, setSelectedLicence] = useState<Licence | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; licence?: Licence }>({
    open: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: licences = [], isLoading } = useQuery<Licence[]>({
    queryKey: ["/api/licences"],
  });

  const deleteMutation = useMutation({
    mutationFn: (licenceId: string) => apiRequest("DELETE", `/api/licences/${licenceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/licences"] });
      toast({
        title: "Success",
        description: "Licence deleted successfully",
      });
      if (selectedLicence) {
        setSelectedLicence(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete licence",
      });
    },
  });

  const filteredLicences = licences.filter((licence: Licence) => {
    const query = searchQuery.toLowerCase();
    return (
      licence.name?.toLowerCase().includes(query) ||
      licence.description?.toLowerCase().includes(query)
    );
  });

  const handleDelete = (licenceId: string) => {
    deleteMutation.mutate(licenceId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Licences</h3>
            <p className="text-sm text-muted-foreground">
              Manage licence types
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading licences...</div>
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
          <h3 className="text-lg font-semibold">Licences</h3>
          <p className="text-sm text-muted-foreground">
            Manage licence types
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ open: true })}
          data-testid="button-new-licence"
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
                    placeholder="Search licences..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-licence-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Licences List */}
            <Card>
              <CardHeader>
                <CardTitle>Licences ({filteredLicences.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredLicences.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No licences match your search"
                        : "No licences found"}
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
                      {filteredLicences
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((licence: Licence) => (
                          <TableRow
                            key={licence.id}
                            data-testid={`row-licence-${licence.id}`}
                            className={selectedLicence?.id === licence.id ? "bg-muted/50" : ""}
                          >
                            <TableCell className="font-medium">
                              <button
                                onClick={() => setSelectedLicence(licence)}
                                className="text-left hover:underline flex items-center space-x-3 w-full"
                                data-testid={`link-licence-${licence.id}`}
                              >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Award className="h-4 w-4 text-primary" />
                                </div>
                                <span data-testid={`text-licence-name-${licence.id}`}>
                                  {licence.name}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDialogState({ open: true, licence })}
                                  data-testid={`button-edit-licence-${licence.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      data-testid={`button-delete-licence-${licence.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Licence</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{licence.name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(licence.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        data-testid={`button-confirm-delete-licence-${licence.id}`}
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
        </Panel>

        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Panel - Detail View */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="pl-4">
            {selectedLicence ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    {selectedLicence.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedLicence.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-licence-description-${selectedLicence.id}`}>
                        {selectedLicence.description}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setDialogState({ open: true, licence: selectedLicence })}
                      data-testid={`button-edit-selected-licence`}
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
                    <Award className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select a licence to view details</p>
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
          <LicenceDialog 
            licence={dialogState.licence} 
            onClose={() => setDialogState({ open: false })} 
          />
        </Dialog>
      )}
    </div>
  );
}
