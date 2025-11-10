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
import { Package, Edit, Save, X, Building } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";
import ProductLookupDialog from "@/components/ui/product-lookup-dialog";
import { LookupField } from "@/components/ui/lookup-field";
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
      quantity: null,
      accountId: "",
      productId: "",
      installationDate: null,
    },
  });

  // Update form when asset data loads
  useEffect(() => {
    if (asset && !isCreating) {
      form.reset({
        name: asset.name || "",
        serialNumber: asset.serialNumber || "",
        description: asset.description || "",
        quantity: asset.quantity != null ? parseFloat(asset.quantity) : null,
        accountId: asset.accountId || "",
        productId: asset.productId || "",
        installationDate: asset.installationDate || null,
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
          quantity: asset.quantity != null ? parseFloat(asset.quantity) : null,
          accountId: asset.accountId || "",
          productId: asset.productId || "",
          installationDate: asset.installationDate || null,
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

  if (!isCreating) {
    if (isLoadingAsset) {
      return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">Loading asset details...</div>
        </div>
      );
    }

    if (!asset) {
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
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/assets" className="hover:text-foreground">
          Assets
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isCreating ? "New Asset" : asset?.serialNumber}
        </span>
      </div>

      {/* Asset Headline */}
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
            <p className="text-muted-foreground" data-testid="text-asset-subtitle">
              {isCreating ? "Create a new asset" : asset?.name || "Asset Details"}
            </p>
          </div>
        </div>

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
        {/* Left Pane - Asset Information Cards */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
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

                      {/* Name */}
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Enter name"
                                  data-testid="input-name"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-name">
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

                      {/* Quantity */}
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value ?? ""}
                                  type="number"
                                  placeholder="Enter quantity"
                                  data-testid="input-quantity"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-quantity">
                                  {field.value ?? '-'}
                                </div>
                              )}
                            </FormControl>
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
                            <FormLabel>Installation Date</FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input 
                                  {...field}
                                  value={field.value instanceof Date 
                                    ? field.value.toISOString().split('T')[0] 
                                    : field.value || ""}
                                  type="date"
                                  data-testid="input-installation-date"
                                />
                              ) : (
                                <div className="text-sm py-2" data-testid="text-installation-date">
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

                      {/* Account */}
                      <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <FormControl>
                              <LookupField
                                mode={isEditing ? "edit" : "view"}
                                value={selectedAccount ? { id: selectedAccount.id, name: selectedAccount.name } : null}
                                onOpenLookup={() => setShowAccountLookup(true)}
                                onClear={isEditing ? () => {
                                  setSelectedAccount(null);
                                  form.setValue('accountId', '');
                                } : undefined}
                                placeholder="Select account"
                                icon={<Building className="w-4 h-4" />}
                                linkPath="/accounts"
                                testId={isEditing ? "button-select-account" : "text-account"}
                                valueTestIdPrefix="account"
                                ariaLabel="Open account lookup dialog"
                              />
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
                              <LookupField
                                mode={isEditing ? "edit" : "view"}
                                value={selectedProduct ? { id: selectedProduct.id, name: selectedProduct.productName } : null}
                                onOpenLookup={() => setShowProductLookup(true)}
                                onClear={isEditing ? () => {
                                  setSelectedProduct(null);
                                  form.setValue('productId', '');
                                } : undefined}
                                placeholder="Select Product"
                                icon={<Building className="w-4 h-4" />}
                                linkPath="/products"
                                testId={isEditing ? "button-select-product" : "text-product"}
                                valueTestIdPrefix="product"
                                ariaLabel="Open product lookup dialog"
                              />
                            </FormControl>
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

          {/* Right Pane - Additional Information (Future Use) */}
          <Panel defaultSize={50} minSize={30} maxSize={70}>
            <div className="flex flex-col gap-6 h-full overflow-auto p-4">
              {/* Future: Asset history, related items, etc. */}
            </div>
          </Panel>
        </PanelGroup>

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
    </div>
  );
}
