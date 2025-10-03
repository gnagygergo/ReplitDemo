import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, Rocket, Hash } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Release as ReleaseType, InsertRelease } from "@shared/schema";
import { insertReleaseSchema } from "@shared/schema";
import ReleaseDetail from "./release-detail";

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
  const [selectedRelease, setSelectedRelease] = useState<ReleaseType | null>(null);
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
      if (selectedRelease) {
        setSelectedRelease(null);
      }
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

  useEffect(() => {
    if (selectedRelease && releases.length > 0) {
      const updatedRelease = releases.find(
        (release) => release.id === selectedRelease.id
      );
      if (updatedRelease) {
        setSelectedRelease(updatedRelease);
      }
    }
  }, [releases, selectedRelease?.id]);

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
          data-testid="button-new-release"
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReleases
                        .sort((a, b) => a.order - b.order)
                        .map((release: ReleaseType) => (
                          <TableRow
                            key={release.id}
                            data-testid={`row-release-${release.id}`}
                            className={selectedRelease?.id === release.id ? "bg-muted/50" : ""}
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
                              <button
                                onClick={() => setSelectedRelease(release)}
                                className="text-left hover:underline flex items-center space-x-3 w-full"
                                data-testid={`link-release-${release.id}`}
                              >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Rocket className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <div data-testid={`text-release-name-${release.id}`}>
                                    {release.releaseName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    <Badge
                                      className={`${statusColors[release.status as keyof typeof statusColors]} text-xs px-1.5 py-0`}
                                    >
                                      {release.status}
                                    </Badge>
                                  </div>
                                </div>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
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
            {selectedRelease ? (
              <ReleaseDetail release={selectedRelease} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <Rocket className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select a release to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Create Dialog */}
      {isCreatingRelease && (
        <Dialog open={isCreatingRelease} onOpenChange={setIsCreatingRelease}>
          <ReleaseCreateDialog onClose={() => setIsCreatingRelease(false)} />
        </Dialog>
      )}
    </div>
  );
}
