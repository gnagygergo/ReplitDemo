import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Quote,
  type InsertQuote,
  insertQuoteSchema,
  type AccountWithOwner,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileSpreadsheet, Edit, Save, X, Building } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";

interface QuoteHeaderCardProps {
  quoteId: string | null;
  quote: Quote | null;
  isNewQuote: boolean;
  urlCustomerId: string | null;
  onQuoteCreated: (quoteId: string) => void;
  onCancelNewQuote: () => void;
  onEditingChange: (isEditing: boolean) => void;
}

export default function QuoteHeaderCard({
  quoteId,
  quote,
  isNewQuote,
  urlCustomerId,
  onQuoteCreated,
  onCancelNewQuote,
  onEditingChange,
}: QuoteHeaderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<AccountWithOwner | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: customerAccount } = useQuery<AccountWithOwner>({
    queryKey: ["/api/accounts", quote?.customerId],
    enabled: !!quote?.customerId && !isNewQuote && !isEditing,
  });

  const form = useForm<InsertQuote>({
    resolver: zodResolver(insertQuoteSchema),
    defaultValues: {
      quoteName: "",
      customerId: urlCustomerId || "",
      customerName: "",
      customerAddress: "",
      companyId: "",
      sellerName: "",
      sellerAddress: "",
      sellerBankAccount: "",
      sellerEmail: "",
      sellerPhone: "",
      quoteExpirationDate: undefined,
      createdBy: user?.id || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertQuote) => {
      const response = await apiRequest("POST", "/api/quotes", data);
      return response.json();
    },
    onSuccess: (newQuote: Quote) => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      if (urlCustomerId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/accounts", urlCustomerId, "quotes"],
        });
      }
      queryClient.setQueryData(["/api/quotes", newQuote.id], newQuote);
      toast({
        title: "Quote created successfully",
      });
      setIsEditing(false);
      onEditingChange(false);
      onQuoteCreated(newQuote.id);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertQuote) => {
      const response = await apiRequest(
        "PATCH",
        `/api/quotes/${quoteId}`,
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/quotes", quoteId],
      });
      toast({
        title: "Quote updated successfully",
      });
      setIsEditing(false);
      onEditingChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update quote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertQuote) => {
    if (isNewQuote) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (isNewQuote) {
      onCancelNewQuote();
    } else {
      setIsEditing(false);
      onEditingChange(false);
      if (quote) {
        form.reset({
          quoteName: quote.quoteName || "",
          customerId: quote.customerId || "",
          customerName: quote.customerName || "",
          customerAddress: quote.customerAddress || "",
          companyId: quote.companyId || "",
          sellerName: quote.sellerName || "",
          sellerAddress: quote.sellerAddress || "",
          sellerBankAccount: quote.sellerBankAccount || "",
          sellerEmail: quote.sellerEmail || "",
          sellerPhone: quote.sellerPhone || "",
          quoteExpirationDate: quote.quoteExpirationDate || undefined,
          createdBy: quote.createdBy || "",
        });
      }
    }
  };

  const handleEditQuoteHeader = () => {
    setIsEditing(true);
    onEditingChange(true);
  };

  const handleOpenAccountLookup = () => {
    setShowAccountLookup(true);
  };

  const handleAccountSelect = (account: AccountWithOwner) => {
    setSelectedCustomer(account);
    form.setValue("customerId", account.id);
    form.setValue("customerName", account.name);
    form.setValue("customerAddress", account.address || "");
    setShowAccountLookup(false);
  };

  const handleCloseAccountLookup = () => {
    setShowAccountLookup(false);
  };

  useEffect(() => {
    if (quote) {
      form.reset({
        quoteName: quote.quoteName || "",
        customerId: quote.customerId || "",
        customerName: quote.customerName || "",
        customerAddress: quote.customerAddress || "",
        companyId: quote.companyId || "",
        sellerName: quote.sellerName || "",
        sellerAddress: quote.sellerAddress || "",
        sellerBankAccount: quote.sellerBankAccount || "",
        sellerEmail: quote.sellerEmail || "",
        sellerPhone: quote.sellerPhone || "",
        quoteExpirationDate: quote.quoteExpirationDate || undefined,
        createdBy: quote.createdBy || "",
      });
    }
  }, [quote, form]);

  useEffect(() => {
    if (customerAccount) {
      setSelectedCustomer(customerAccount);
    }
  }, [customerAccount]);

  useEffect(() => {
    if (isNewQuote) {
      setIsEditing(true);
      onEditingChange(true);
      form.reset({
        quoteName: "",
        customerId: urlCustomerId || "",
        customerName: "",
        customerAddress: "",
        companyId: "",
        sellerName: "",
        sellerAddress: "",
        sellerBankAccount: "",
        sellerEmail: "",
        sellerPhone: "",
        quoteExpirationDate: undefined,
        createdBy: user?.id || "",
      });
    } else {
      setIsEditing(false);
      onEditingChange(false);
    }
  }, [isNewQuote, urlCustomerId, user, form, onEditingChange]);

  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-quote-name"
            >
              {isNewQuote ? "New Quote" : quote?.quoteName}
            </h1>
            <p className="text-muted-foreground">Quote Details</p>
          </div>
        </div>
      </div>

      {/* Quote Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Quote Details</CardTitle>
          {!isNewQuote && (
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    data-testid="button-cancel-quote-edit"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    data-testid="button-save-quote"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleEditQuoteHeader}
                  data-testid="button-edit-quote-header"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Quote Header
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing || isNewQuote ? (
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quoteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter quote name"
                            data-testid="input-edit-quote-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full justify-start h-auto p-3"
                            onClick={handleOpenAccountLookup}
                            data-testid="button-customer-lookup"
                          >
                            {selectedCustomer ? (
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Building className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col items-start">
                                  <span
                                    className="font-medium"
                                    data-testid={`text-customer-${selectedCustomer.id}`}
                                  >
                                    {selectedCustomer.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {selectedCustomer.industry}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span>Select customer</span>
                              </div>
                            )}
                          </Button>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter customer name"
                            data-testid="input-edit-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter customer address"
                            data-testid="input-edit-customer-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter seller name"
                            data-testid="input-edit-seller-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter seller address"
                            data-testid="input-edit-seller-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerBankAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Bank Account</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter bank account"
                            data-testid="input-edit-seller-bank-account"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="email"
                            placeholder="Enter seller email"
                            data-testid="input-edit-seller-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter seller phone"
                            data-testid="input-edit-seller-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quoteExpirationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="date"
                            data-testid="input-edit-expiration-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {isNewQuote && (
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={createMutation.isPending}
                      data-testid="button-cancel-new-quote"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={createMutation.isPending}
                      data-testid="button-create-quote"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {createMutation.isPending
                        ? "Creating..."
                        : "Create Quote"}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Quote Name
                </label>
                <div
                  className="mt-1 text-foreground"
                  data-testid="text-quote-name-value"
                >
                  {quote?.quoteName}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer
                </label>
                <div
                  className="mt-1 text-foreground"
                  data-testid="text-customer-value"
                >
                  {customerAccount ? (
                    <Link
                      href={`/accounts/${customerAccount.id}`}
                      className="text-primary hover:underline"
                    >
                      {customerAccount.name}
                    </Link>
                  ) : quote?.customerId ? (
                    <Link
                      href={`/accounts/${quote.customerId}`}
                      className="text-primary hover:underline"
                    >
                      {quote.customerName || "View Account"}
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer Name
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.customerName || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer Address
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.customerAddress || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Name
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerName || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Address
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerAddress || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Bank Account
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerBankAccount || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Email
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerEmail || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Phone
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerPhone || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Expiration Date
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.quoteExpirationDate || "N/A"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Lookup Dialog */}
      <AccountLookupDialog
        open={showAccountLookup}
        onClose={handleCloseAccountLookup}
        onSelect={handleAccountSelect}
      />
    </>
  );
}
