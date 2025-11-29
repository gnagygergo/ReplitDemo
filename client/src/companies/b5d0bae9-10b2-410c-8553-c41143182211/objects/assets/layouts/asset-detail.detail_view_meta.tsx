/**
 * asset-detail.detail_view_meta.tsx
 * 
 * PURPOSE:
 * This is the detail view layout for the Assets object. It displays a single
 * asset record with all its fields and provides editing capabilities.
 * 
 * ARCHITECTURE:
 * This layout receives all its dependencies via props from ObjectDetailPage,
 * eliminating the need for individual import statements. This pattern:
 * 1. Reduces import clutter
 * 2. Ensures consistency across layouts
 * 3. Makes layouts more portable and testable
 * 
 * DEPENDENCIES:
 * - deps.components: UI components (Button, Card, Form, etc.)
 * - deps.fields: Field components (TextField, NumberField, etc.)
 * - deps.panels: Panel components for resizable layouts
 * - deps.icons: Lucide icons
 * - deps.routing: Navigation utilities (Link)
 * - deps.hooks: Custom hooks including useObjectDetail
 * 
 * USAGE:
 * This component is loaded dynamically by ObjectDetailPage and receives:
 * - deps: The layout dependencies bundle
 * - objectCode: 'assets'
 * - id: The record ID from the URL (or 'new' for creating)
 */

import type { LayoutDependencies } from "@/lib/layoutDependencies";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface AssetDetailProps {
  /** Pre-bundled dependencies (components, hooks, icons, etc.) */
  deps: LayoutDependencies;
  /** The object code (should be 'assets') */
  objectCode: string;
  /** The record ID from the URL, or 'new' for creating */
  id: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AssetDetail({ deps, objectCode, id }: AssetDetailProps) {
  // ---------------------------------------------------------------------------
  // DESTRUCTURE DEPENDENCIES
  // Extract what we need from the dependencies bundle
  // ---------------------------------------------------------------------------
  
  const { Button, Card, CardContent, CardHeader, CardTitle, Form, FormField, FormItem, FormMessage } = deps.components;
  const { TextField, NumberField, DateTimeField, AddressField, LookupFormField, CheckboxField } = deps.fields;
  const { Panel, PanelGroup, PanelResizeHandle } = deps.panels;
  const { Package, Edit, Save, X } = deps.icons;
  const { Link } = deps.routing;
  const { useObjectDetail } = deps.hooks;

  // ---------------------------------------------------------------------------
  // DATA & STATE MANAGEMENT
  // Use the generic useObjectDetail hook for all CRUD operations
  // ---------------------------------------------------------------------------
  
  const {
    record: asset,
    isLoading,
    isCreating,
    isEditing,
    setIsEditing,
    form,
    createMutation,
    updateMutation,
    onSubmit,
    handleCancel,
  } = useObjectDetail({
    objectCode,
    id,
    labelSingular: "Asset",
    labelPlural: "Assets",
  });

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // Show loading indicator while fetching data
  // ---------------------------------------------------------------------------
  
  if (!isCreating && isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading asset details...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NOT FOUND STATE
  // Show error if record doesn't exist
  // ---------------------------------------------------------------------------
  
  if (!isCreating && !asset) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Asset not found</h3>
          <p className="text-muted-foreground mb-4">
            The asset you're looking for doesn't exist.
          </p>
          <Link href="/assets">
            <Button variant="outline">Back to Assets</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // Display the asset detail form
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/assets" className="hover:text-foreground">
          Assets
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isCreating ? "New Asset" : asset?.serialNumber}
        </span>
      </div>

      {/* Page Header with Title and Actions */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-asset-serial-number"
            >
              {isCreating ? "New Asset" : asset?.serialNumber}
            </h1>
            <p
              className="text-muted-foreground"
              data-testid="text-asset-subtitle"
            >
              {isCreating
                ? "Create a new asset"
                : asset?.name || "Asset Details"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-cancel-edit"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isCreating
                    ? "Create Asset"
                    : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-asset"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Resizable Two-Pane Layout */}
      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Pane - Asset Information */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            <Card>
              <CardHeader>
                <CardTitle>Asset Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-1"
                  >
                    {/* Serial Number */}
                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <TextField
                            objectCode="assets"
                            fieldCode="serialNumber"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter serial number"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <TextField
                            objectCode="assets"
                            fieldCode="name"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      
                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <TextField
                            objectCode="assets"
                            fieldCode="description"
                            label="Description"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder=""
                            testId={
                              isEditing
                                ? "input-description"
                                : "text-description"
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <NumberField
                            objectCode="assets"
                            fieldCode="quantity"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            testId={
                              isEditing ? "input-quantity" : "text-quantity"
                            }
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Installation Date */}
                    <FormField
                      control={form.control}
                      name="installationDate"
                      render={({ field }) => (
                        <FormItem>
                          <DateTimeField
                            objectCode="assets"
                            fieldCode="installationDate"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            testId="input-install-date"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Asset Location */}
                    <AddressField
                      form={form}
                      objectCode="assets"
                      fieldCode="location"
                      mode={isEditing ? "edit" : "view"}
                      testId="address-location"
                    />

                    {/* Account Lookup */}
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <LookupFormField
                            objectCode="assets"
                            fieldCode="accountId"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Product Lookup */}
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <LookupFormField
                            objectCode="assets"
                            fieldCode="productId"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Pane - Additional Information */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            {/* Future: Asset history, related items, etc. */}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
