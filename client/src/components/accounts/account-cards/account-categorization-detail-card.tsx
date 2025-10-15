// This Card is used on the Account Detail View.
// It shows Categorization fields like Industry.

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

interface AccountDetailCategorizationCardProps {
  account: AccountWithOwner;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  getIndustryLabel: (industry: string) => string;
  getIndustryBadgeClass: (industry: string) => string;
}

export default function AccountDetailCategorizationCard({
  account,
  isEditing,
  form,
  updateMutation,
  getIndustryLabel,
  getIndustryBadgeClass
}: AccountDetailCategorizationCardProps) {
  return (
    <Card>
      <CardContent>

        {isEditing ? (
          // EDIT MODE
          <Form {...form}>
            <form className="space-y-6">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Industry <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-industry">
                          <SelectValue placeholder="Select an industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="construction">
                          Construction
                        </SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (

      // VIEW MODE
          <div className="space-y-6">
            {/* Industry */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Industry
              </label>
              <div
                className="mt-1"
                data-testid="text-account-industry-value"
              >
                <Badge
                  className={getIndustryBadgeClass(account.industry)}
                >
                  {getIndustryLabel(account.industry)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
