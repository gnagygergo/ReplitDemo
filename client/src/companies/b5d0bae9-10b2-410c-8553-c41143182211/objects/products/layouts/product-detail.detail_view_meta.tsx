// Standardized Layout
import type { LayoutDependencies } from "@/lib/layoutDependencies";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface ProductDetailProps {
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

export default function ProductDetail({ deps, objectCode, id }: ProductDetailProps) {
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
    record: product,
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
    labelSingular: "Product",
    labelPlural: "Products",
  });

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // Show loading indicator while fetching data
  // ---------------------------------------------------------------------------
  
  if (!isCreating && isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading product details...</div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // NOT FOUND STATE
  // Show error if record doesn't exist
  // ---------------------------------------------------------------------------
  
  if (!isCreating && !product) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Product not found</h3>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist.
          </p>
          <Link href="/products">
            <Button variant="outline">Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // Display the product detail form
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isCreating ? "New Product" : product?.name}
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
              data-testid="text-product-serial-number"
            >
              {isCreating ? "New Product" : product?.name}
            </h1>
            <p
              className="text-muted-foreground"
              data-testid="text-product-subtitle"
            >
              {isCreating
                ? "Create a new product"
                : product?.name || "Product Details"}
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
                    ? "Create Product"
                    : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-product"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Resizable Two-Pane Layout */}
      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Pane - Product Information */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-1"
                  >
                    {/* Product Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <TextField
                            objectCode="products"
                            fieldCode="name"
                            mode={isEditing ? "edit" : "view"}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Enter product name"
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
            {/* Future: Product history, related items, etc. */}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
