import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AccountWithOwner,
  type InsertAccount,
  insertAccountSchema,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Building, Edit, Save, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { getAccountIcon, getAccountTypeLabel } from "@/lib/account-helpers";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useObjectFieldTypes } from "@/hooks/use-object-field-types";
import { buildDefaultFormValues, transformRecordToFormValues } from "@/lib/form-utils";
import SmartAccountManagementDetailCard from "./account-cards/smart-account-management-detail-card";
import AccountDetailOwnershipCard from "./account-cards/account-ownership-detail-card";
import AccountDetailCategorizationCard from "./account-cards/account-categorization-detail-card";
import AccountQuoteListCard from "./account-cards/account-quote-list-card";
import AccountCompanyContactsListCard from "./account-cards/smart-account-company-contacts-list-card";
import AccountShippingAddressesListCard from "./account-cards/smart-account-shipping-addresses-list-card";
import AccountSubAccountsListCard from "./account-cards/smart-account-sub-accounts-list-card";
import AccountParentAccountsListCard from "./account-cards/smart-account-parent-accounts-list-card";
import FindAccountData from "./account-cards/find-account-data";

export default function AccountDetail() {
  const [match, params] = useRoute("/accounts/:id");
  const [, setLocation] = useLocation();
  const isCreating = params?.id === "new";
  const [isEditing, setIsEditing] = useState(isCreating);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isSettingEnabled } = useCompanySettings();

  // Refs to prevent background refetches from overwriting user input
  const formInitializedRef = useRef(false);
  const lastAccountIdRef = useRef<string | null>(null);

  // Fetch field types for accounts object
  const { data: fieldTypeMap = {} } = useObjectFieldTypes({
    objectCode: "accounts",
    enabled: true,
  });

  // Fetch account data (skip when creating new account)
  const { data: account, isLoading: isLoadingAccount } =
    useQuery<AccountWithOwner>({
      queryKey: ["/api/accounts", params?.id],
      enabled: !!params?.id && !isCreating,
    });

  // Build default values using field type map
  const defaultFormValues = buildDefaultFormValues(fieldTypeMap, {
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    mobilePhone: "",
    companyOfficialName: "",
    companyRegistrationId: "",
    taxId: "",
    address: "",
    addressStreetAddress: "",
    addressCity: "",
    addressStateProvince: "",
    addressZipCode: "",
    addressCountry: "",
    industry: "",
    ownerId: "",
    isPersonAccount: false,
    isSelfEmployed: false,
    isCompanyContact: false,
    isLegalEntity: false,
    isShippingAddress: false,
  });

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: defaultFormValues as InsertAccount,
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
      setIsEditing(false);
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
      setLocation("/accounts");
    } else {
      setIsEditing(false);
      // Reset form to current account data using transformRecordToFormValues
      if (account) {
        const formValues = transformRecordToFormValues(account, fieldTypeMap, {
          ownerId: account.ownerId,
        });
        form.reset(formValues as InsertAccount);
      }
    }
  };

  // Initialize form when account data is loaded - with refs pattern to prevent overwrites
  useEffect(() => {
    if (account && params?.id) {
      // Only initialize if this is a new account ID or form hasn't been initialized
      const isNewAccountId = lastAccountIdRef.current !== params.id;
      
      if (isNewAccountId || !formInitializedRef.current) {
        const formValues = transformRecordToFormValues(account, fieldTypeMap, {
          ownerId: account.ownerId,
        });
        form.reset(formValues as InsertAccount);
        
        formInitializedRef.current = true;
        lastAccountIdRef.current = params.id;
      }
    }
  }, [account, params?.id, fieldTypeMap, form]);

  // Reset refs when switching to a different account or creating new
  useEffect(() => {
    if (isCreating) {
      formInitializedRef.current = false;
      lastAccountIdRef.current = null;
    }
  }, [isCreating]);

  // Initialize owner with current user when creating new account
  useEffect(() => {
    if (isCreating && currentUser && !form.getValues("ownerId")) {
      form.setValue("ownerId", currentUser.id);
    }
  }, [isCreating, currentUser, form]);

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
              isSettingEnabled={isSettingEnabled}
            />

            <AccountDetailOwnershipCard
              account={account || null}
              isEditing={isEditing}
              form={form}
              updateMutation={createMutation.isPending || updateMutation.isPending ? updateMutation : updateMutation}
            />
            
            {/* AI Account Data Finder */}
            {(isSettingEnabled("account_data_web_search") && 
              <FindAccountData 
              accountId={params?.id || ""}
              accountName={account?.name || ""}
            />
              )}
            <AccountDetailCategorizationCard
              account={account || null}
              isEditing={isEditing}
              form={form}
              updateMutation={createMutation.isPending || updateMutation.isPending ? updateMutation : updateMutation}
            />
          </div>
        </Panel> 

        <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

        {/* Right Pane - Quotes and Hierarchical Accounts (Vertically Stacked) */}
        <Panel defaultSize={50} minSize={30} maxSize={70}>
          <div className="flex flex-col gap-6 h-full overflow-auto p-4">
            {!isCreating && params?.id && (
              <>
                {isSettingEnabled("general_quote_setting_quote_management_activated") && (
                  <AccountQuoteListCard
                    accountId={params.id}
                    accountName={account?.name || ""}
                    isEditing={isEditing}
                  />
                )}
                
                {/* Company Contacts - Show if smart account management and company contact type are enabled, and account is Legal Entity or Shipping Address */}
                {(account?.isLegalEntity || account?.isShippingAddress) &&
                  isSettingEnabled("smart_account_management_activated") &&
                  isSettingEnabled("smart_account_management_accountType_companyContact_enabled") && (
                    <AccountCompanyContactsListCard
                      accountId={params.id}
                      accountName={account?.name || ""}
                      isEditing={isEditing}
                      isSettingEnabled={isSettingEnabled}
                      ownerId={account?.ownerId || ""}
                    />
                  )}
                
                {/* Shipping Addresses - Show if smart account management and shipping address type are enabled, and account is Legal Entity */}
                {account?.isLegalEntity &&
                  isSettingEnabled("smart_account_management_activated") &&
                  isSettingEnabled("smart_account_management_accountType_shipping_enabled") && (
                    <AccountShippingAddressesListCard
                      accountId={params.id}
                      accountName={account?.name || ""}
                      isEditing={isEditing}
                      isSettingEnabled={isSettingEnabled}
                      ownerId={account?.ownerId || ""}
                    />
                  )}
                
                {/* Sub-Accounts - Show if smart account management and legal entity type are enabled, and account is Legal Entity */}
                {account?.isLegalEntity &&
                  isSettingEnabled("smart_account_management_activated") &&
                  isSettingEnabled("smart_account_management_accountType_LegalEntity_enabled") && (
                    <AccountSubAccountsListCard
                      accountId={params.id}
                      accountName={account?.name || ""}
                      isEditing={isEditing}
                      isSettingEnabled={isSettingEnabled}
                      ownerId={account?.ownerId || ""}
                    />
                  )}
                
                {/* Parent Accounts - Show if smart account management is enabled, and account is Legal Entity, Shipping Address, or Company Contact */}
                {(account?.isLegalEntity || account?.isShippingAddress || account?.isCompanyContact) &&
                  isSettingEnabled("smart_account_management_activated") && (
                    <AccountParentAccountsListCard
                      accountId={params.id}
                    />
                  )}
              </>
            )}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
