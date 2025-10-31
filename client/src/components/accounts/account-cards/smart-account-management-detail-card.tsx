// This Card is used on the Account Detail View.
// It is used when Smart Account Management is activated.

import { type UseFormReturn } from "react-hook-form";
import { type UseMutationResult } from "@tanstack/react-query";
import {
  type AccountWithOwner,
  type InsertAccount,
  type User,
} from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface SmartAccountManagementDetailCardProps {
  account: AccountWithOwner | null;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  selectedOwner: User | null;
  setShowUserLookup: (show: boolean) => void;
  isSettingEnabled: (settingCode: string) => boolean;
  showAccountNature?: boolean;
}

export default function SmartAccountManagementDetailCard({
  account,
  isEditing,
  form,
  updateMutation,
  selectedOwner,
  setShowUserLookup,
  isSettingEnabled,
  showAccountNature = true,
}: SmartAccountManagementDetailCardProps) {
  // Check if any account nature checkbox is selected
  const hasAnyAccountNature =
    form.watch("isPersonAccount") ||
    form.watch("isSelfEmployed") ||
    form.watch("isCompanyContact") ||
    form.watch("isLegalEntity") ||
    form.watch("isShippingAddress");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "" : account?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form className="space-y-6">
              {/* ====== ACCOUNT NATURE LAYOUT SECTION ====== */}
              {showAccountNature && !(account?.isShippingAddress || account?.isCompanyContact) && (
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                  Account Nature
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Private Person checkbox - Show if setting enabled OR currently checked */}
                  {(isSettingEnabled("smart_account_management_accountType_PrivatePerson_enabled") || form.watch("isPersonAccount")) &&
                    !form.watch("isLegalEntity") &&
                    !form.watch("isShippingAddress") && (
                      <FormField
                        control={form.control}
                        name="isPersonAccount"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                disabled={!!account?.isPersonAccount}
                                data-testid="checkbox-is-person-account"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Private Person
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                  {/* Self Employed checkbox - Show if setting enabled OR currently checked */}
                  {(isSettingEnabled("smart_account_management_accountType_SelfEmployed_enabled") || form.watch("isSelfEmployed")) &&
                    !form.watch("isLegalEntity") &&
                    !form.watch("isShippingAddress") && (
                      <FormField
                        control={form.control}
                        name="isSelfEmployed"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                data-testid="checkbox-is-self-employed"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Self Employed
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                  {/* Company Contact checkbox - Show only when creating (not editing) */}
                  {!account &&
                    (isSettingEnabled("smart_account_management_accountType_companyContact_enabled") || form.watch("isCompanyContact")) &&
                    !form.watch("isLegalEntity") &&
                    !form.watch("isShippingAddress") && (
                      <FormField
                        control={form.control}
                        name="isCompanyContact"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                data-testid="checkbox-is-company-contact"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Company Contact
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                  {/* Legal Entity checkbox - Show if setting enabled OR currently checked */}
                  {(isSettingEnabled("smart_account_management_accountType_LegalEntity_enabled") || form.watch("isLegalEntity")) &&
                    !form.watch("isPersonAccount") &&
                    !form.watch("isSelfEmployed") &&
                    !form.watch("isCompanyContact") && (
                      <FormField
                        control={form.control}
                        name="isLegalEntity"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isPersonAccount", false);
                                    form.setValue("isSelfEmployed", false);
                                    form.setValue("isCompanyContact", false);
                                  }
                                }}
                                data-testid="checkbox-is-legal-entity"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Legal Entity
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                  {/* Shipping Address checkbox - Show only when creating (not editing) */}
                  {!account &&
                    (isSettingEnabled("smart_account_management_accountType_shipping_enabled") || form.watch("isShippingAddress")) &&
                    !form.watch("isPersonAccount") &&
                    !form.watch("isSelfEmployed") &&
                    !form.watch("isCompanyContact") && (
                      <FormField
                        control={form.control}
                        name="isShippingAddress"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={!!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isPersonAccount", false);
                                    form.setValue("isSelfEmployed", false);
                                    form.setValue("isCompanyContact", false);
                                  }
                                }}
                                data-testid="checkbox-is-shipping-address"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">
                              Shipping Address
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                </div>
              </div>
              )}

              {/* ====== FIELDS LAYOUT SECTION ====== */}
              {/* Only show fields when at least one account nature checkbox is selected */}
              {hasAnyAccountNature && (
                <div className="space-y-4">
                  {/* Row 1: First Name + Last Name (grid-cols-2) */}
                  {!form.watch("isShippingAddress") && !form.watch("isLegalEntity") && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Enter first name"
                                data-testid="input-edit-first-name"
                                onChange={(e) => {
                                  field.onChange(e);
                                  const lastName = form.getValues("lastName");
                                  const newName =
                                    `${e.target.value} ${lastName || ""}`.trim();
                                  form.setValue("name", newName);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Enter last name"
                                data-testid="input-edit-last-name"
                                onChange={(e) => {
                                  field.onChange(e);
                                  const firstName =
                                    form.getValues("firstName");
                                  const newName =
                                    `${firstName || ""} ${e.target.value}`.trim();
                                  form.setValue("name", newName);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Row 2: Account Name (full width) */}
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

                  {/* Row 3: Company Registration ID (full width) - Visible when isSelfEmployed or isLegalEntity */}
                  {(form.watch("isSelfEmployed") || form.watch("isLegalEntity")) && (
                    <FormField
                      control={form.control}
                      name="companyRegistrationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Registration ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="Enter registration ID"
                              data-testid="input-edit-company-registration-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Row 4: Email + Mobile Phone (grid-cols-2) */}
                  {!form.watch("isShippingAddress") && !form.watch("isLegalEntity") && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                type="email"
                                placeholder="Enter email address"
                                data-testid="input-edit-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Mobile Phone */}
                      <FormField
                        control={form.control}
                        name="mobilePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Phone</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                type="tel"
                                placeholder="Enter mobile phone"
                                data-testid="input-edit-mobile-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Row 5: Address (full width) */}
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
                </div>
              )}
              </form>
          </Form>
        ) : (
          <>
            {!account ? (
              <div>No account data</div>
            ) : (
              <div className="space-y-4">
                {/* Row 1: First Name + Last Name (grid-cols-2) */}
                {!account.isShippingAddress && !account.isLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* First Name */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        First Name
                      </label>
                      <div
                        className="mt-1 text-foreground"
                        data-testid="text-first-name-value"
                      >
                        {account.firstName || "Not provided"}
                      </div>
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Last Name
                      </label>
                      <div
                        className="mt-1 text-foreground"
                        data-testid="text-last-name-value"
                      >
                        {account.lastName || "Not provided"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 2: Account Name (full width) */}
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

                {/* Row 3: Company Registration ID (full width) - Visible when isSelfEmployed or isLegalEntity */}
                {(account.isSelfEmployed || account.isLegalEntity) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Company Registration ID
                    </label>
                    <div
                      className="mt-1 text-foreground"
                      data-testid="text-company-registration-id-value"
                    >
                      {account.companyRegistrationId || "Not provided"}
                    </div>
                  </div>
                )}

                {/* Row 4: Email + Mobile Phone (grid-cols-2) */}
                {!account.isShippingAddress && !account.isLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <div
                        className="mt-1 text-foreground"
                        data-testid="text-email-value"
                      >
                        {account.email || "Not provided"}
                      </div>
                    </div>

                    {/* Mobile Phone */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Mobile Phone
                      </label>
                      <div
                        className="mt-1 text-foreground"
                        data-testid="text-mobile-phone-value"
                      >
                        {account.mobilePhone || "Not provided"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 5: Address (full width) */}
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
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
