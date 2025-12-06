/**
 * Account Detail Layout (Clean Version)
 * 
 * This layout uses the DetailViewHandler pattern with LayoutContext.
 * Cards that need form access get it from useLayoutContext().
 * Feature cards (quotes, sub-accounts, etc.) receive props directly.
 */

import type { LayoutComponentProps } from "../../../components/ui/DetailViewHandler";
import { useLayoutContext } from "@/contexts/LayoutContext";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import AccountCategorizationDetailCard from "./account-cards/account-categorization-detail-card";
import AccountOwnershipDetailCard from "./account-cards/account-ownership-detail-card";
import SmartAccountManagementDetailCard from "./account-cards/smart-account-management-detail-card";
import AccountQuoteListCard from "./account-cards/account-quote-list-card";
import AccountCompanyContactsListCard from "./account-cards/smart-account-company-contacts-list-card";
import AccountShippingAddressesListCard from "./account-cards/smart-account-shipping-addresses-list-card";
import AccountSubAccountsListCard from "./account-cards/smart-account-sub-accounts-list-card";
import AccountParentAccountsListCard from "./account-cards/smart-account-parent-accounts-list-card";
import FindAccountData from "./account-cards/find-account-data";
import GoogleDriveFilesCard from "./account-cards/google-drive-files-card";

export default function AccountDetailLayout({
  Field,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  record,
  isCreating,
}: LayoutComponentProps) {
  const { isEditing } = useLayoutContext();
  const { isSettingEnabled } = useCompanySettings();

  const accountId = record?.id as string | undefined;
  const accountName = record?.name as string | undefined;
  const ownerId = record?.ownerId as string | undefined;
  const isLegalEntity = record?.isLegalEntity as boolean | undefined;
  const isShippingAddress = record?.isShippingAddress as boolean | undefined;
  const isCompanyContact = record?.isCompanyContact as boolean | undefined;

  return (
    <PanelGroup direction="horizontal" className="min-h-[600px]">
      {/* Left Pane - Account Information Cards */}
      <Panel defaultSize={50} minSize={30} maxSize={70}>
        <div className="flex flex-col gap-6 h-full overflow-auto p-4">
          {/* Main Account Management Card - uses LayoutContext internally */}
          <SmartAccountManagementDetailCard isSettingEnabled={isSettingEnabled} />

          {/* Ownership Card - uses LayoutContext internally */}
          <AccountOwnershipDetailCard />

          {/* AI Account Data Finder */}
          {isSettingEnabled("account_data_web_search") && accountId && (
            <FindAccountData
              accountId={accountId}
              accountName={accountName || ""}
            />
          )}

          {/* Categorization Card - uses LayoutContext internally */}
          <AccountCategorizationDetailCard />
        </div>
      </Panel>

      <PanelResizeHandle className="w-2 hover:bg-muted-foreground/20 transition-colors" />

      {/* Right Pane - Related Lists and Feature Cards */}
      <Panel defaultSize={50} minSize={30} maxSize={70}>
        <div className="flex flex-col gap-6 h-full overflow-auto p-4">
          {!isCreating && accountId && (
            <>
              {/* Quotes List */}
              {isSettingEnabled("general_quote_setting_quote_management_activated") && (
                <AccountQuoteListCard
                  accountId={accountId}
                  accountName={accountName || ""}
                  isEditing={isEditing}
                />
              )}

              {/* Company Contacts - for Legal Entity or Shipping Address accounts */}
              {(isLegalEntity || isShippingAddress) &&
                isSettingEnabled("smart_account_management_activated") &&
                isSettingEnabled("smart_account_management_accountType_companyContact_enabled") && (
                  <AccountCompanyContactsListCard
                    accountId={accountId}
                    accountName={accountName || ""}
                    isEditing={isEditing}
                    isSettingEnabled={isSettingEnabled}
                    ownerId={ownerId || ""}
                  />
                )}

              {/* Shipping Addresses - for Legal Entity accounts */}
              {isLegalEntity &&
                isSettingEnabled("smart_account_management_activated") &&
                isSettingEnabled("smart_account_management_accountType_shipping_enabled") && (
                  <AccountShippingAddressesListCard
                    accountId={accountId}
                    accountName={accountName || ""}
                    isEditing={isEditing}
                    isSettingEnabled={isSettingEnabled}
                    ownerId={ownerId || ""}
                  />
                )}

              {/* Sub-Accounts - for Legal Entity accounts */}
              {isLegalEntity &&
                isSettingEnabled("smart_account_management_activated") &&
                isSettingEnabled("smart_account_management_accountType_LegalEntity_enabled") && (
                  <AccountSubAccountsListCard
                    accountId={accountId}
                    accountName={accountName || ""}
                    isEditing={isEditing}
                    isSettingEnabled={isSettingEnabled}
                    ownerId={ownerId || ""}
                  />
                )}

              {/* Parent Accounts - for Legal Entity, Shipping Address, or Company Contact */}
              {(isLegalEntity || isShippingAddress || isCompanyContact) &&
                isSettingEnabled("smart_account_management_activated") && (
                  <AccountParentAccountsListCard accountId={accountId} />
                )}

              {/* Google Drive Files */}
              <GoogleDriveFilesCard accountId={accountId} />
            </>
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}
