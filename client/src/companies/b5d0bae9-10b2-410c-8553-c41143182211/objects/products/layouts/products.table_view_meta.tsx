// Standardized Layout
import type { LayoutDependencies } from "@/lib/layoutDependencies";
import type { Product } from "@shared/schema";


interface ProductsTableProps {
  /** Pre-bundled dependencies (components, hooks, icons, etc.) */
  deps: LayoutDependencies;
  /** The object code (should be 'products') */
  objectCode: string;
}


export default function Products({ deps, objectCode }: ProductsTableProps) {

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
    records: products,
    isLoading,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSort,
    handleDelete,
  } = useObjectList<Product>({
    objectCode,
    defaultSortBy: "serialNumber",
    labelSingular: "Product",
    labelPlural: "Products",
  });

  const getSortDirection = useSortDirection(sortBy, sortOrder);
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
  // ------

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
        </div>
        <Link href="/products/new">
          <Button
            className="flex items-center space-x-2"
            data-testid="button-create-asset"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Search Products
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by product name or other attributes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
          </div>
        </CardContent>
      </Card>
       {/* Products Table */}
            <Card>
              <CardContent className="pt-6">
                {isLoading ? (
                  // Loading State
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  // Empty State
                  <div className="text-center py-12">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : "Get started by creating your first asset"}
                    </p>
                    <Link href="/products/new">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Product
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // Data Table
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          
                          <TableHead>Name</TableHead>
                          <TableHead>UoM</TableHead>
                          
                          
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow
                            key={product.name}
                            data-testid={`row-asset-${product.id}`}
                          >
                            

                            {/* Name */}
                            <TableCell>
                              <TextField
                                mode="table"
                                objectCode="product"
                                fieldCode="name"
                                value={product.name || "-"}
                                linkPath="/products"
                                recordId={product.id}
                              />
                            </TableCell>
                            
                            {/* UoM */}
                            <TableCell>
                              <LookupFormField
                                mode="table"
                                objectCode="products"
                                fieldCode="salesUomId"
                                value={product.salesUomId || "-"}
                                onRecordClick={(id) => window.location.href = `/accounts/${id}`}
                              />
                            </TableCell>

                      

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/products/${product.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-edit-${product.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(product, product.id)}
                                  data-testid={`button-delete-${product.id}`}
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