// This Card is used on the Account Detail View.
// It shows Account Owner.

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

interface AccountDetailOwnershipCardProps {
  account: AccountWithOwner;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  selectedOwner: User | null;
  setShowUserLookup: (show: boolean) => void;
  getUserInitials: (user: User) => string;
  getUserDisplayName: (user: User) => string;
}

export default function AccountDetailOwnershipCard({
  account,
  isEditing,
  form,
  updateMutation,
  selectedOwner,
  setShowUserLookup,
  getUserInitials,
  getUserDisplayName,
}: AccountDetailOwnershipCardProps) {
  return (
    <Card>
      <CardContent>
      
        {isEditing ? (
          // EDIT MODE
          <Form {...form}>
            <form className="space-y-6">
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

      // VIEW MODE
          <div className="space-y-6">
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
