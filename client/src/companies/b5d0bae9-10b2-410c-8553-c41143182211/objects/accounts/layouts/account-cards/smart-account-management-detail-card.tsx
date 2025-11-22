// This Card is used on the Account Detail View.
// It is used when Smart Account Management is activated.

import { useState, useCallback } from "react";
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
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { TextField } from "@/components/ui/text-field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AddressField } from "@/components/ui/address-field";

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
  const { getSetting } = useCompanySettings();
  
  // Check if any account nature checkbox is selected
  const hasAnyAccountNature =
    form.watch("isPersonAccount") ||
    form.watch("isSelfEmployed") ||
    form.watch("isCompanyContact") ||
    form.watch("isLegalEntity") ||
    form.watch("isShippingAddress");
  
  // Get Google Maps API key from company settings
  const googleMapsApiKey = getSetting("google_maps_api_key")?.settingValue || "";

  // Memoize the address selection callback to prevent unnecessary re-renders
  const handlePlaceSelected = useCallback((addressComponents: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
  }) => {
    form.setValue("streetAddress", addressComponents.streetAddress);
    form.setValue("city", addressComponents.city);
    form.setValue("stateProvince", addressComponents.stateProvince);
    form.setValue("zipCode", addressComponents.zipCode);
    form.setValue("country", addressComponents.country);
  }, [form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "" : account?.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            {isEditing ? (
              <>
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
                          <FormItem>
                            <FormControl>
                              <CheckboxField
                                mode="edit"
                                value={field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                disabled={!!account?.isPersonAccount}
                                objectCode="accounts"
                                fieldCode="is_person_account"
                              />
                            </FormControl>
                            <FormMessage />
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
                          <FormItem>
                            <FormControl>
                              <CheckboxField
                                mode="edit"
                                value={field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                objectCode="accounts"
                                fieldCode="is_self_employed"
                              />
                            </FormControl>
                            <FormMessage />
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
                          <FormItem>
                            <FormControl>
                              <CheckboxField
                                mode="edit"
                                value={field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isPersonAccount", false);
                                    form.setValue("isSelfEmployed", false);
                                    form.setValue("isCompanyContact", false);
                                  }
                                }}
                                objectCode="accounts"
                                fieldCode="is_legal_entity"
                              />
                            </FormControl>
                            <FormMessage />
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

                  {/* Row 2: Account Name (full width) - Using metadata-driven TextField */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <TextField
                            mode="edit"
                            value={field.value || ""}
                            onChange={field.onChange}
                            objectCode="accounts"
                            fieldCode="name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Row 3: Company Information - Visible when isSelfEmployed or isLegalEntity */}
                  {(form.watch("isSelfEmployed") || form.watch("isLegalEntity")) && (
                    <>
                      {/* Company Official Name */}
                      <FormField
                        control={form.control}
                        name="companyOfficialName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="company_official_name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Company Registration ID */}
                      <FormField
                        control={form.control}
                        name="companyRegistrationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="company_registration_id"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tax ID */}
                      <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="tax_id"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Row 4: Email + Mobile Phone (grid-cols-2) */}
                  {!form.watch("isShippingAddress") && !form.watch("isLegalEntity") && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Email - Using metadata-driven TextField */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="email"
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

                  {/* Row 5: Created Date - Read-only metadata field shown in edit mode */}
                  {account?.createdDate && (
                    <FormField
                      control={form.control}
                      name="createdDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <DateTimeField
                              mode="view"
                              value={field.value ?? null}
                              onChange={field.onChange}
                              objectCode="accounts"
                              fieldCode="created_date"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Row 6: Address Field with Google Maps Integration */}
                  <AddressField
                    mode="edit"
                    value={{
                      streetAddress: form.watch("streetAddress") || "",
                      city: form.watch("city") || "",
                      stateProvince: form.watch("stateProvince") || "",
                      zipCode: form.watch("zipCode") || "",
                      country: form.watch("country") || ""
                    }}
                    onChange={(address) => {
                      form.setValue("streetAddress", address.streetAddress);
                      form.setValue("city", address.city);
                      form.setValue("stateProvince", address.stateProvince);
                      form.setValue("zipCode", address.zipCode);
                      form.setValue("country", address.country);
                    }}
                    objectCode="accounts"
                    fieldCode="address"
                  />
                </div>
              )}
              </>
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

                {/* Row 2: Account Name (full width) - Using metadata-driven TextField */}
                <TextField
                  mode="view"
                  value={account.name || ""}
                  onChange={() => {}}
                  objectCode="accounts"
                  fieldCode="name"
                />

                {/* Row 3: Company Information - Visible when isSelfEmployed or isLegalEntity */}
                {(account.isSelfEmployed || account.isLegalEntity) && (
                  <>
                    {/* Company Official Name */}
                    <TextField
                      mode="view"
                      value={account.companyOfficialName || ""}
                      onChange={() => {}}
                      objectCode="accounts"
                      fieldCode="company_official_name"
                    />

                    {/* Company Registration ID */}
                    <TextField
                      mode="view"
                      value={account.companyRegistrationId || ""}
                      onChange={() => {}}
                      objectCode="accounts"
                      fieldCode="company_registration_id"
                    />

                    {/* Tax ID */}
                    <TextField
                      mode="view"
                      value={account.taxId || ""}
                      onChange={() => {}}
                      objectCode="accounts"
                      fieldCode="tax_id"
                    />
                  </>
                )}

                {/* Row 4: Email + Mobile Phone (grid-cols-2) */}
                {!account.isShippingAddress && !account.isLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email - Using metadata-driven TextField */}
                    <TextField
                      mode="view"
                      value={account.email || ""}
                      onChange={() => {}}
                      objectCode="accounts"
                      fieldCode="email"
                    />

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

                {/* Row 5: Address Field */}
                <AddressField
                  mode="view"
                  value={{
                    streetAddress: account.streetAddress || "",
                    city: account.city || "",
                    stateProvince: account.stateProvince || "",
                    zipCode: account.zipCode || "",
                    country: account.country || ""
                  }}
                  onChange={() => {}}
                  objectCode="accounts"
                  fieldCode="address"
                />

                {/* Row 6: Created Date - Using metadata-driven DateTimeField */}
                {account.createdDate && (
                  <DateTimeField
                    mode="view"
                    value={account.createdDate}
                    onChange={() => {}}
                    objectCode="accounts"
                    fieldCode="created_date"
                  />
                )}
              </div>
            )}
          </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
