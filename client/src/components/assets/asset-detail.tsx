import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AssetWithDetails,
  type InsertAsset,
  insertAssetSchema,
  type Account,
  type Product,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";
import ProductLookupDialog from "@/components/ui/product-lookup-dialog";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { format } from "date-fns";

export default function AssetDetail() {
  const [match, params] = useRoute("/assets/:id");
  const [, setLocation] = useLocation();
  const isCreating = params?.id === "new";
  const [isEditing, setIsEditing] = useState(isCreating);
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [showProductLookup, setShowProductLookup] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch asset data (skip when creating new asset)
  const { data: asset, isLoading: isLoadingAsset } =
    useQuery<AssetWithDetails>({
      queryKey: ["/api/assets", params?.id],
      enabled: !!params?.id && !isCreating,
    });

  const form = useForm<InsertAsset>({
    resolver: zodResolver(insertAssetSchema),
    defaultValues: {
      name: "",
      serialNumber: "",
      description: "",
      quantity: "",
      accountId: "",
      productId: "",
      installationDate: "",
      purchaseDate: "",
      warrantyExpiryDate: "",
      status: "active",
      location: "",
      notes: "",
    },
  });

  // Update form when asset data loads
  useEffect(() => {
    if (asset && !isCreating) {
      form.reset({
        name: asset.name || "",
        serialNumber: asset.serialNumber || "",
        description: asset.description || "",
        quantity: asset.quantity || "",
        accountId: asset.accountId || "",
        productId: asset.productId || "",
        installationDate: asset.installationDate || "",
        purchaseDate: asset.purchaseDate || "",
        warrantyExpiryDate: asset.warrantyExpiryDate || "",
        status: (asset.status as "active" | "inactive" | "retired" | "in_repair") || "active",
        location: asset.location || "",
        notes: asset.notes || "",
      });
      
      if (asset.account) {
        setSelectedAccount(asset.account);
      }
      if (asset.product) {
        setSelectedProduct(asset.product);
      }
    }
  }, [asset, form, isCreating]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertAsset) => {
      const response = await apiRequest("POST", "/api/assets", data);
      return await response.json();
    },
    onSuccess: (newAsset: AssetWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Asset created successfully",
      });
      setIsEditing(false);
      setLocation(`/assets/${newAsset.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAsset>) => {
      const response = await apiRequest("PATCH", `/api/assets/${params?.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets", params?.id] });
      toast({
        title: "Asset updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAsset) => {
    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      setLocation("/assets");
    } else {
      setIsEditing(false);
      if (asset) {
        form.reset({
          name: asset.name || "",
          serialNumber: asset.serialNumber || "",
          description: asset.description || "",
          quantity: asset.quantity || "",
          accountId: asset.accountId || "",
          productId: asset.productId || "",
          installationDate: asset.installationDate || "",
          purchaseDate: asset.purchaseDate || "",
          warrantyExpiryDate: asset.warrantyExpiryDate || "",
          status: (asset.status as "active" | "inactive" | "retired" | "in_repair") || "active",
          location: asset.location || "",
          notes: asset.notes || "",
        });
        if (asset.account) {
          setSelectedAccount(asset.account);
        }
        if (asset.product) {
          setSelectedProduct(asset.product);
        }
      }
    }
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    form.setValue('accountId', account.id);
    setShowAccountLookup(false);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    form.setValue('productId', product.id);
    setShowProductLookup(false);
  };

  if (isLoadingAsset && !isCreating) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link href="/assets">
              <Button variant="ghost" size="sm">
                ← Back to Assets
              </Button>
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="w-6 h-6" />
                {isCreating ? "Create New Asset" : asset?.serialNumber || "Asset Details"}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            {!isCreating && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
                data-testid="button-edit-asset"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <PanelGroup direction="horizontal" className="gap-4">
          <Panel defaultSize={100} minSize={30}>
            <div className="space-y-6">
              {/* Asset Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Serial Number */}
                      <FormField
                        control={form.control}
                        name="serialNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Serial Number *</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field} 
                                  placeholder="Enter serial number"
                                  data-testid="input-serial-number"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-serial-number">
                                  {field.value || '-'}
                                </div>
                              )}
                            </FormControl>
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Textarea 
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter description"
                                  data-testid="input-description"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-description">
                                  {field.value || '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Account */}
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <div className="space-y-2">
                                  {selectedAccount && (
                                    <div className="flex items-center justify-between p-2 border rounded">
                                      <span className="text-sm">{selectedAccount.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedAccount(null);
                                          form.setValue('accountId', '');
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAccountLookup(true)}
                                    data-testid="button-select-account"
                                  >
                                    {selectedAccount ? "Change Account" : "Select Account"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-sm py-2" data-testid="text-account">
                                  {selectedAccount ? (
                                    <Link href={`/accounts/${selectedAccount.id}`}>
                                      <span className="text-primary hover:underline cursor-pointer">
                                        {selectedAccount.name}
                                      </span>
                                    </Link>
                                  ) : '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Product */}
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <div className="space-y-2">
                                  {selectedProduct && (
                                    <div className="flex items-center justify-between p-2 border rounded">
                                      <span className="text-sm">{selectedProduct.productName}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedProduct(null);
                                          form.setValue('productId', '');
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowProductLookup(true)}
                                    data-testid="button-select-product"
                                  >
                                    {selectedProduct ? "Change Product" : "Select Product"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="text-sm py-2" data-testid="text-product">
                                  {selectedProduct ? selectedProduct.productName : '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Purchase Date */}
                      <FormField
                        control={form.control}
                        name="purchaseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Date</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value || ""}
                                  type="date"
                                  data-testid="input-purchase-date"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-purchase-date">
                                  {field.value 
                                    ? format(new Date(field.value), 'MMM d, yyyy')
                                    : '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Warranty Expiry Date */}
                      <FormField
                        control={form.control}
                        name="warrantyExpiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warranty Expiry Date</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value || ""}
                                  type="date"
                                  data-testid="input-warranty-expiry-date"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-warranty-expiry-date">
                                  {field.value 
                                    ? format(new Date(field.value), 'MMM d, yyyy')
                                    : '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Status */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status *</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger data-testid="select-status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                    <SelectItem value="in_repair">In Repair</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="text-sm py-2" data-testid="text-status">
                                  <Badge variant={field.value === 'active' ? 'default' : 'secondary'}>
                                    {field.value}
                                  </Badge>
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Location */}
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter location"
                                  data-testid="input-location"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-location">
                                  {field.value || '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Notes */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Textarea 
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter notes"
                                  data-testid="input-notes"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-notes">
                                  {field.value || '-'}
                                </div>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Action Buttons */}
                      {isEditing && (
                        <div className="flex gap-2 pt-4">
                          <Button 
                            type="submit" 
                            disabled={createMutation.isPending || updateMutation.isPending}
                            data-testid="button-save-asset"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {createMutation.isPending || updateMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={createMutation.isPending || updateMutation.isPending}
                            data-testid="button-cancel"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Account Lookup Dialog */}
      <AccountLookupDialog
        open={showAccountLookup}
        onClose={() => setShowAccountLookup(false)}
        onSelect={handleAccountSelect}
      />

      {/* Product Lookup Dialog */}
      <ProductLookupDialog
        open={showProductLookup}
        onClose={() => setShowProductLookup(false)}
        onSelect={handleProductSelect}
      />
    </>
  );
}
