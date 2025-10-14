/**
 * TWO-PANE SETUP TEMPLATE
 * 
 * This template provides a reusable pattern for creating setup/configuration pages
 * with a two-pane layout (list view + detail view) following the Knowledge Articles pattern.
 * 
 * ===================================================================================
 * HOW TO USE THIS TEMPLATE:
 * ===================================================================================
 * 
 * 1. COPY THIS FILE to client/src/components/setup/your-feature-name.tsx
 * 
 * 2. GLOBAL FIND & REPLACE:
 *    - Replace "YourEntity" with your actual entity name (e.g., "KnowledgeArticle", "DevPattern", etc.)
 *    - Replace "yourEntity" with camelCase version (e.g., "knowledgeArticle", "devPattern")
 *    - Replace "your-entities" with kebab-case plural (e.g., "knowledge-articles", "dev-patterns")
 * 
 * 3. UPDATE IMPORTS (lines 45-60):
 *    - Import your entity types from @shared/schema
 *    - Import your insert schema from @shared/schema
 *    - Add any additional UI components you need
 * 
 * 4. CUSTOMIZE FIELDS:
 *    - VIEW MODE (lines 110-280): Replace field displays with your entity's fields
 *    - EDIT MODE (lines 320-720): Replace form fields with your entity's fields
 *    - LIST VIEW (lines 950-1040): Update the table columns and search fields
 * 
 * 5. UPDATE API ENDPOINTS (search for "/api/your-entities"):
 *    - List endpoint: GET /api/your-entities
 *    - Detail endpoint: GET /api/your-entities/:id
 *    - Create endpoint: POST /api/your-entities
 *    - Update endpoint: PATCH /api/your-entities/:id
 *    - Delete endpoint: DELETE /api/your-entities/:id
 * 
 * 6. ADJUST FEATURES AS NEEDED:
 *    - Remove TiptapEditor if you don't need rich text editing
 *    - Remove user lookup if you don't need author selection
 *    - Add/remove fields based on your schema
 *    - Customize validation rules
 * 
 * ===================================================================================
 * KEY PATTERNS IN THIS TEMPLATE:
 * ===================================================================================
 * 
 * - Two-pane layout using PanelGroup/Panel (resizable)
 * - Performance optimization: List API returns without heavy fields, detail API fetches complete data
 * - View/Edit mode toggle pattern with separate components
 * - Search functionality across multiple fields
 * - Create/Update/Delete operations with optimistic UI
 * - Rich text editing with TiptapEditor (optional)
 * - Form validation using Zod schemas
 * - React Query for data fetching and mutations
 * 
 * ===================================================================================
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Search,
  BookOpen, // Replace with appropriate icon for your entity
  Trash2,
  Save,
  UserPlus,
  Edit,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// STEP 3: REPLACE THESE IMPORTS WITH YOUR ACTUAL SCHEMA TYPES
// import type { YourEntityType, YourRelatedType } from "@shared/schema";
// import { insertYourEntitySchema } from "@shared/schema";
import { format } from "date-fns";
import { TiptapEditor } from "@/components/ui/tiptap-editor"; // Remove if not using rich text
import UserLookupDialog from "@/components/ui/user-lookup-dialog"; // Remove if not needed
import { Badge } from "@/components/ui/badge";

// STEP 3: DEFINE YOUR FORM TYPE
// type YourEntityForm = z.infer<typeof insertYourEntitySchema>;

/**
 * VIEW MODE COMPONENT
 * 
 * Displays entity details in read-only format
 * CUSTOMIZE: Replace field displays with your entity's fields
 */
function YourEntityView({
  entity,
  onEdit,
  onClose,
}: {
  entity: any; // Replace with your entity type
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Entity Name</h3>
          <p className="text-sm text-muted-foreground">
            View entity details
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close"
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <Button onClick={onEdit} data-testid="button-edit">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Entity Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>{/* Replace with your title field: entity.titleField */}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* CUSTOMIZE: Replace with your entity's fields */}
          {/* Example: Two-column grid for related fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Field Label 1
              </label>
              <p className="text-sm mt-1">
                {/* entity.field1 || "Not specified" */}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Field Label 2
              </label>
              <p className="text-sm mt-1">
                {/* entity.field2 || "Not specified" */}
              </p>
            </div>
          </div>

          {/* Example: Conditional badge/tag display */}
          {/* {entity.tags && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {entity.tags.split(",").map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )} */}

          {/* Example: Date display */}
          {/* {entity.createdDate && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created Date
              </label>
              <p className="text-sm mt-1">
                {format(new Date(entity.createdDate), "PPP")}
              </p>
            </div>
          )} */}

          {/* Example: Boolean fields as badges */}
          {/* <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status Field 1
              </label>
              <div className="mt-1">
                <Badge variant={entity.isActive ? "default" : "secondary"}>
                  {entity.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Status Field 2
              </label>
              <div className="mt-1">
                <Badge variant={entity.isPublic ? "outline" : "secondary"}>
                  {entity.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
          </div> */}

        </CardContent>
      </Card>

      {/* OPTIONAL: Rich Text Content Card - Remove if not needed */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: entity.content || "<p class='text-muted-foreground'>No content available</p>",
            }}
            data-testid="view-content"
          />
        </CardContent>
      </Card> */}
    </div>
  );
}

/**
 * EDIT MODE COMPONENT
 * 
 * Form for creating or editing entities
 * CUSTOMIZE: Replace form fields with your entity's fields
 */
function YourEntityEdit({
  entity,
  onCancel,
  onSaved,
}: {
  entity: any | "new"; // Replace with your entity type
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [isUserLookupOpen, setIsUserLookupOpen] = useState(false); // Remove if not using user lookup
  const [selectedUser, setSelectedUser] = useState<any | null>(null); // Remove if not using user lookup
  const [editorContent, setEditorContent] = useState(""); // Remove if not using rich text editor

  const isNew = entity === "new";

  // OPTIONAL: Fetch related data for dropdowns/lookups
  // const { data: relatedData = [] } = useQuery<any[]>({
  //   queryKey: ["/api/related-data"],
  // });

  // OPTIONAL: Fetch current user for default values
  // const { data: currentUser } = useQuery<any>({
  //   queryKey: ["/api/auth/me"],
  // });

  // STEP 4: UPDATE FORM SCHEMA AND DEFAULT VALUES
  const form = useForm<any>({
    resolver: zodResolver(z.object({})), // Replace with insertYourEntitySchema
    defaultValues: {
      // Define your entity's default values here
      // field1: "",
      // field2: "",
      // isActive: false,
    },
  });

  // Populate form when editing existing entity or set defaults for new entity
  useEffect(() => {
    if (!isNew) {
      // Load existing entity data into form
      form.reset({
        // Map your entity fields to form fields
        // field1: entity.field1 || "",
        // field2: entity.field2 || "",
      });
      // setEditorContent(entity.content || ""); // If using rich text editor
    } else {
      // Initialize form with defaults for new entity
      form.reset({
        // Set default values for new entity
        // field1: "",
        // field2: "",
      });
      // setEditorContent(""); // If using rich text editor
    }
  }, [entity, isNew, form]);

  // Create new entity mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/your-entities", data); // Replace endpoint
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/your-entities"] }); // Replace endpoint
      toast({
        title: "Success",
        description: "Entity created successfully",
      });
      onSaved();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create entity",
      });
    },
  });

  // Update existing entity mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(
        "PATCH",
        `/api/your-entities/${entity.id}`, // Replace endpoint
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/your-entities"] }); // Replace endpoint
      toast({
        title: "Success",
        description: "Entity updated successfully",
      });
      onSaved();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update entity",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: any) => {
    // Merge form data with any additional fields (e.g., rich text content)
    const formData = {
      ...data,
      // content: editorContent, // If using rich text editor
    };

    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  // OPTIONAL: User lookup handler - Remove if not needed
  // const handleUserSelect = (user: any) => {
  //   setSelectedUser(user);
  //   form.setValue("userId", user.id);
  // };

  return (
    <div className="space-y-6">
      {/* Header with Cancel and Save buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isNew ? "Create Entity" : "Edit Entity"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isNew ? "Create a new entity" : "Update entity details"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-save"
          >
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : "Save"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 5: CUSTOMIZE FORM FIELDS */}
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Example: Text Input Field */}
              {/* <FormField
                control={form.control}
                name="field1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter value"
                        {...field}
                        data-testid="input-field1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Example: Two-column grid for related fields */}
              {/* <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="field2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field 2</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="field3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field 3</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}

              {/* Example: Select/Dropdown Field */}
              {/* <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Example: Textarea Field */}
              {/* <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* Example: Checkbox Fields in Grid */}
              {/* <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-active"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Mark this entity as active
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-public"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public</FormLabel>
                        <FormDescription>
                          Make this entity publicly visible
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div> */}

            </CardContent>
          </Card>

          {/* OPTIONAL: Rich Text Editor Card - Remove if not needed */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <TiptapEditor
                content={editorContent}
                onChange={setEditorContent}
                placeholder="Enter content here..."
              />
            </CardContent>
          </Card> */}

        </form>
      </Form>

      {/* OPTIONAL: User Lookup Dialog - Remove if not needed */}
      {/* <UserLookupDialog
        open={isUserLookupOpen}
        onOpenChange={setIsUserLookupOpen}
        onUserSelect={handleUserSelect}
      /> */}
    </div>
  );
}

/**
 * DETAIL COMPONENT
 * 
 * Wrapper that toggles between view and edit modes
 * Usually doesn't need customization
 */
function YourEntityDetail({
  entity,
  onClose,
}: {
  entity: any | "new"; // Replace with your entity type
  onClose: () => void;
}) {
  const [isEditMode, setIsEditMode] = useState(entity === "new");

  // Reset edit mode when entity changes
  useEffect(() => {
    setIsEditMode(entity === "new");
  }, [entity]);

  const handleSaved = () => {
    setIsEditMode(false);
    if (entity === "new") {
      onClose();
    }
  };

  if (isEditMode || entity === "new") {
    return (
      <YourEntityEdit
        entity={entity}
        onCancel={() => {
          if (entity === "new") {
            onClose();
          } else {
            setIsEditMode(false);
          }
        }}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <YourEntityView
      entity={entity}
      onEdit={() => setIsEditMode(true)}
      onClose={onClose}
    />
  );
}

/**
 * MAIN COMPONENT
 * 
 * Two-pane layout with list and detail views
 * CUSTOMIZE: Update search fields and list display
 */
export default function YourEntitiesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string | "new" | null>(null);
  const { toast } = useToast();

  // Fetch entity list (exclude heavy fields for performance)
  const { data: entities = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/your-entities"], // Replace endpoint
  });

  // Fetch complete entity when selected (includes all fields)
  const { data: selectedEntity, isLoading: isLoadingEntity } = useQuery<any>({
    queryKey: ["/api/your-entities", selectedEntityId], // Replace endpoint
    enabled: !!selectedEntityId && selectedEntityId !== "new",
  });

  // Delete entity mutation with optimistic UI update
  const deleteMutation = useMutation({
    mutationFn: (entityId: string) => apiRequest("DELETE", `/api/your-entities/${entityId}`), // Replace endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/your-entities"] }); // Replace endpoint
      toast({
        title: "Success",
        description: "Entity deleted successfully",
      });
      setSelectedEntityId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete entity",
      });
    },
  });

  // STEP 6: UPDATE SEARCH FILTER LOGIC
  const filteredEntities = entities.filter((entity) => {
    const query = searchQuery.toLowerCase();
    return (
      // Add your entity's searchable fields here
      // entity.field1?.toLowerCase().includes(query) ||
      // entity.field2?.toLowerCase().includes(query) ||
      // entity.field3?.toLowerCase().includes(query)
      true // Replace with actual search logic
    );
  });

  const handleDelete = (entityId: string) => {
    deleteMutation.mutate(entityId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading entities...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Pane Layout: Left = Entity List, Right = Entity Detail */}
      <PanelGroup direction="horizontal" className="min-h-[600px]">
        
        {/* Left Panel - Entity List with Search and Create */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="space-y-4 pr-4">
            
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entities..." // Customize search placeholder
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Entities List */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Entities ({filteredEntities.length})</CardTitle>
                  <Button
                    onClick={() => setSelectedEntityId("new")}
                    data-testid="button-create"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No entities found</p>
                    <p className="text-sm mt-2">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "Click 'New' to create one"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity Details</TableHead> {/* Customize header */}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntities
                        .sort((a, b) => {
                          // Customize sorting logic
                          // const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
                          // const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
                          // return dateB - dateA;
                          return 0;
                        })
                        .map((entity) => (
                          <TableRow
                            key={entity.id}
                            className={
                              selectedEntityId === entity.id
                                ? "bg-muted"
                                : ""
                            }
                          >
                            <TableCell>
                              <button
                                onClick={() => setSelectedEntityId(entity.id)}
                                className="text-left w-full hover:underline"
                                data-testid={`button-select-${entity.id}`}
                              >
                                <div>
                                  {/* STEP 7: CUSTOMIZE LIST ITEM DISPLAY */}
                                  <div data-testid={`text-title-${entity.id}`}>
                                    {/* entity.titleField */}
                                    Entity Title
                                  </div>
                                  {/* Optional: Subtitle or additional info */}
                                  {/* <div className="text-xs text-muted-foreground">
                                    {entity.subtitle}
                                  </div> */}
                                </div>
                              </button>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-delete-${entity.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Entity
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this entity?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(entity.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-delete-${entity.id}`}
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

        {/* Resizable Divider */}
        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Panel - Entity Detail (View/Edit Mode) */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="pl-4">
            {/* Create new entity */}
            {selectedEntityId === "new" ? (
              <YourEntityDetail
                entity="new"
                onClose={() => setSelectedEntityId(null)}
              />
            ) : selectedEntityId && isLoadingEntity ? (
              /* Loading selected entity */
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <div className="animate-pulse">Loading entity...</div>
                  </div>
                </CardContent>
              </Card>
            ) : selectedEntityId && selectedEntity ? (
              /* Display selected entity */
              <YourEntityDetail
                entity={selectedEntity}
                onClose={() => setSelectedEntityId(null)}
              />
            ) : (
              /* Empty state - no entity selected */
              <Card>
                <CardContent className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Select an entity to view details</p>
                    <p className="text-sm mt-2">
                      or click "New" to add a new one
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
