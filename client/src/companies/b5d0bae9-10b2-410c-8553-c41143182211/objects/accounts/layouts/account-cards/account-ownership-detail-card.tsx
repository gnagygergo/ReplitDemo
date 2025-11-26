// This Card is used on the Account Detail View.
// It shows Account Owner.

import { type UseFormReturn } from "react-hook-form";
import { type UseMutationResult } from "@tanstack/react-query";
import {
  type AccountWithOwner,
  type InsertAccount,
  type User,
} from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  account: AccountWithOwner | null;
  isEditing: boolean;
  form: UseFormReturn<InsertAccount>;
  updateMutation: UseMutationResult<any, any, InsertAccount, unknown>;
  selectedOwner: User | null;
  setShowUserLookup: (show: boolean) => void;
}

const getUserDisplayName = (user: User) => {
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return user.email || "Unknown User";
};

const getUserInitials = (user: User) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.firstName) {
    return user.firstName[0].toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return "?";
};

export default function AccountDetailOwnershipCard({
  account,
  isEditing,
  form,
  updateMutation,
  selectedOwner,
  setShowUserLookup,
}: AccountDetailOwnershipCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isEditing ? (
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
                                src={selectedOwner.profileImageUrl || undefined}
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
          <>
            {!account ? (
              <div>No account data</div>
            ) : (
              <div className="space-y-6">
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
                        {account.owner ? getUserInitials(account.owner) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {account.owner ? getUserDisplayName(account.owner) : "Unknown User"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.owner?.email}
                      </div>
                    </div>
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
