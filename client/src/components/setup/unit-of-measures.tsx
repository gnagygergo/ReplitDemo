import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Ruler, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
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
import type { UnitOfMeasure, InsertUnitOfMeasure } from "@shared/schema";
import { insertUnitOfMeasureSchema } from "@shared/schema";

type UnitOfMeasureForm = z.infer<typeof insertUnitOfMeasureSchema>;

function UnitOfMeasureEditDialog({
  unitOfMeasure,
  onClose,
}: {
  unitOfMeasure: UnitOfMeasure;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnitOfMeasureForm>({
    resolver: zodResolver(insertUnitOfMeasureSchema),
    defaultValues: {
      type: unitOfMeasure.type || "",
      uomName: unitOfMeasure.uomName || "",
      baseToType: unitOfMeasure.baseToType || false,
      companyId: unitOfMeasure.companyId,
    },
  });

  const updateUnitOfMeasureMutation = useMutation({
    mutationFn: async (data: UnitOfMeasureForm) => {
      return await apiRequest("PATCH", `/api/unit-of-measures/${unitOfMeasure.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unit-of-measures"] });
      toast({
        title: "Success",
        description: "Unit of Measure updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update unit of measure",
      });
    },
  });

  const onSubmit = (data: UnitOfMeasureForm) => {
    updateUnitOfMeasureMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Unit of Measure</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter type"
                    {...field}
                    data-testid="input-uom-type"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uomName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UoM Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter UoM name"
                    {...field}
                    data-testid="input-uom-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseToType"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-base-to-type"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Base to Type
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateUnitOfMeasureMutation.isPending}
              data-testid="button-update-uom"
            >
              {updateUnitOfMeasureMutation.isPending ? "Updating..." : "Update Unit of Measure"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function UnitOfMeasureCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UnitOfMeasureForm>({
    resolver: zodResolver(insertUnitOfMeasureSchema),
    defaultValues: {
      type: "",
      uomName: "",
      baseToType: false,
    },
  });

  const createUnitOfMeasureMutation = useMutation({
    mutationFn: async (data: UnitOfMeasureForm) => {
      return await apiRequest("POST", "/api/unit-of-measures", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unit-of-measures"] });
      toast({
        title: "Success",
        description: "Unit of Measure created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create unit of measure",
      });
    },
  });

  const onSubmit = (data: UnitOfMeasureForm) => {
    createUnitOfMeasureMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Unit of Measure</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter type"
                    {...field}
                    data-testid="input-uom-type"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="uomName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UoM Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter UoM name"
                    {...field}
                    data-testid="input-uom-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="baseToType"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-base-to-type"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Base to Type
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createUnitOfMeasureMutation.isPending}
              data-testid="button-create-uom"
            >
              {createUnitOfMeasureMutation.isPending ? "Creating..." : "Create Unit of Measure"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function UnitOfMeasuresManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUnitOfMeasure, setEditingUnitOfMeasure] = useState<UnitOfMeasure | null>(null);
  const [isCreatingUnitOfMeasure, setIsCreatingUnitOfMeasure] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: unitOfMeasures = [], isLoading } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/unit-of-measures"],
  });

  const deleteUnitOfMeasureMutation = useMutation({
    mutationFn: (unitOfMeasureId: string) => apiRequest("DELETE", `/api/unit-of-measures/${unitOfMeasureId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unit-of-measures"] });
      toast({
        title: "Success",
        description: "Unit of Measure deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete unit of measure",
      });
    },
  });

  const filteredUnitOfMeasures = unitOfMeasures.filter((uom: UnitOfMeasure) => {
    const query = searchQuery.toLowerCase();
    return (
      uom.type?.toLowerCase().includes(query) ||
      uom.uomName?.toLowerCase().includes(query)
    );
  });

  const handleDeleteUnitOfMeasure = (unitOfMeasureId: string) => {
    deleteUnitOfMeasureMutation.mutate(unitOfMeasureId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Unit of Measures</h3>
            <p className="text-sm text-muted-foreground">
              Manage unit of measure configurations
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading unit of measures...</div>
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
          <h3 className="text-lg font-semibold">Unit of Measures</h3>
          <p className="text-sm text-muted-foreground">
            Manage unit of measure configurations
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingUnitOfMeasure(true)}
          data-testid="button-create-uom"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Unit of Measure
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by type or UoM name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-uom-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Unit of Measures List */}
      <Card>
        <CardHeader>
          <CardTitle>Unit of Measures ({filteredUnitOfMeasures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUnitOfMeasures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ruler className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "No unit of measures match your search"
                  : "No unit of measures found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>UoM Name</TableHead>
                  <TableHead>Base to Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnitOfMeasures
                  .sort((a, b) => {
                    const typeCompare = a.type.localeCompare(b.type);
                    if (typeCompare !== 0) return typeCompare;
                    return a.uomName.localeCompare(b.uomName);
                  })
                  .map((uom: UnitOfMeasure) => (
                    <TableRow
                      key={uom.id}
                      data-testid={`row-uom-${uom.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Ruler className="h-4 w-4 text-primary" />
                          </div>
                          <span data-testid={`text-uom-type-${uom.id}`}>
                            {uom.type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-uom-name-${uom.id}`}>
                        {uom.uomName}
                      </TableCell>
                      <TableCell>
                        {uom.baseToType ? (
                          <Badge className="bg-green-100 text-green-800" data-testid={`badge-base-to-type-${uom.id}`}>
                            <Check className="h-3 w-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary" data-testid={`badge-base-to-type-${uom.id}`}>
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUnitOfMeasure(uom)}
                            data-testid={`button-edit-uom-${uom.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-uom-${uom.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Unit of Measure</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{uom.type} - {uom.uomName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUnitOfMeasure(uom.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-uom-${uom.id}`}
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

      {/* Create Dialog */}
      {isCreatingUnitOfMeasure && (
        <Dialog open={isCreatingUnitOfMeasure} onOpenChange={setIsCreatingUnitOfMeasure}>
          <UnitOfMeasureCreateDialog onClose={() => setIsCreatingUnitOfMeasure(false)} />
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingUnitOfMeasure && (
        <Dialog open={!!editingUnitOfMeasure} onOpenChange={() => setEditingUnitOfMeasure(null)}>
          <UnitOfMeasureEditDialog
            unitOfMeasure={editingUnitOfMeasure}
            onClose={() => setEditingUnitOfMeasure(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
