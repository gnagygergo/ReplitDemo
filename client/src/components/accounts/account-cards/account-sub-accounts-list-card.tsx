import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Plus } from "lucide-react";
import { Link } from "wouter";
import type { AccountWithOwner, InsertAccount, User } from "@shared/schema";
import { insertAccountSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SmartAccountManagementDetailCard from "./smart-account-management-detail-card";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

interface AccountSubAccountsListCardProps {
  accountId: string;
  accountName: string;
  isEditing: boolean;
  isSettingEnabled: (settingCode: string) => boolean;
  ownerId: string;
}

export default function AccountSubAccountsListCard({
  accountId,
  accountName,
  isEditing,
  isSettingEnabled,
  ownerId,
}: AccountSubAccountsListCardProps) {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  const { data: subAccounts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts", accountId, "children", "legal_entity"],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounts/${accountId}/children?type=legal_entity`
      );
      if (!response.ok) throw new Error("Failed to fetch sub-accounts");
      return response.json();
    },
    enabled: !!accountId,
  });

  const form = useForm<InsertAccount>({
    resolver: zodResolver(insertAccountSchema),
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      address: "",
      companyRegistrationId: "",
      isLegalEntity: true,
      isPersonAccount: false,
      isSelfEmployed: false,
      isCompanyContact: false,
      isShippingAddress: false,
      parentAccountId: accountId,
      ownerId: ownerId,
    },
  });

  useEffect(() => {
    form.reset({
      name: "",
      firstName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      address: "",
      companyRegistrationId: "",
      isLegalEntity: true,
      isPersonAccount: false,
      isSelfEmployed: false,
      isCompanyContact: false,
      isShippingAddress: false,
      parentAccountId: accountId,
      ownerId: ownerId,
    });
    setSelectedOwner(null);
  }, [accountId, ownerId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts", accountId, "children", "legal_entity"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Success",
        description: "Sub-account created successfully",
      });
      setShowNewDialog(false);
      form.reset();
      setSelectedOwner(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sub-account",
        variant: "destructive",
      });
    },
  });

  const handleOwnerSelect = (user: User) => {
    setSelectedOwner(user);
    form.setValue("ownerId", user.id);
    setShowUserLookup(false);
  };

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Sub-Accounts</span>
            <Badge variant="secondary" className="ml-2" data-testid="badge-sub-accounts-count">
              {subAccounts.length}
            </Badge>
          </CardTitle>
          {!isEditing && (
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center space-x-1"
                  data-testid="button-new-sub-account"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Sub-Account</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Sub-Account for {accountName}</DialogTitle>
                </DialogHeader>
                <SmartAccountManagementDetailCard
                  account={null}
                  isEditing={true}
                  form={form}
                  updateMutation={createMutation}
                  selectedOwner={selectedOwner}
                  setShowUserLookup={setShowUserLookup}
                  isSettingEnabled={isSettingEnabled}
                  showAccountNature={false}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewDialog(false);
                      form.reset();
                      setSelectedOwner(null);
                    }}
                    data-testid="button-cancel-new-sub-account"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    data-testid="button-save-new-sub-account"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Sub-Account"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading sub-accounts...</div>
          </div>
        ) : subAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No sub-accounts found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subAccounts.map((subAccount) => (
                  <TableRow
                    key={subAccount.id}
                    data-testid={`row-sub-account-${subAccount.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-sub-account-name-${subAccount.id}`}
                    >
                      <Link href={`/accounts/${subAccount.id}`}>
                        <span className="hover:text-primary cursor-pointer">
                          {subAccount.name || "N/A"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell data-testid={`text-sub-account-registration-${subAccount.id}`}>
                      {subAccount.companyRegistrationId || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-sub-account-address-${subAccount.id}`}>
                      {subAccount.address || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <UserLookupDialog
        open={showUserLookup}
        onClose={() => setShowUserLookup(false)}
        onSelect={handleOwnerSelect}
      />
    </Card>
  );
}
