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
  account: AccountWithOwner;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  selectedOwner: User | null;
  setShowUserLookup: (show: boolean) => void;
  getUserInitials: (user: User) => string;
  getUserDisplayName: (user: User) => string;
}

export default function SmartAccountManagementDetailCard({
  account,
  isEditing,
  form,
  updateMutation,
  selectedOwner,
  setShowUserLookup,
  getUserInitials,
  getUserDisplayName,
}: SmartAccountManagementDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Information</CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form className="space-y-6">
              {/* Account Nature Section - Only visible in edit mode */}
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-sm text-purple-900 dark:text-purple-100">
                  Account Nature
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Person-related checkboxes */}
                  {!form.watch("isLegalEntity") &&
                    !form.watch("isShippingAddress") && (
                      <>
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
                                      form.setValue(
                                        "isLegalEntity",
                                        false,
                                      );
                                      form.setValue(
                                        "isShippingAddress",
                                        false,
                                      );
                                    }
                                  }}
                                  data-testid="checkbox-is-person-account"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">
                                Person Account
                              </FormLabel>
                            </FormItem>
                          )}
                        />
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
                                      form.setValue(
                                        "isLegalEntity",
                                        false,
                                      );
                                      form.setValue(
                                        "isShippingAddress",
                                        false,
                                      );
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
                                      form.setValue(
                                        "isLegalEntity",
                                        false,
                                      );
                                      form.setValue(
                                        "isShippingAddress",
                                        false,
                                      );
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
                      </>
                    )}

                  {/* Entity-related checkboxes */}
                  {!form.watch("isPersonAccount") &&
                    !form.watch("isSelfEmployed") &&
                    !form.watch("isCompanyContact") && (
                      <>
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
                                      form.setValue(
                                        "isPersonAccount",
                                        false,
                                      );
                                      form.setValue(
                                        "isSelfEmployed",
                                        false,
                                      );
                                      form.setValue(
                                        "isCompanyContact",
                                        false,
                                      );
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
                                      form.setValue(
                                        "isPersonAccount",
                                        false,
                                      );
                                      form.setValue(
                                        "isSelfEmployed",
                                        false,
                                      );
                                      form.setValue(
                                        "isCompanyContact",
                                        false,
                                      );
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
                      </>
                    )}
                </div>
              </div>

              {/* First Name - Hidden when isShippingAddress or isLegalEntity */}
              {!form.watch("isShippingAddress") &&
                !form.watch("isLegalEntity") && (
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
                )}

              {/* Last Name - Hidden when isShippingAddress or isLegalEntity */}
              {!form.watch("isShippingAddress") &&
                !form.watch("isLegalEntity") && (
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
                )}

              {/* Email - Hidden when isShippingAddress or isLegalEntity */}
              {!form.watch("isShippingAddress") &&
                !form.watch("isLegalEntity") && (
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
                )}

              {/* Mobile Phone - Hidden when isShippingAddress or isLegalEntity */}
              {!form.watch("isShippingAddress") &&
                !form.watch("isLegalEntity") && (
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
                )}

              {/* Company Registration ID - Visible when isSelfEmployed or isLegalEntity */}
              {(form.watch("isSelfEmployed") ||
                form.watch("isLegalEntity")) && (
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
            {/* First Name - Hidden when isShippingAddress or isLegalEntity */}
            {!account.isShippingAddress && !account.isLegalEntity && (
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
            )}

            {/* Last Name - Hidden when isShippingAddress or isLegalEntity */}
            {!account.isShippingAddress && !account.isLegalEntity && (
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
            )}

            {/* Email - Hidden when isShippingAddress or isLegalEntity */}
            {!account.isShippingAddress && !account.isLegalEntity && (
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
            )}

            {/* Mobile Phone - Hidden when isShippingAddress or isLegalEntity */}
            {!account.isShippingAddress && !account.isLegalEntity && (
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
            )}

            {/* Company Registration ID - Visible when isSelfEmployed or isLegalEntity */}
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
  );
}
