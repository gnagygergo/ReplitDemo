import { useState } from "react";
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
import { MapPin, Plus } from "lucide-react";
import { Link } from "wouter";
import type { AccountWithOwner, InsertAccount, User } from "@shared/schema";
import { insertAccountSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SmartAccountManagementDetailCard from "./smart-account-management-detail-card";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

interface AccountShippingAddressesListCardProps {
  accountId: string;
  accountName: string;
  isEditing: boolean;
  isSettingEnabled: (settingCode: string) => boolean;
  ownerId: string;
}

export default function AccountShippingAddressesListCard({
  accountId,
  accountName,
  isEditing,
  isSettingEnabled,
  ownerId,
}: AccountShippingAddressesListCardProps) {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  const { data: addresses = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts", accountId, "children", "shipping"],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounts/${accountId}/children?type=shipping`
      );
      if (!response.ok) throw new Error("Failed to fetch shipping addresses");
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
      isShippingAddress: true,
      isLegalEntity: false,
      isPersonAccount: false,
      isSelfEmployed: false,
      isCompanyContact: false,
      parentAccountId: accountId,
      ownerId: ownerId,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts", accountId, "children", "shipping"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Success",
        description: "Shipping address created successfully",
      });
      setShowNewDialog(false);
      form.reset();
      setSelectedOwner(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create shipping address",
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
            <MapPin className="w-5 h-5" />
            <span>Shipping Addresses</span>
            <Badge variant="secondary" className="ml-2" data-testid="badge-shipping-addresses-count">
              {addresses.length}
            </Badge>
          </CardTitle>
          {!isEditing && (
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center space-x-1"
                  data-testid="button-new-shipping-address"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Address</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Shipping Address for {accountName}</DialogTitle>
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
                    data-testid="button-cancel-new-shipping-address"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    data-testid="button-save-new-shipping-address"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Address"}
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
            <div className="animate-pulse">Loading shipping addresses...</div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No shipping addresses found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow
                    key={address.id}
                    data-testid={`row-shipping-address-${address.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-shipping-address-name-${address.id}`}
                    >
                      <Link href={`/accounts/${address.id}`}>
                        <span className="hover:text-primary cursor-pointer">
                          {address.name || "N/A"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell data-testid={`text-shipping-address-address-${address.id}`}>
                      {address.address || "N/A"}
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
