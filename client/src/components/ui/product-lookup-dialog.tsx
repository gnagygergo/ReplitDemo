import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package } from "lucide-react";
import { type Product } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ProductLookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  selectedProductId?: string;
}

export default function ProductLookupDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedProductId 
}: ProductLookupDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(selectedProductId || "");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  // Update selected ID when prop changes
  useEffect(() => {
    setSelectedId(selectedProductId || "");
  }, [selectedProductId]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.salesCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    const selectedProduct = products.find(product => product.id === selectedId);
    if (selectedProduct) {
      onSelect(selectedProduct);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handleRowClick = (productId: string) => {
    setSelectedId(productId);
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Product Lookup</DialogTitle>
          <DialogDescription>
            Search and select a product to add to the quote line.
          </DialogDescription>
        </DialogHeader>

        {/* Search Box */}
        <div className="flex items-center space-x-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
              autoFocus
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>VAT %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      {searchTerm ? `No products found matching "${searchTerm}"` : "No products available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedId === product.id ? 'bg-muted/30' : ''}`}
                      onClick={() => handleRowClick(product.id)}
                      data-testid={`row-product-${product.id}`}
                    >
                      <TableCell>
                        <RadioGroupItem 
                          value={product.id} 
                          id={product.id}
                          data-testid={`radio-product-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={product.id} 
                          className="font-medium cursor-pointer"
                          data-testid={`text-product-name-${product.id}`}
                        >
                          {product.productName}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={product.id} 
                          className="cursor-pointer"
                        >
                          {getCategoryBadge(product.salesCategory)}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={product.id} 
                          className="cursor-pointer text-muted-foreground"
                        >
                          {product.salesUnitPrice} {product.salesUnitPriceCurrency}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={product.id} 
                          className="cursor-pointer text-muted-foreground"
                        >
                          {product.vatPercent}%
                        </Label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            data-testid="button-cancel-lookup"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedId || isLoading}
            data-testid="button-select-product"
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
