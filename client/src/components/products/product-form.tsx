import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema, type InsertProduct, type Product, type UnitOfMeasure } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product;
}

export default function ProductForm({ open, onClose, product }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const { data: unitOfMeasures = [] } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/unit-of-measures"],
    enabled: open,
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      salesCategory: product?.salesCategory as "Saleable" | "Quoting only" || "Saleable",
      productName: product?.productName || "",
      salesUomId: product?.salesUomId || "",
      salesUnitPrice: product?.salesUnitPrice ? parseFloat(product.salesUnitPrice) : 0,
      salesUnitPriceCurrency: product?.salesUnitPriceCurrency || "",
      vatPercent: product?.vatPercent ? parseFloat(product.vatPercent) : 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/products/${product.id}`, data);
      } else {
        return apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: `Product ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} product`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  useEffect(() => {
    if (product) {
      form.reset({
        salesCategory: product.salesCategory as "Saleable" | "Quoting only",
        productName: product.productName,
        salesUomId: product.salesUomId,
        salesUnitPrice: parseFloat(product.salesUnitPrice),
        salesUnitPriceCurrency: product.salesUnitPriceCurrency,
        vatPercent: parseFloat(product.vatPercent),
      });
    } else {
      form.reset({
        salesCategory: "Saleable",
        productName: "",
        salesUomId: "",
        salesUnitPrice: 0,
        salesUnitPriceCurrency: "",
        vatPercent: 0,
      });
    }
  }, [product, form]);

  const salesCategoryOptions = [
    { value: "Saleable", label: "Saleable" },
    { value: "Quoting only", label: "Quoting only" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create Product"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="salesCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sales Category <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sales-category">
                        <SelectValue placeholder="Select a sales category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {salesCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Product Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter product name"
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesUomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sales UoM <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-sales-uom">
                        <SelectValue placeholder="Select unit of measure" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {unitOfMeasures.map((uom) => (
                        <SelectItem key={uom.id} value={uom.id}>
                          {uom.uomName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesUnitPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Sales Unit Price <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-sales-unit-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salesUnitPriceCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Currency <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="USD"
                      data-testid="input-currency"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vatPercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    VAT % <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-vat-percent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleClose}
                data-testid="button-cancel-product"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-save-product"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
