import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AccountWithOwner,
  type InsertAccount,
  insertAccountSchema,
  type User,
  type CompanySettingWithMaster,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Building,
  Edit,
  Save,
  X,
  Users,
  User as UserIcon,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import SmartAccountManagementDetailCard from "@/components/accounts/account-cards/smart-account-management-detail-card";
import AccountDetailOwnershipCard from "@/components/accounts/account-cards/account-ownership-detail-card";
import AccountDetailCategorizationCard from "@/components/accounts/account-cards/account-categorization-detail-card";
import AccountOpportunitiesListCard from "@/components/accounts/account-cards/account-opportunities-list-card";
import AccountQuoteListCard from "@/components/accounts/account-cards/account-quote-list-card";

export default function AccountDetail() {
  const [match, params] = useRoute("/accounts/:id");
  const [, setLocation] = useLocation();
  const isCreating = params?.id === "new";
  const [isEditing, setIsEditing] = useState(isCreating);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch account data (skip when creating new account)
  const { data: account, isLoading: isLoadingAccount } =
    useQuery<AccountWithOwner>({
      queryKey: ["/api/accounts", params?.id],
      enabled: !!params?.id && !isCreating,
    });

  // Fetch company settings for smart account management
  const { data: companySettings = [] } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/business-objects/company-settings/account_management"],
  });

  // Helper function to check if a company setting is enabled
  const isSettingEnabled = (settingCode: string): boolean => {
    const setting = companySettings.find((s) => s.settingCode === settingCode);
    return setting?.settingValue?.toLowerCase() === "true";
  };

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      companyRegistrationId: "",
      address: "",
      industry: "tech",
      ownerId: "",
      isPersonAccount: false,
      isSelfEmployed: false,
      isCompanyContact: false,
      isLegalEntity: false,
      isShippingAddress: false,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return await response.json();
    },
    onSuccess: (newAccount: AccountWithOwner) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Account created successfully",
      });
      // Switch to view mode before navigating
      setIsEditing(false);
      // Navigate to the new account's detail page
      setLocation(`/accounts/${newAccount.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
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
    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      // Navigate back to accounts list when canceling creation
      setLocation("/accounts");
    } else {
      setIsEditing(false);
      // Reset form to current account data
      if (account) {
        form.reset({
          name: account.name,
          firstName: account.firstName || "",
          lastName: account.lastName || "",
          email: account.email || "",
          mobilePhone: account.mobilePhone || "",
          companyRegistrationId: account.companyRegistrationId || "",
          address: account.address || "",
          industry: account.industry as "tech" | "construction" | "services",
          ownerId: account.ownerId,
          isPersonAccount: account.isPersonAccount || false,
          isSelfEmployed: account.isSelfEmployed || false,
          isCompanyContact: account.isCompanyContact || false,
          isLegalEntity: account.isLegalEntity || false,
          isShippingAddress: account.isShippingAddress || false,
        });
        setSelectedOwner(account.owner);
      }
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedOwner(user);
    form.setValue("ownerId", user.id);
    setShowUserLookup(false);
  };

  // Helper function to determine which icon to display based on account type
  const getAccountIcon = (account: AccountWithOwner) => {
    const isPerson =
      account.isPersonAccount ||
      account.isCompanyContact ||
      account.isSelfEmployed;
    const isEntity = account.isLegalEntity || account.isShippingAddress;

    if (isPerson) {
      return UserIcon;
    }
    if (isEntity) {
      return Building;
    }
    return Building; // Default to Building
  };

  // Helper function to generate dynamic title text from boolean fields
  const getAccountTypeLabel = (account: AccountWithOwner) => {
    const labels: string[] = [];

    if (account.isPersonAccount) labels.push("Person Account");
    if (account.isCompanyContact) labels.push("Company Contact");
    if (account.isSelfEmployed) labels.push("Self Employed");
    if (account.isLegalEntity) labels.push("Legal Entity");
    if (account.isShippingAddress) labels.push("Shipping Address");

    return labels.length > 0 ? labels.join(" | ") : "Account Details";
  };

  // Initialize form when account data is loaded
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        firstName: account.firstName || "",
        lastName: account.lastName || "",
        email: account.email || "",
        mobilePhone: account.mobilePhone || "",
        companyRegistrationId: account.companyRegistrationId || "",
        address: account.address || "",
        industry: account.industry as "tech" | "construction" | "services",
        ownerId: account.ownerId,
        isPersonAccount: account.isPersonAccount || false,
        isSelfEmployed: account.isSelfEmployed || false,
        isCompanyContact: account.isCompanyContact || false,
        isLegalEntity: account.isLegalEntity || false,
        isShippingAddress: account.isShippingAddress || false,
      });
      setSelectedOwner(account.owner);
    }
  }, [account, form]);

  // Skip loading and not found states when creating new account
  if (!isCreating) {
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
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <Link href="/accounts" className="hover:text-foreground">
          Accounts
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isCreating ? "New Account" : account?.name}
        </span>
      </div>

      {/* Account Headline */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {(() => {
              const IconComponent = account ? getAccountIcon(account) : Building;
              return <IconComponent className="w-6 h-6 text-primary" />;
            })()}
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-foreground"
              data-testid="text-account-name"
            >
              {isCreating ? "New Account" : account?.name}
            </h1>
            <p
              className="text-muted-foreground"
              data-testid="text-account-type-label"
            >
              {isCreating ? "Create a new account" : account && getAccountTypeLabel(account)}
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
                    ? "Create Account" 
                    : "Save Changes"}
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

      {/* Resizable Two-Pane Layout */}
      <PanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Left Pane - Account Information Cards (Vertically Stacked) */}
        <Panel defaultSize={50} minSize={30} maxSize={70}> 
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            <SmartAccountManagementDetailCard
              account={account || null}
              isEditing={isEditing}
              form={form}
              updateMutation={createMutation.isPending || updateMutation.isPending ? updateMutation : updateMutation}
              selectedOwner={selectedOwner}
              setShowUserLookup={setShowUserLookup}
              isSettingEnabled={isSettingEnabled}
            />

            <AccountDetailOwnershipCard
              account={account || null}
              isEditing={isEditing}
              form={form}
              updateMutation={createMutation.isPending || updateMutation.isPending ? updateMutation : updateMutation}
              selectedOwner={selectedOwner}
              setShowUserLookup={setShowUserLookup}
            />

            <AccountDetailCategorizationCard
              account={account || null}
              isEditing={isEditing}
              form={form}
              updateMutation={createMutation.isPending || updateMutation.isPending ? updateMutation : updateMutation}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Pane - Opportunities and Quotes (Vertically Stacked) */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            {!isCreating && params?.id && (
              <>
                <AccountOpportunitiesListCard
                  accountId={params.id}
                  isEditing={isEditing}
                />
                <AccountQuoteListCard
                  accountId={params.id}
                  accountName={account?.name || ""}
                  isEditing={isEditing}
                />
              </>
            )}
          </div>
        </Panel>
      </PanelGroup>

      <UserLookupDialog
        open={showUserLookup}
        onClose={() => setShowUserLookup(false)}
        onSelect={handleUserSelect}
        selectedUserId={selectedOwner?.id}
      />
    </div>
  );
}
