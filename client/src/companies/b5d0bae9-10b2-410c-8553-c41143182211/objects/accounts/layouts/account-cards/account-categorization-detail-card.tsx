import { type UseFormReturn } from "react-hook-form";
import { type UseMutationResult } from "@tanstack/react-query";
import { type AccountWithOwner, type InsertAccount } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { DropDownListField } from "@/components/ui/dropdown-list-field";

interface AccountDetailCategorizationCardProps {
  account: AccountWithOwner | null;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
}

export default function AccountDetailCategorizationCard({
  account,
  isEditing,
  form,
  updateMutation,
}: AccountDetailCategorizationCardProps) {
  // In view mode, show message if account data is not available
  if (!isEditing && !account) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No account data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorization</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DropDownListField
                      objectCode="accounts"
                      fieldCode="industry"
                      mode={isEditing ? "edit" : "view"}
                      value={field.value}
                      onValueChange={field.onChange}
                      data-testid="field-industry"
                      
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
