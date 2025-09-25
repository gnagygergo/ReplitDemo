import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOpportunitySchema, type InsertOpportunity, type Opportunity, type Account, type OpportunityWithAccountAndOwner, type User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lookup } from "@/components/ui/lookup";
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface OpportunityFormProps {
  open: boolean;
  onClose: () => void;
  opportunity?: OpportunityWithAccountAndOwner;
}

export default function OpportunityForm({ open, onClose, opportunity }: OpportunityFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!opportunity;
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  
  // Get current user for default owner
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: open && !isEditing,
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    enabled: open,
  });

  const form = useForm<InsertOpportunity>({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      name: opportunity?.name || "",
      accountId: opportunity?.accountId || "",
      closeDate: opportunity?.closeDate || "",
      totalRevenue: opportunity?.totalRevenue ? parseFloat(opportunity.totalRevenue) : 0,
      ownerId: opportunity?.ownerId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertOpportunity) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/opportunities/${opportunity.id}`, data);
      } else {
        return apiRequest("POST", "/api/opportunities", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: `Opportunity ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} opportunity`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertOpportunity) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedOwner(null);
  };

  const handleOpenAccountLookup = () => {
    setShowAccountLookup(true);
  };

  const handleAccountSelect = (account: Account) => {
    form.setValue("accountId", account.id);
    setShowAccountLookup(false);
  };

  const handleCloseAccountLookup = () => {
    setShowAccountLookup(false);
  };
  
  const handleOpenUserLookup = () => {
    setShowUserLookup(true);
  };

  const handleUserSelect = (user: User) => {
    setSelectedOwner(user);
    form.setValue("ownerId", user.id);
    setShowUserLookup(false);
  };

  const handleCloseUserLookup = () => {
    setShowUserLookup(false);
  };
  
  const getUserDisplayName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email || 'Unknown User';
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
    return 'U';
  };

  // Set default owner when creating new opportunity
  useEffect(() => {
    if (!isEditing && currentUser && !form.getValues("ownerId")) {
      setSelectedOwner(currentUser);
      form.setValue("ownerId", currentUser.id);
    }
  }, [currentUser, isEditing, form]);
  
  // Set selected owner when editing
  useEffect(() => {
    if (isEditing && opportunity?.owner) {
      setSelectedOwner(opportunity.owner);
    }
  }, [opportunity, isEditing]);
  
  // Reset form when opportunity changes (for edit mode)
  useEffect(() => {
    if (opportunity) {
      form.reset({
        name: opportunity.name,
        accountId: opportunity.accountId,
        closeDate: opportunity.closeDate,
        totalRevenue: parseFloat(opportunity.totalRevenue),
        ownerId: opportunity.ownerId,
      });
    } else {
      form.reset({
        name: "",
        accountId: "",
        closeDate: "",
        totalRevenue: 0,
        ownerId: "",
      });
    }
  }, [opportunity, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Opportunity" : "Create Opportunity"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Opportunity Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter opportunity name"
                      data-testid="input-opportunity-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Lookup
                      options={accounts.map(account => ({
                        value: account.id,
                        label: account.name
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Search and select an account"
                      searchPlaceholder="Type to search accounts..."
                      emptyMessage="No accounts found"
                      onEnterPressed={handleOpenAccountLookup}
                      data-testid="lookup-account"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Close Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="date"
                      data-testid="input-close-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalRevenue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total Revenue <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input 
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-total-revenue"
                      />
                    </div>
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
                      onClick={handleOpenUserLookup}
                      data-testid="button-owner-lookup"
                    >
                      {selectedOwner ? (
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={selectedOwner.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(selectedOwner)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="font-medium" data-testid={`text-owner-${selectedOwner.id}`}>
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleClose}
                data-testid="button-cancel-opportunity"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-save-opportunity"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update Opportunity" : "Create Opportunity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <AccountLookupDialog
      open={showAccountLookup}
      onSelect={handleAccountSelect}
      onClose={handleCloseAccountLookup}
      selectedAccountId={form.getValues("accountId")}
    />
    <UserLookupDialog
      open={showUserLookup}
      onClose={handleCloseUserLookup}
      onSelect={handleUserSelect}
      selectedUserId={selectedOwner?.id}
    />
    </>
  );
}
