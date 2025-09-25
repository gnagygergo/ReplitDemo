import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type InsertAccount, type Account, type AccountWithOwner, type User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  account?: AccountWithOwner;
}

export default function AccountForm({ open, onClose, account }: AccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!account;
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  
  // Get current user for default owner
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: open && !isEditing,
  });

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: account?.name || "",
      address: account?.address || "",
      industry: account?.industry as "tech" | "construction" | "services" || "tech",
      ownerId: account?.ownerId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/accounts/${account.id}`, data);
      } else {
        return apiRequest("POST", "/api/accounts", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: `Account ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} account`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAccount) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedOwner(null);
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
  
  // Set default owner when creating new account
  useEffect(() => {
    if (!isEditing && currentUser && !form.getValues("ownerId")) {
      setSelectedOwner(currentUser);
      form.setValue("ownerId", currentUser.id);
    }
  }, [currentUser, isEditing, form]);
  
  // Set selected owner when editing
  useEffect(() => {
    if (isEditing && account?.owner) {
      setSelectedOwner(account.owner);
    }
  }, [account, isEditing]);

  const industryOptions = [
    { value: "tech", label: "Technology" },
    { value: "construction", label: "Construction" },
    { value: "services", label: "Services" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Account" : "Create Account"}
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
                    Account Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter account name"
                      data-testid="input-account-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Industry <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      data-testid="input-address"
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
                data-testid="button-cancel-account"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-save-account"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update Account" : "Create Account"}
              </Button>
            </div>
          </form>
        </Form>
        
        <UserLookupDialog
          open={showUserLookup}
          onClose={handleCloseUserLookup}
          onSelect={handleUserSelect}
          selectedUserId={selectedOwner?.id}
        />
      </DialogContent>
    </Dialog>
  );
}
