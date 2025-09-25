import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCaseSchema, type InsertCase, type Case, type Account, type CaseWithAccountAndOwner, type User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface CaseFormProps {
  open: boolean;
  onClose: () => void;
  case?: CaseWithAccountAndOwner;
}

export default function CaseForm({ open, onClose, case: caseData }: CaseFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!caseData;
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

  const form = useForm<InsertCase>({
    resolver: zodResolver(insertCaseSchema),
    defaultValues: {
      accountId: caseData?.accountId || "",
      subject: caseData?.subject || "",
      description: caseData?.description || "",
      fromEmail: caseData?.fromEmail || "",
      ownerId: caseData?.ownerId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCase) => {
      if (isEditing) {
        return apiRequest("PATCH", `/api/cases/${caseData.id}`, data);
      } else {
        return apiRequest("POST", "/api/cases", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      toast({
        title: `Case ${isEditing ? "updated" : "created"} successfully`,
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} case`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCase) => {
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
  
  // Set default owner when creating new case
  useEffect(() => {
    if (!isEditing && currentUser && !form.getValues("ownerId")) {
      setSelectedOwner(currentUser);
      form.setValue("ownerId", currentUser.id);
    }
  }, [currentUser, isEditing, form]);
  
  // Set selected owner when editing
  useEffect(() => {
    if (isEditing && caseData?.owner) {
      setSelectedOwner(caseData.owner);
    }
  }, [caseData, isEditing]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Case" : "Create Case"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-account">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
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
              name="fromEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    From Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="email"
                      placeholder="Enter email address"
                      data-testid="input-from-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || ""}
                      placeholder="Enter case subject"
                      data-testid="input-subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      value={field.value || ""} 
                      rows={4}
                      placeholder="Enter case description"
                      className="resize-none"
                      data-testid="input-description"
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
                data-testid="button-cancel-case"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-save-case"
              >
                {mutation.isPending ? "Saving..." : isEditing ? "Update Case" : "Create Case"}
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