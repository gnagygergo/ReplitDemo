import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAccountSchema, type InsertAccount, type Account } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  account?: Account;
}

export default function AccountForm({ open, onClose, account }: AccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!account;

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: account?.name || "",
      address: account?.address || "",
      industry: account?.industry as "tech" | "construction" | "services" || "tech",
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
  };

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
      </DialogContent>
    </Dialog>
  );
}
