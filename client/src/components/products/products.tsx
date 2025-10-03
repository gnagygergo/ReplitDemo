import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Filter, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { type ProductWithUom } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "@/components/products/product-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<ProductWithUom[]>({
    queryKey: ["/api/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.salesUnitPriceCurrency.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.salesCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (product: ProductWithUom) => {
    if (confirm(`Are you sure you want to delete "${product.productName}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      "Saleable": "bg-green-100 text-green-800",
      "Quoting only": "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={variants[category as keyof typeof variants] || "bg-gray-100 text-gray-800"}>
        {category}
      </Badge>
    );
  };

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Products</h2>
            <p className="text-muted-foreground mt-1">Manage your products and pricing</p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2"
            data-testid="button-create-product"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product</span>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">Search Products</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by name, currency..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-products"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="w-full md:w-48">
                <label className="block text-sm font-medium text-foreground mb-2">Sales Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Saleable">Saleable</SelectItem>
                    <SelectItem value="Quoting only">Quoting only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="secondary" className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/80">
                    <div className="flex items-center space-x-1">
                      <span>Product Name</span>
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/80">
                    <div className="flex items-center space-x-1">
                      <span>Sales Category</span>
                    </div>
                  </TableHead>
                  <TableHead>Sales UoM</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>VAT %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="w-10 h-10 rounded-full mr-3" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="w-12 h-12 text-muted-foreground/50" />
                        <p>No products found</p>
                        <p className="text-sm">Create your first product to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        <Link href={`/products/${product.id}`}>
                          <div className="flex items-center cursor-pointer hover:underline">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <Package className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium" data-testid={`text-product-name-${product.id}`}>
                              {product.productName}
                            </span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(product.salesCategory)}
                      </TableCell>
                      <TableCell data-testid={`text-sales-uom-${product.id}`}>
                        {product.salesUomName}
                      </TableCell>
                      <TableCell data-testid={`text-unit-price-${product.id}`}>
                        {parseFloat(product.salesUnitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell data-testid={`text-currency-${product.id}`}>
                        {product.salesUnitPriceCurrency}
                      </TableCell>
                      <TableCell data-testid={`text-vat-${product.id}`}>
                        {parseFloat(product.vatPercent).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product)}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <ProductForm
        open={showForm}
        onClose={handleCloseForm}
      />
    </>
  );
}
