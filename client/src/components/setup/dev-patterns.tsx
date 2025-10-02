import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, FileCode } from "lucide-react";
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
import type { DevPattern, InsertDevPattern } from "@shared/schema";
import { insertDevPatternSchema } from "@shared/schema";
import DevPatternDetail from "./dev-pattern-detail";

type DevPatternForm = z.infer<typeof insertDevPatternSchema>;

function DevPatternCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DevPatternForm>({
    resolver: zodResolver(insertDevPatternSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createDevPatternMutation = useMutation({
    mutationFn: async (data: DevPatternForm) => {
      return await apiRequest("POST", "/api/dev-patterns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev-patterns"] });
      toast({
        title: "Success",
        description: "Dev pattern created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create dev pattern",
      });
    },
  });

  const onSubmit = (data: DevPatternForm) => {
    createDevPatternMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Dev Pattern</DialogTitle>
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
                    placeholder="Enter pattern name"
                    {...field}
                    data-testid="input-dev-pattern-name"
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
                    placeholder="Enter pattern description"
                    {...field}
                    value={field.value || ""}
                    data-testid="input-dev-pattern-description"
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
              disabled={createDevPatternMutation.isPending}
              data-testid="button-create-dev-pattern"
            >
              {createDevPatternMutation.isPending ? "Creating..." : "Create Dev Pattern"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function DevPatternsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDevPattern, setSelectedDevPattern] = useState<DevPattern | null>(null);
  const [isCreatingDevPattern, setIsCreatingDevPattern] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devPatterns = [], isLoading } = useQuery<DevPattern[]>({
    queryKey: ["/api/dev-patterns"],
  });

  const deleteDevPatternMutation = useMutation({
    mutationFn: (devPatternId: string) => apiRequest("DELETE", `/api/dev-patterns/${devPatternId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dev-patterns"] });
      toast({
        title: "Success",
        description: "Dev pattern deleted successfully",
      });
      if (selectedDevPattern) {
        setSelectedDevPattern(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete dev pattern",
      });
    },
  });

  const filteredDevPatterns = devPatterns.filter((devPattern: DevPattern) => {
    const query = searchQuery.toLowerCase();
    return (
      devPattern.name?.toLowerCase().includes(query) ||
      devPattern.description?.toLowerCase().includes(query)
    );
  });

  const handleDeleteDevPattern = (devPatternId: string) => {
    deleteDevPatternMutation.mutate(devPatternId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Dev Patterns</h3>
            <p className="text-sm text-muted-foreground">
              Manage development patterns
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading dev patterns...</div>
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
          <h3 className="text-lg font-semibold">Dev Patterns</h3>
          <p className="text-sm text-muted-foreground">
            Manage development patterns
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingDevPattern(true)}
          data-testid="button-new-dev-pattern"
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
                    placeholder="Search dev patterns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-dev-pattern-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dev Patterns List */}
            <Card>
              <CardHeader>
                <CardTitle>Dev Patterns ({filteredDevPatterns.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredDevPatterns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCode className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>
                      {searchQuery
                        ? "No dev patterns match your search"
                        : "No dev patterns found"}
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
                      {filteredDevPatterns
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((devPattern: DevPattern) => (
                          <TableRow
                            key={devPattern.id}
                            data-testid={`row-dev-pattern-${devPattern.id}`}
                            className={selectedDevPattern?.id === devPattern.id ? "bg-muted/50" : ""}
                          >
                            <TableCell className="font-medium">
                              <button
                                onClick={() => setSelectedDevPattern(devPattern)}
                                className="text-left hover:underline flex items-center space-x-3 w-full"
                                data-testid={`link-dev-pattern-${devPattern.id}`}
                              >
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <FileCode className="h-4 w-4 text-primary" />
                                </div>
                                <span data-testid={`text-dev-pattern-name-${devPattern.id}`}>
                                  {devPattern.name}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-delete-dev-pattern-${devPattern.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Dev Pattern</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{devPattern.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDevPattern(devPattern.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-delete-dev-pattern-${devPattern.id}`}
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
            {selectedDevPattern ? (
              <DevPatternDetail devPattern={selectedDevPattern} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <FileCode className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select a dev pattern to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>

      {/* Create Dialog */}
      {isCreatingDevPattern && (
        <Dialog open={isCreatingDevPattern} onOpenChange={setIsCreatingDevPattern}>
          <DevPatternCreateDialog onClose={() => setIsCreatingDevPattern(false)} />
        </Dialog>
      )}
    </div>
  );
}
