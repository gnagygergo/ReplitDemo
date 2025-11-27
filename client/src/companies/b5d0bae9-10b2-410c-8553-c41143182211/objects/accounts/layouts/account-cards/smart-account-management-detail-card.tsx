// This Card is used on the Account Detail View.
// It is used when Smart Account Management is activated.

import { type UseFormReturn } from "react-hook-form";
import { type UseMutationResult } from "@tanstack/react-query";
import {
  type AccountWithOwner,
  type InsertAccount,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AddressField } from "@/components/ui/address-field";

interface SmartAccountManagementDetailCardProps {
  account: AccountWithOwner | null;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  isSettingEnabled: (settingCode: string) => boolean;
  showAccountNature?: boolean;
}

export default function SmartAccountManagementDetailCard({
  account,
  isEditing,
  form,
  updateMutation,
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
        <Form {...form}>
          <form className="space-y-4">
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
                                mode={account?.isPersonAccount ? "view" : "edit"}
                                value={!!field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                objectCode="accounts"
                                fieldCode="isPersonAccount"
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
                                value={!!field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isLegalEntity", false);
                                    form.setValue("isShippingAddress", false);
                                  }
                                }}
                                objectCode="accounts"
                                fieldCode="isSelfEmployed"
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
                                value={!!field.value}
                                onChange={(checked) => {
                                  field.onChange(checked);
                                  if (checked) {
                                    form.setValue("isPersonAccount", false);
                                    form.setValue("isSelfEmployed", false);
                                    form.setValue("isCompanyContact", false);
                                  }
                                }}
                                objectCode="accounts"
                                fieldCode="isLegalEntity"
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
                      {/* First Name - Using metadata-driven TextField */}
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={(value) => {
                                  field.onChange(value);
                                  const lastName = form.getValues("lastName");
                                  const newName = `${value} ${lastName || ""}`.trim();
                                  form.setValue("name", newName);
                                }}
                                objectCode="accounts"
                                fieldCode="firstName"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Last Name - Using metadata-driven TextField */}
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={(value) => {
                                  field.onChange(value);
                                  const firstName = form.getValues("firstName");
                                  const newName = `${firstName || ""} ${value}`.trim();
                                  form.setValue("name", newName);
                                }}
                                objectCode="accounts"
                                fieldCode="lastName"
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
                                fieldCode="companyOfficialName"
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
                                fieldCode="companyRegistrationId"
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
                                fieldCode="taxId"
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

                      {/* Mobile Phone - Using metadata-driven TextField */}
                      <FormField
                        control={form.control}
                        name="mobilePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <TextField
                                mode="edit"
                                value={field.value || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="mobilePhone"
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
                              fieldCode="createdDate"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Row 6: Address Field with form integration */}
                  <AddressField
                    form={form}
                    mode="edit"
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
                  <div className="">
                    {/* Row 1: First Name + Last Name (grid-cols-2) */}
                    {!account.isShippingAddress && !account.isLegalEntity && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* First Name - Using metadata-driven TextField */}
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <TextField
                                mode="view"
                                value={field.value || account.firstName || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="firstName"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Last Name - Using metadata-driven TextField */}
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <TextField
                                mode="view"
                                value={field.value || account.lastName || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="lastName"
                              />
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
                          <TextField
                            mode="view"
                            value={field.value || account.name || ""}
                            onChange={field.onChange}
                            objectCode="accounts"
                            fieldCode="name"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Row 3: Company Information - Visible when isSelfEmployed or isLegalEntity */}
                    {(account.isSelfEmployed || account.isLegalEntity) && (
                      <>
                        {/* Company Official Name */}
                        <FormField
                          control={form.control}
                          name="companyOfficialName"
                          render={({ field }) => (
                            <FormItem>
                              <TextField
                                mode="view"
                                value={field.value || account.companyOfficialName || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="companyOfficialName"
                              />
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
                              <TextField
                                mode="view"
                                value={field.value || account.companyRegistrationId || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="companyRegistrationId"
                              />
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
                              <TextField
                                mode="view"
                                value={field.value || account.taxId || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="taxId"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {/* Row 4: Email + Mobile Phone (grid-cols-2) */}
                    {!account.isShippingAddress && !account.isLegalEntity && (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Email - Using metadata-driven TextField */}
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <TextField
                                mode="view"
                                value={field.value || account.email || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="email"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Mobile Phone - Using metadata-driven TextField */}
                        <FormField
                          control={form.control}
                          name="mobilePhone"
                          render={({ field }) => (
                            <FormItem>
                              <TextField
                                mode="view"
                                value={field.value || account.mobilePhone || ""}
                                onChange={field.onChange}
                                objectCode="accounts"
                                fieldCode="mobilePhone"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Row 5: Address Field - explicit value prop in view mode for stable display */}
                    <FormField
                      control={form.control}
                      name="addressStreetAddress"
                      render={({ field }) => (
                        <FormItem>
                          <AddressField
                            mode="view"
                            value={{
                              streetAddress: field.value || account.addressStreetAddress || "",
                              city: form.getValues("addressCity") || account.addressCity || "",
                              stateProvince: form.getValues("addressStateProvince") || account.addressStateProvince || "",
                              zipCode: form.getValues("addressZipCode") || account.addressZipCode || "",
                              country: form.getValues("addressCountry") || account.addressCountry || ""
                            }}
                            onChange={() => {}}
                            objectCode="accounts"
                            fieldCode="address"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Row 6: Created Date - Using metadata-driven DateTimeField */}
                    {account.createdDate && (
                      <FormField
                        control={form.control}
                        name="createdDate"
                        render={({ field }) => (
                          <FormItem>
                            <DateTimeField
                              mode="view"
                              value={field.value || account.createdDate || null}
                              onChange={field.onChange}
                              objectCode="accounts"
                              fieldCode="createdDate"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
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
