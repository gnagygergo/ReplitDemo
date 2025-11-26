// This Card is used on the Account Detail View.
// It shows Account Owner using LookupFormField.

import { type UseFormReturn } from "react-hook-form";
import { type UseMutationResult } from "@tanstack/react-query";
import {
  type AccountWithOwner,
  type InsertAccount,
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import LookupFormField from "@/components/ui/lookup-form-field";

interface AccountDetailOwnershipCardProps {
  account: AccountWithOwner | null;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
}

export default function AccountDetailOwnershipCard({
  account,
  isEditing,
  form,
  updateMutation,
}: AccountDetailOwnershipCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <LookupFormField
                    objectCode="accounts"
                    fieldCode="ownerId"
                    mode={isEditing ? "edit" : "view"}
                    value={field.value}
                    onChange={(value) => field.onChange(value || "")}
                    disabled={!isEditing}
                  />
                  {isEditing && <FormMessage />}
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
