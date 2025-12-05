/**
 * Smart Account Management Detail Card (Clean Version)
 * 
 * Uses LayoutContext to access form and editing state.
 * Uses the smart Field component where possible.
 * 
 * Note: Checkboxes with mutual exclusivity logic use FormField directly
 * because they need custom onChange handlers that modify other form fields.
 */

import { useLayoutContext } from "@/contexts/LayoutContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { Field } from "../../../../components/ui/Field";

interface SmartAccountManagementDetailCardProps {
  isSettingEnabled: (settingCode: string) => boolean;
  showAccountNature?: boolean;
}

export default function SmartAccountManagementDetailCard({
  isSettingEnabled,
  showAccountNature = true,
}: SmartAccountManagementDetailCardProps) {
  const { form, record, isEditing } = useLayoutContext();

  // Form-watched values (for edit mode visibility logic)
  const isPersonAccount = form.watch("isPersonAccount") as boolean;
  const isSelfEmployed = form.watch("isSelfEmployed") as boolean;
  const isCompanyContact = form.watch("isCompanyContact") as boolean;
  const isLegalEntity = form.watch("isLegalEntity") as boolean;
  const isShippingAddress = form.watch("isShippingAddress") as boolean;

  // Record values (for view mode and initial edit mode checks)
  const recordIsShippingAddress = record?.isShippingAddress as boolean | undefined;
  const recordIsCompanyContact = record?.isCompanyContact as boolean | undefined;
  const recordIsPersonAccount = record?.isPersonAccount as boolean | undefined;
  const recordIsSelfEmployed = record?.isSelfEmployed as boolean | undefined;
  const recordIsLegalEntity = record?.isLegalEntity as boolean | undefined;
  const recordCreatedDate = record?.createdDate as string | undefined;

  const hasAnyAccountNature =
    isPersonAccount || isSelfEmployed || isCompanyContact || isLegalEntity || isShippingAddress;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "" : (record?.name as string) || ""}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {isEditing ? (
          <>
            {/* ====== ACCOUNT NATURE LAYOUT SECTION ====== */}
            {showAccountNature && !(recordIsShippingAddress || recordIsCompanyContact) && (
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                  Account Nature
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Private Person checkbox */}
                  {(isSettingEnabled("smart_account_management_accountType_PrivatePerson_enabled") || isPersonAccount) &&
                    !isLegalEntity && !isShippingAddress && (
                      <FormField
                        control={form.control}
                        name="isPersonAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <CheckboxField
                                mode={recordIsPersonAccount ? "view" : "edit"}
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

                  {/* Self Employed checkbox */}
                  {(isSettingEnabled("smart_account_management_accountType_SelfEmployed_enabled") || isSelfEmployed) &&
                    !isLegalEntity && !isShippingAddress && (
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

                  {/* Legal Entity checkbox */}
                  {(isSettingEnabled("smart_account_management_accountType_LegalEntity_enabled") || isLegalEntity) &&
                    !isPersonAccount && !isSelfEmployed && !isCompanyContact && (
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
            {hasAnyAccountNature && (
              <div className="space-y-1">
                {/* Row 1: First Name + Last Name */}
                {!isShippingAddress && !isLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="firstName" />
                    <Field name="lastName" />
                  </div>
                )}

                {/* Row 2: Account Name */}
                <Field name="name" />

                {/* Row 3: Company Information */}
                {(isSelfEmployed || isLegalEntity) && (
                  <>
                    <Field name="companyOfficialName" />
                    <Field name="companyRegistrationId" />
                    <Field name="taxId" />
                  </>
                )}

                {/* Row 4: Email + Mobile Phone */}
                {!isShippingAddress && !isLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="email" />
                    <Field name="mobilePhone" />
                  </div>
                )}

                {/* Row 5: Created Date (read-only) */}
                {recordCreatedDate && (
                  <Field name="createdDate" />
                )}

                {/* Row 6: Address Field */}
                <Field name="address" />
              </div>
            )}
          </>
        ) : (
          <>
            {!record ? (
              <div>No account data</div>
            ) : (
              <div className="space-y-1">
                {/* View Mode: First Name + Last Name */}
                {!recordIsShippingAddress && !recordIsLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="firstName" />
                    <Field name="lastName" />
                  </div>
                )}

                {/* View Mode: Account Name */}
                <Field name="name" />

                {/* View Mode: Company Information */}
                {(recordIsSelfEmployed || recordIsLegalEntity) && (
                  <>
                    <Field name="companyOfficialName" />
                    <Field name="companyRegistrationId" />
                    <Field name="taxId" />
                  </>
                )}

                {/* View Mode: Email + Mobile Phone */}
                {!recordIsShippingAddress && !recordIsLegalEntity && (
                  <div className="grid grid-cols-2 gap-4">
                    <Field name="email" />
                    <Field name="mobilePhone" />
                  </div>
                )}

                {/* View Mode: Created Date */}
                {recordCreatedDate && (
                  <Field name="createdDate" />
                )}

                {/* View Mode: Address Field */}
                <Field name="address" />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
