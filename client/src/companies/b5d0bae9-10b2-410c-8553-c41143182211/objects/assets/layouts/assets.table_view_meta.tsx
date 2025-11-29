/**
 * assets.table_view_meta.tsx
 * 
 * PURPOSE:
 * This is the table/list view layout for the Assets object. It displays a
 * searchable, sortable list of all assets with actions for viewing, editing,
 * and deleting.
 * 
 * ARCHITECTURE:
 * This layout receives all its dependencies via props from ObjectListPage,
 * eliminating the need for individual import statements. This pattern:
 * 1. Reduces import clutter
 * 2. Ensures consistency across layouts
 * 3. Makes layouts more portable and testable
 * 
 * DEPENDENCIES:
 * - deps.components: UI components (Button, Card, Table, etc.)
 * - deps.fields: Field components (TextField, NumberField, etc.)
 * - deps.icons: Lucide icons
 * - deps.routing: Navigation utilities (Link)
 * - deps.hooks: Custom hooks including useObjectList
 * 
 * USAGE:
 * This component is loaded dynamically by ObjectListPage and receives:
 * - deps: The layout dependencies bundle
 * - objectCode: 'assets'
 */

import type { LayoutDependencies } from "@/lib/layoutDependencies";
import type { AssetWithDetails } from "@shared/schema";

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface AssetsTableProps {
  /** Pre-bundled dependencies (components, hooks, icons, etc.) */
  deps: LayoutDependencies;
  /** The object code (should be 'assets') */
  objectCode: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function Assets({ deps, objectCode }: AssetsTableProps) {
  // ---------------------------------------------------------------------------
  // DESTRUCTURE DEPENDENCIES
  // Extract what we need from the dependencies bundle
  // ---------------------------------------------------------------------------
  
  const { 
    Button, Input, Card, CardContent, Skeleton,
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
  } = deps.components;
  const { TextField, NumberField, DateTimeField, LookupFormField, CheckboxField } = deps.fields;
  const { Package, Search, Plus, Edit, Trash2, ArrowUp, ArrowDown } = deps.icons;
  const { Link } = deps.routing;
  const { useObjectList, useSortDirection } = deps.hooks;

  // ---------------------------------------------------------------------------
  // DATA & STATE MANAGEMENT
  // Use the generic useObjectList hook for fetching and managing the list
  // ---------------------------------------------------------------------------
  
  const {
    records: assets,
    isLoading,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSort,
    handleDelete,
  } = useObjectList<AssetWithDetails>({
    objectCode,
    defaultSortBy: "serialNumber",
    labelSingular: "Asset",
    labelPlural: "Assets",
  });

  // Helper to get sort direction for a column
  const getSortDirection = useSortDirection(sortBy, sortOrder);

  // ---------------------------------------------------------------------------
  // HELPER FUNCTION
  // Render sort indicator icon for table headers
  // ---------------------------------------------------------------------------
  
  const getSortIcon = (column: string) => {
    const direction = getSortDirection(column);
    if (!direction) return null;
    return direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline" />
    );
  };

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assets</h2>
        </div>
        <Link href="/assets/new">
          <Button
            className="flex items-center space-x-2"
            data-testid="button-create-asset"
          >
            <Plus className="w-4 h-4" />
            <span>Create Asset</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search Assets
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by serial number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-assets"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            // Loading State
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by creating your first asset"}
              </p>
              <Link href="/assets/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Asset
                </Button>
              </Link>
            </div>
          ) : (
            // Data Table
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("serialNumber")}
                      data-testid="header-serial-number"
                    >
                      Serial Number {getSortIcon("serialNumber")}
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort("installationDate")}
                      data-testid="header-installation-date"
                    >
                      Installation Date {getSortIcon("installationDate")}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      data-testid={`row-asset-${asset.id}`}
                    >
                      {/* Serial Number - Clickable Link */}
                      <TableCell className="font-medium">
                        <TextField
                          mode="table"
                          objectCode="assets"
                          fieldCode="serialNumber"
                          value={asset.serialNumber}
                          linkPath="/assets"
                          recordId={asset.id}
                        />
                      </TableCell>
                      
                      {/* Name */}
                      <TableCell>
                        <TextField
                          mode="table"
                          objectCode="assets"
                          fieldCode="name"
                          value={asset.name || "-"}
                        />
                      </TableCell>
                      
                      {/* Description */}
                      <TableCell>
                        <TextField
                          mode="table"
                          value={asset.description || ""}
                          objectCode="assets"
                          fieldCode="description"
                          testId={`text-description-${asset.id}`}
                        />
                      </TableCell>
                      
                      {/* Account Lookup */}
                      <TableCell>
                        <LookupFormField
                          mode="table"
                          objectCode="assets"
                          fieldCode="accountId"
                          value={asset.accountId}
                          onRecordClick={(id) => window.location.href = `/accounts/${id}`}
                        />
                      </TableCell>
                      
                      {/* Product Lookup */}
                      <TableCell>
                        <LookupFormField
                          mode="table"
                          objectCode="assets"
                          fieldCode="productId"
                          value={asset.productId}
                          onRecordClick={(id) => window.location.href = `/products/${id}`}
                        />
                      </TableCell>
                      
                      {/* Quantity */}
                      <TableCell>
                        <NumberField
                          mode="table"
                          objectCode="assets"
                          fieldCode="quantity"
                          value={asset.quantity != null ? Number(asset.quantity) : null}
                        />
                      </TableCell>
                      
                      {/* Installation Date */}
                      <TableCell>
                        <DateTimeField
                          mode="table"
                          value={asset.installationDate}
                          testId={`text-quantity-${asset.id}`}
                          objectCode="assets"
                          fieldCode="installationDate"
                        />  
                      </TableCell>
                      
                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/assets/${asset.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              data-testid={`button-edit-${asset.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset, asset.serialNumber)}
                            data-testid={`button-delete-${asset.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
