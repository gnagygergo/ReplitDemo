// It’s called a React Hook, and its purpose is: To let functional components store and manage state (data that can change over time).
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Quote,
  type InsertQuote,
  insertQuoteSchema,
  type AccountWithOwner,
  type User,
  type Company,
  type CompanySetting,
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
import { FileSpreadsheet, Edit, Save, X, Building, User as UserIcon } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

// TypeScript interface, it defines the shape of the props (inputs) that the QuoteHeaderCard React component expects from its parent
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
  // Local state variables. The component’s “setup phase” or “hook initialization block”. It’s the section where React Hooks and local state variables are declared and initialized.
 // useState returns 2 values, the first is the STATE, and the second is a function to change that. Here, each returned value is saved into a variable: isEditing and setIsEditing. Later we can call setIsEditing to change the value of isEditing.
  const [isEditing, setIsEditing] = useState(false);
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<AccountWithOwner | null>(null);
  const [selectedSalesRep, setSelectedSalesRep] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: customerAccount } = useQuery<AccountWithOwner>({
    queryKey: ["/api/accounts", quote?.customerId],
    enabled: !!quote?.customerId && !isNewQuote && !isEditing,
  });

  // Fetch customer account when creating a new quote from an account detail page
  const { data: urlCustomerAccount } = useQuery<AccountWithOwner>({
    queryKey: ["/api/accounts", urlCustomerId],
    enabled: !!urlCustomerId && isNewQuote,
  });

  // Fetch my company details to populate seller fields
  const { data: myCompany } = useQuery<Company>({
    queryKey: ["/api/auth/my-company"],
    enabled: isNewQuote || isEditing,
  });

  // Fetch sales rep user details when quote has sellerUserId
  const { data: salesRepUser } = useQuery<User>({
    queryKey: ["/api/users", quote?.sellerUserId],
    enabled: !!quote?.sellerUserId && !isNewQuote && !isEditing,
  });

  // Fetch company setting for quote customer requirement
  const { data: quoteCustomerSettings = [] } = useQuery<CompanySetting[]>({
    queryKey: ["/api/business-objects/company-settings/by-prefix/general_quote_setting_allow_quote_creation_without_customerKey"],
  });
  
  const allowQuoteWithoutCustomer = quoteCustomerSettings[0]?.settingValue === "true";

  // Create conditional schema based on company setting
  const quoteSchema = insertQuoteSchema.refine(
    (data) => {
      // If setting is false (don't allow quotes without customer), customerId is required
      if (!allowQuoteWithoutCustomer) {
        return data.customerId !== "" && data.customerId !== null;
      }
      return true;
    },
    {
      message: "Customer is required",
      path: ["customerId"],
    }
  );

  const form = useForm<InsertQuote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      quoteName: "",
      customerId: urlCustomerId || "",
      customerName: "",
      customerAddress: "",
      companyId: "",
      sellerName: "",
      sellerAddress: "",
      sellerBankAccount: "",
      sellerUserId: user?.id || "",
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
          sellerUserId: quote.sellerUserId || "",
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

  const handleOpenUserLookup = () => {
    setShowUserLookup(true);
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedSalesRep(selectedUser);
    form.setValue("sellerUserId", selectedUser.id);
    
    // Populate seller phone and email from selected user
    form.setValue("sellerEmail", selectedUser.email || "");
    form.setValue("sellerPhone", selectedUser.phone || "");
    
    setShowUserLookup(false);
  };

  const handleCloseUserLookup = () => {
    setShowUserLookup(false);
  };

  const getUserDisplayName = (user: User | null) => {
    if (!user) return "";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
  };

  const getUserInitials = (user: User | null) => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
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
        sellerUserId: quote.sellerUserId || "",
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

  // Set sales rep from fetched data
  useEffect(() => {
    if (salesRepUser) {
      setSelectedSalesRep(salesRepUser);
    }
  }, [salesRepUser]);

  // Populate customer details when creating a new quote from an account
  useEffect(() => {
    if (urlCustomerAccount && isNewQuote) {
      setSelectedCustomer(urlCustomerAccount);
      form.setValue("customerName", urlCustomerAccount.name);
      form.setValue("customerAddress", urlCustomerAccount.address || "");
    }
  }, [urlCustomerAccount, isNewQuote, form]);

  // Populate company and seller fields from company data
  useEffect(() => {
    if (myCompany && (isNewQuote || isEditing)) {
      form.setValue("sellerName", myCompany.companyOfficialName || "");
      form.setValue("sellerAddress", myCompany.address || "");
      form.setValue("sellerBankAccount", myCompany.bankAccountNumber || "");
    }
  }, [myCompany, isNewQuote, isEditing, form]);

  // Set current user as default sales rep for new quotes and populate their email/phone
  useEffect(() => {
    if (user && isNewQuote) {
      setSelectedSalesRep(user);
      form.setValue("sellerUserId", user.id);
      form.setValue("sellerEmail", user.email || "");
      form.setValue("sellerPhone", user.phone || "");
    }
  }, [user, isNewQuote, form]);

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
        sellerUserId: user?.id || "",
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
                  {/* Column 1 */}
                  <div className="flex flex-col gap-6">
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
                          <FormLabel>Customer Link</FormLabel>
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
                              onChange={(e) => {
                                field.onChange(e);

                                // Get current date in 'en-US' format so that Quote Name field can be auto-filled
                                const today = new Date();
                                const formattedDate = today.toLocaleDateString("hu-HU", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                });

                                // Combine customer name + date
                                const newQuoteName = `${e.target.value} ${formattedDate}`.trim();
                                form.setValue("quoteName", newQuoteName);
                              }}
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
                      name="quoteExpirationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Expiration Date</FormLabel>
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

                  {/* Column 2 */}
                  <div className="flex flex-col gap-6">
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
                              placeholder="Populated from company"
                              data-testid="input-edit-seller-name"
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sellerUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sales Representative</FormLabel>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start h-auto p-3"
                              onClick={handleOpenUserLookup}
                              data-testid="button-sales-rep-lookup"
                            >
                              {selectedSalesRep ? (
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedSalesRep.profileImageUrl || undefined} />
                                    <AvatarFallback className="text-xs bg-muted">
                                      {getUserInitials(selectedSalesRep)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col items-start">
                                    <span
                                      className="font-medium"
                                      data-testid={`text-sales-rep-${selectedSalesRep.id}`}
                                    >
                                      {getUserDisplayName(selectedSalesRep)}
                                    </span>
                                    
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                  <UserIcon className="h-4 w-4" />
                                  <span>Select sales representative</span>
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
                      name="sellerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seller Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="Populated from sales rep"
                              data-testid="input-edit-seller-phone"
                              disabled
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
                              placeholder="Populated from sales rep"
                              data-testid="input-edit-seller-email"
                              disabled
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
                              placeholder="Populated from company"
                              data-testid="input-edit-seller-address"
                              disabled
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
                              placeholder="Populated from company"
                              data-testid="input-edit-seller-bank-account"
                              disabled
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
              {/* First column (view mode) */}
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

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Customer Link
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

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Customer Name
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.customerName || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Customer Address
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.customerAddress || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Quote Expiration Date
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.quoteExpirationDate || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Quote Creation Date
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.createdDate
                    ? new Date(quote.createdDate).toLocaleDateString("hu-HU", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </div>
              </div>

              {/* Second column (view mode) */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Seller Name
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerName || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Sales Representative
                </label>
                <div className="mt-1 text-foreground">
                  {selectedSalesRep ? (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={selectedSalesRep.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-muted">
                          {getUserInitials(selectedSalesRep)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{getUserDisplayName(selectedSalesRep)}</span>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Seller Phone
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerPhone || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Seller Email
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerEmail || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Seller Address
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerAddress || "N/A"}
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-4 block">
                  Seller Bank Account
                </label>
                <div className="mt-1 text-foreground">
                  {quote?.sellerBankAccount || "N/A"}
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

      {/* User Lookup Dialog */}
      <UserLookupDialog
        open={showUserLookup}
        onClose={handleCloseUserLookup}
        onSelect={handleUserSelect}
        selectedUserId={form.getValues("sellerUserId") || undefined}
      />
    </>
  );
}
