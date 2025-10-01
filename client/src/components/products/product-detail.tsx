import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ProductWithUom,
  type InsertProduct,
  insertProductSchema,
  type UnitOfMeasure,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Package, Edit, Save, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:id");
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: product, isLoading: isLoadingProduct } = useQuery<ProductWithUom>({
    queryKey: ["/api/products", params?.id],
    enabled: !!params?.id,
  });

  const { data: unitOfMeasures = [] } = useQuery<UnitOfMeasure[]>({
    queryKey: ["/api/unit-of-measures"],
    enabled: isEditing,
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      salesCategory: "Saleable",
      productName: "",
      salesUomId: "",
      salesUnitPrice: 0,
      salesUnitPriceCurrency: "",
      vatPercent: 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      return apiRequest("PATCH", `/api/products/${params?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/products", params?.id],
      });
      toast({
        title: "Product updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (product) {
      form.reset({
        salesCategory: product.salesCategory as "Saleable" | "Quoting only",
        productName: product.productName,
        salesUomId: product.salesUomId,
        salesUnitPrice: parseFloat(product.salesUnitPrice),
        salesUnitPriceCurrency: product.salesUnitPriceCurrency,
        vatPercent: parseFloat(product.vatPercent),
      });
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    const variants = {
      "Saleable": "bg-green-100 text-green-800",
      "Quoting only": "bg-blue-100 text-blue-800",
    };
    return variants[category as keyof typeof variants] || "bg-gray-100 text-gray-800";
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
    }
  }, [product, form]);

  if (isLoadingProduct) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading product details...</div>
      </div>
    );
  }

  if (!product) {
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

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{product.productName}</span>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-product-name"
            >
              {product.productName}
            </h1>
            <p className="text-muted-foreground">Product Details</p>
          </div>
        </div>

        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                data-testid="button-cancel-edit"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={updateMutation.isPending}
                data-testid="button-save-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
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

      <PanelGroup direction="horizontal" className="min-h-[600px]">
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form className="space-y-6">
                    <FormField
                      control={form.control}
                      name="salesCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Sales Category <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-sales-category">
                                <SelectValue placeholder="Select a sales category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Saleable">Saleable</SelectItem>
                              <SelectItem value="Quoting only">Quoting only</SelectItem>
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
                              data-testid="input-edit-product-name"
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-sales-uom">
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
                              data-testid="input-edit-sales-unit-price"
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
                              data-testid="input-edit-currency"
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
                              data-testid="input-edit-vat-percent"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sales Category
                    </label>
                    <div
                      className="mt-1"
                      data-testid="text-sales-category-value"
                    >
                      <Badge className={getCategoryBadgeClass(product.salesCategory)}>
                        {product.salesCategory}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Product Name
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-product-name-value"
                    >
                      {product.productName}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sales UoM
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-sales-uom-value"
                    >
                      {product.salesUomName}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Sales Unit Price
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-sales-unit-price-value"
                    >
                      {parseFloat(product.salesUnitPrice).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Currency
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-currency-value"
                    >
                      {product.salesUnitPriceCurrency}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      VAT %
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-vat-percent-value"
                    >
                      {parseFloat(product.vatPercent).toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Panel>

        <PanelResizeHandle className="w-2 bg-background hover:bg-muted-foreground/20 transition-colors" />

        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <Card>
            <CardHeader>
              <CardTitle>Related Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>No additional information available</p>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </PanelGroup>
    </div>
  );
}
