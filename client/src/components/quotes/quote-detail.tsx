import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Quote,
  type InsertQuote,
  insertQuoteSchema,
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
import { FileSpreadsheet, Edit, Save, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function QuoteDetail() {
  const [match, params] = useRoute("/quotes/:id");
  const [location, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const isNewQuote = params?.id === "new";
  
  // Extract URL search params for prepopulation
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const urlCustomerId = searchParams.get('customerId');
  const urlAccountName = searchParams.get('accountName');

  const { data: quote, isLoading: isLoadingQuote } = useQuery<Quote>({
    queryKey: ["/api/quotes", params?.id],
    enabled: !!params?.id && !isNewQuote,
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
        queryClient.invalidateQueries({ queryKey: ["/api/accounts", urlCustomerId, "quotes"] });
      }
      queryClient.setQueryData(["/api/quotes", newQuote.id], newQuote);
      toast({
        title: "Quote created successfully",
      });
      setIsEditing(false);
      // Navigate to the quote detail page with the new ID, replacing the current history entry
      navigate(`/quotes/${newQuote.id}`, { replace: true });
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
      const response = await apiRequest("PATCH", `/api/quotes/${params?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/quotes", params?.id],
      });
      toast({
        title: "Quote updated successfully",
      });
      setIsEditing(false);
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
    console.log("DEBUG: Submitting quote data:", data);
    console.log("DEBUG: customerId in submitted data:", data.customerId);
    if (isNewQuote) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (isNewQuote) {
      navigate("/quotes");
    } else {
      setIsEditing(false);
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
    if (isNewQuote) {
      setIsEditing(true);
      // Ensure customerId is set from URL params for new quotes
      if (urlCustomerId) {
        console.log("DEBUG: Setting customerId from URL:", urlCustomerId);
        form.setValue('customerId', urlCustomerId);
        console.log("DEBUG: Form customerId value after setValue:", form.getValues('customerId'));
      } else {
        console.log("DEBUG: No urlCustomerId available");
      }
    } else {
      setIsEditing(false);
    }
  }, [isNewQuote, urlCustomerId, form]);

  if (isLoadingQuote && !isNewQuote) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading quote details...</div>
      </div>
    );
  }

  if (!quote && !isNewQuote) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Quote not found</h3>
          <p className="text-muted-foreground mb-4">
            The quote you're looking for doesn't exist.
          </p>
          <Link href="/quotes">
            <Button variant="outline">Back to Quotes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/quotes" className="hover:text-foreground">
          Quotes
        </Link>
        <span>/</span>
        {urlAccountName && urlCustomerId && (
          <>
            <Link href={`/accounts/${urlCustomerId}`} className="hover:text-foreground">
              {urlAccountName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">
          {isNewQuote ? "New Quote" : quote?.quoteName}
        </span>
      </div>

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
                  : isNewQuote
                  ? "Create Quote"
                  : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              data-testid="button-edit-quote"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quoteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Quote Name
                        </FormLabel>
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
                        <FormLabel>
                          Customer ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="Enter customer ID"
                            data-testid="input-edit-customer-id"
                          />
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
              </form>
            </Form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Quote Name
                </label>
                <div className="mt-1 text-foreground" data-testid="text-quote-name-value">
                  {quote?.quoteName}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer ID
                </label>
                <div className="mt-1 text-foreground" data-testid="text-customer-id-value">
                  {quote?.customerId}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer Name
                </label>
                <div className="mt-1 text-foreground" data-testid="text-customer-name-value">
                  {quote?.customerName || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Customer Address
                </label>
                <div className="mt-1 text-foreground" data-testid="text-customer-address-value">
                  {quote?.customerAddress || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Name
                </label>
                <div className="mt-1 text-foreground" data-testid="text-seller-name-value">
                  {quote?.sellerName || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Address
                </label>
                <div className="mt-1 text-foreground" data-testid="text-seller-address-value">
                  {quote?.sellerAddress || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Bank Account
                </label>
                <div className="mt-1 text-foreground" data-testid="text-seller-bank-account-value">
                  {quote?.sellerBankAccount || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Email
                </label>
                <div className="mt-1 text-foreground" data-testid="text-seller-email-value">
                  {quote?.sellerEmail || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Phone
                </label>
                <div className="mt-1 text-foreground" data-testid="text-seller-phone-value">
                  {quote?.sellerPhone || "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Expiration Date
                </label>
                <div className="mt-1 text-foreground" data-testid="text-expiration-date-value">
                  {quote?.quoteExpirationDate
                    ? format(new Date(quote.quoteExpirationDate), "MMM dd, yyyy")
                    : "N/A"}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created Date
                </label>
                <div className="mt-1 text-foreground" data-testid="text-created-date-value">
                  {quote?.createdDate
                    ? format(new Date(quote.createdDate), "MMM dd, yyyy")
                    : "N/A"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
