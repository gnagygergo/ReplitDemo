import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOpportunitySchema, type InsertOpportunity, type Opportunity, type Account } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lookup } from "@/components/ui/lookup";
import AccountLookupDialog from "@/components/ui/account-lookup-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OpportunityFormProps {
  open: boolean;
  onClose: () => void;
  opportunity?: Opportunity & { account: Account };
}

export default function OpportunityForm({ open, onClose, opportunity }: OpportunityFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!opportunity;
  const [showAccountLookup, setShowAccountLookup] = useState(false);

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

  // Reset form when opportunity changes (for edit mode)
  useEffect(() => {
    if (opportunity) {
      form.reset({
        name: opportunity.name,
        accountId: opportunity.accountId,
        closeDate: opportunity.closeDate,
        totalRevenue: parseFloat(opportunity.totalRevenue),
      });
    } else {
      form.reset({
        name: "",
        accountId: "",
        closeDate: "",
        totalRevenue: 0,
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
    </>
  );
}
