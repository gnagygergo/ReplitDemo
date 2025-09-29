import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AccountWithOwner,
  type InsertAccount,
  insertAccountSchema,
  type User,
  type OpportunityWithAccountAndOwner,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building, Edit, Save, X, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

export default function AccountDetail() {
  const [match, params] = useRoute("/accounts/:id");
  const [isEditing, setIsEditing] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch account data
  const { data: account, isLoading: isLoadingAccount } =
    useQuery<AccountWithOwner>({
      queryKey: ["/api/accounts", params?.id],
      enabled: !!params?.id,
    });

  // Fetch opportunities for this account
  const { data: opportunities = [], isLoading: isLoadingOpportunities } =
    useQuery<OpportunityWithAccountAndOwner[]>({
      queryKey: ["/api/accounts", params?.id, "opportunities"],
      enabled: !!params?.id,
    });

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: "",
      address: "",
      industry: "tech",
      ownerId: "",
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      return apiRequest("PATCH", `/api/accounts/${params?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts", params?.id],
      });
      toast({
        title: "Account updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAccount) => {
    updateMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to current account data
    if (account) {
      form.reset({
        name: account.name,
        address: account.address || "",
        industry: account.industry as "tech" | "construction" | "services",
        ownerId: account.ownerId,
      });
      setSelectedOwner(account.owner);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedOwner(user);
    form.setValue("ownerId", user.id);
    setShowUserLookup(false);
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || "Unknown User";
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getIndustryLabel = (industry: string) => {
    const labels = {
      tech: "Technology",
      construction: "Construction",
      services: "Services",
    };
    return labels[industry as keyof typeof labels] || industry;
  };

  const getIndustryBadgeClass = (industry: string) => {
    const variants = {
      tech: "bg-blue-100 text-blue-800",
      construction: "bg-orange-100 text-orange-800",
      services: "bg-green-100 text-green-800",
    };
    return (
      variants[industry as keyof typeof variants] || "bg-gray-100 text-gray-800"
    );
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Initialize form when account data is loaded
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        address: account.address || "",
        industry: account.industry as "tech" | "construction" | "services",
        ownerId: account.ownerId,
      });
      setSelectedOwner(account.owner);
    }
  }, [account, form]);

  if (isLoadingAccount) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading account details...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Account not found</h3>
          <p className="text-muted-foreground mb-4">
            The account you're looking for doesn't exist.
          </p>
          <Link href="/accounts">
            <Button variant="outline">Back to Accounts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/accounts" className="hover:text-foreground">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{account.name}</span>
      </div>

      {/* Account Headline */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-account-name"
            >
              {account.name}
            </h1>
            <p className="text-muted-foreground">Account Details</p>
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
              data-testid="button-edit-account"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Pane */}
        <div className="col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Account Name{" "}
                            <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter account name"
                              data-testid="input-edit-account-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Industry <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-industry">
                                <SelectValue placeholder="Select an industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="tech">Technology</SelectItem>
                              <SelectItem value="construction">
                                Construction
                              </SelectItem>
                              <SelectItem value="services">Services</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value || ""}
                              rows={3}
                              placeholder="Enter full address"
                              className="resize-none"
                              data-testid="input-edit-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Owner <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start h-auto p-3"
                              onClick={() => setShowUserLookup(true)}
                              data-testid="button-edit-owner-lookup"
                            >
                              {selectedOwner ? (
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        selectedOwner.profileImageUrl ||
                                        undefined
                                      }
                                    />
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(selectedOwner)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col items-start">
                                    <span
                                      className="font-medium"
                                      data-testid={`text-edit-owner-${selectedOwner.id}`}
                                    >
                                      {getUserDisplayName(selectedOwner)}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {selectedOwner.email}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  <span>Select owner</span>
                                </div>
                              )}
                            </Button>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  {/* Account Name */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Name
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-account-name-value"
                    >
                      {account.name}
                    </div>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Industry
                    </label>
                    <div
                      className="mt-1"
                      data-testid="text-account-industry-value"
                    >
                      <Badge
                        className={getIndustryBadgeClass(account.industry)}
                      >
                        {getIndustryLabel(account.industry)}
                      </Badge>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Address
                    </label>
                    <div
                      className="mt-1 text-foreground whitespace-pre-wrap"
                      data-testid="text-account-address-value"
                    >
                      {account.address || "No address provided"}
                    </div>
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Account Owner
                    </label>
                    <div
                      className="mt-1 flex items-center space-x-3"
                      data-testid="text-account-owner-value"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={account.owner?.profileImageUrl || undefined}
                        />
                        <AvatarFallback>
                          {getUserInitials(account.owner)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {getUserDisplayName(account.owner)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.owner?.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Pane */}
        <div className="col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Opportunities</span>
                <Badge variant="secondary" className="ml-2">
                  {opportunities.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOpportunities ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-pulse">Loading opportunities...</div>
                </div>
              ) : opportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No opportunities found for this account</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opportunity Name</TableHead>
                        <TableHead>Close Date</TableHead>
                        <TableHead className="text-right">
                          Total Revenue
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {opportunities.map((opportunity) => (
                        <TableRow
                          key={opportunity.id}
                          data-testid={`row-opportunity-${opportunity.id}`}
                        >
                          <TableCell
                            className="font-medium"
                            data-testid={`text-opportunity-name-${opportunity.id}`}
                          >
                            {opportunity.name}
                          </TableCell>
                          <TableCell
                            data-testid={`text-opportunity-close-date-${opportunity.id}`}
                          >
                            {formatDate(opportunity.closeDate)}
                          </TableCell>
                          <TableCell
                            className="text-right font-medium"
                            data-testid={`text-opportunity-revenue-${opportunity.id}`}
                          >
                            {formatCurrency(opportunity.totalRevenue)}
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
      </div>

      <UserLookupDialog
        open={showUserLookup}
        onClose={() => setShowUserLookup(false)}
        onSelect={handleUserSelect}
        selectedUserId={selectedOwner?.id}
      />
    </div>
  );
}
