import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Rocket, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Release as ReleaseType, InsertRelease } from "@shared/schema";
import { insertReleaseSchema } from "@shared/schema";

// Extend the shared schema for UI-specific validation
const releaseFormSchema = insertReleaseSchema.extend({
  order: z.number().min(1, "Order must be a positive number"),
});

type ReleaseForm = z.infer<typeof releaseFormSchema>;

const statusColors = {
  Planned: "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Dropped: "bg-red-100 text-red-800",
};

function ReleaseEditDialog({
  release,
  onClose,
}: {
  release: ReleaseType;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReleaseForm>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      releaseName: release.releaseName || "",
      releaseDescription: release.releaseDescription ?? "",
      order: release.order || 1,
      commits: release.commits ?? "",
      status: release.status as any || "Planned",
    },
  });

  const updateReleaseMutation = useMutation({
    mutationFn: async (data: ReleaseForm) => {
      return await apiRequest("PATCH", `/api/releases/${release.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Success",
        description: "Release updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update release",
      });
    },
  });

  const onSubmit = (data: ReleaseForm) => {
    updateReleaseMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Release</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="releaseName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter release name"
                    {...field}
                    data-testid="input-release-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="releaseDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter release description (optional)"
                    {...field}
                    value={field.value ?? ""}
                    data-testid="input-release-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter order number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-release-order"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commits</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter commit information (optional)"
                    {...field}
                    value={field.value ?? ""}
                    data-testid="input-release-commits"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-testid="select-release-status"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
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
            <Button
              type="submit"
              disabled={updateReleaseMutation.isPending}
              data-testid="button-update-release"
            >
              {updateReleaseMutation.isPending ? "Updating..." : "Update Release"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function ReleaseCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReleaseForm>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      releaseName: "",
      releaseDescription: "",
      order: 1,
      commits: "",
      status: "Planned",
    },
  });

  const createReleaseMutation = useMutation({
    mutationFn: async (data: ReleaseForm) => {
      return await apiRequest("POST", "/api/releases", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Success",
        description: "Release created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create release",
      });
    },
  });

  const onSubmit = (data: ReleaseForm) => {
    createReleaseMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Release</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="releaseName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter release name"
                    {...field}
                    data-testid="input-release-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="releaseDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Release Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter release description (optional)"
                    {...field}
                    value={field.value ?? ""}
                    data-testid="input-release-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter order number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-release-order"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="commits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commits</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter commit information (optional)"
                    {...field}
                    value={field.value ?? ""}
                    data-testid="input-release-commits"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  data-testid="select-release-status"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Planned">Planned</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Dropped">Dropped</SelectItem>
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
            <Button
              type="submit"
              disabled={createReleaseMutation.isPending}
              data-testid="button-create-release"
            >
              {createReleaseMutation.isPending ? "Creating..." : "Create Release"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function ReleaseManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRelease, setEditingRelease] = useState<ReleaseType | null>(null);
  const [isCreatingRelease, setIsCreatingRelease] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: releases = [], isLoading } = useQuery<ReleaseType[]>({
    queryKey: ["/api/releases"],
  });

  const deleteReleaseMutation = useMutation({
    mutationFn: (releaseId: string) => apiRequest("DELETE", `/api/releases/${releaseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Success",
        description: "Release deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete release",
      });
    },
  });

  const filteredReleases = releases.filter((release: ReleaseType) => {
    const query = searchQuery.toLowerCase();
    return (
      release.releaseName?.toLowerCase().includes(query) ||
      release.releaseDescription?.toLowerCase().includes(query) ||
      release.commits?.toLowerCase().includes(query) ||
      release.status?.toLowerCase().includes(query)
    );
  });

  const handleDeleteRelease = (releaseId: string) => {
    deleteReleaseMutation.mutate(releaseId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Release Plan</h3>
            <p className="text-sm text-muted-foreground">
              Manage release planning and tracking
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading releases...</div>
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
          <h3 className="text-lg font-semibold">Release Plan</h3>
          <p className="text-sm text-muted-foreground">
            Manage release planning and tracking
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingRelease(true)}
          data-testid="button-create-release"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Release
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-release-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Release List */}
      <Card>
        <CardHeader>
          <CardTitle>Releases ({filteredReleases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReleases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Rocket className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "No releases match your search"
                  : "No releases found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Release Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReleases
                  .sort((a, b) => a.order - b.order)
                  .map((release: ReleaseType) => (
                    <TableRow
                      key={release.id}
                      data-testid={`release-row-${release.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span data-testid={`text-release-order-${release.id}`}>
                            {release.order}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Rocket className="h-4 w-4 text-primary" />
                          </div>
                          <span data-testid={`text-release-name-${release.id}`}>
                            {release.releaseName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate"
                          data-testid={`text-release-description-${release.id}`}
                        >
                          {release.releaseDescription || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusColors[release.status as keyof typeof statusColors]}
                          data-testid={`badge-release-status-${release.id}`}
                        >
                          {release.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-release-date-${release.id}`}>
                        {release.createdDate
                          ? new Date(release.createdDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRelease(release)}
                            data-testid={`button-edit-release-${release.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-release-${release.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Release</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{release.releaseName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRelease(release.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-release-${release.id}`}
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
      {isCreatingRelease && (
        <Dialog open={isCreatingRelease} onOpenChange={setIsCreatingRelease}>
          <ReleaseCreateDialog onClose={() => setIsCreatingRelease(false)} />
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingRelease && (
        <Dialog open={!!editingRelease} onOpenChange={() => setEditingRelease(null)}>
          <ReleaseEditDialog
            release={editingRelease}
            onClose={() => setEditingRelease(null)}
          />
        </Dialog>
      )}
    </div>
  );
}