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
import { Users, Plus } from "lucide-react";
import { Link } from "wouter";
import type { AccountWithOwner, InsertAccount, User } from "@shared/schema";
import { insertAccountSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SmartAccountManagementDetailCard from "./smart-account-management-detail-card";
import UserLookupDialog from "@/components/ui/user-lookup-dialog";

interface AccountCompanyContactsListCardProps {
  accountId: string;
  accountName: string;
  isEditing: boolean;
  isSettingEnabled: (settingCode: string) => boolean;
}

export default function AccountCompanyContactsListCard({
  accountId,
  accountName,
  isEditing,
  isSettingEnabled,
}: AccountCompanyContactsListCardProps) {
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);

  const { data: contacts = [], isLoading } = useQuery<AccountWithOwner[]>({
    queryKey: ["/api/accounts", accountId, "children", "contact"],
    queryFn: async () => {
      const response = await fetch(
        `/api/accounts/${accountId}/children?type=contact`
      );
      if (!response.ok) throw new Error("Failed to fetch company contacts");
      return response.json();
    },
    enabled: !!accountId,
  });

  const { data: parentAccount } = useQuery<AccountWithOwner>({
    queryKey: ["/api/accounts", accountId],
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
      isCompanyContact: true,
      isLegalEntity: false,
      isPersonAccount: false,
      isSelfEmployed: false,
      isShippingAddress: false,
      parentAccountId: accountId,
      ownerId: "",
    },
  });

  useEffect(() => {
    if (parentAccount?.ownerId) {
      form.setValue("ownerId", parentAccount.ownerId);
    }
  }, [parentAccount, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertAccount) => {
      const response = await apiRequest("POST", "/api/accounts", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts", accountId, "children", "contact"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({
        title: "Success",
        description: "Company contact created successfully",
      });
      setShowNewDialog(false);
      form.reset();
      setSelectedOwner(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create company contact",
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
            <Users className="w-5 h-5" />
            <span>Company Contacts</span>
            <Badge variant="secondary" className="ml-2" data-testid="badge-contacts-count">
              {contacts.length}
            </Badge>
          </CardTitle>
          {!isEditing && (
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center space-x-1"
                  data-testid="button-new-company-contact"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Contact</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>New Company Contact for {accountName}</DialogTitle>
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
                    data-testid="button-cancel-new-contact"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending}
                    data-testid="button-save-new-contact"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Contact"}
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
            <div className="animate-pulse">Loading company contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No company contacts found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    data-testid={`row-contact-${contact.id}`}
                  >
                    <TableCell
                      className="font-medium"
                      data-testid={`text-contact-name-${contact.id}`}
                    >
                      <Link href={`/accounts/${contact.id}`}>
                        <span className="hover:text-primary cursor-pointer">
                          {contact.name || "N/A"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell data-testid={`text-contact-email-${contact.id}`}>
                      {contact.email || "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-contact-phone-${contact.id}`}>
                      {contact.mobilePhone || "N/A"}
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
