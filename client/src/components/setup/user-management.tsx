import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType, Language, LicenceAgreementWithDetails } from "@shared/schema";

const userUpdateSchema = z.object({
  licenceAgreementId: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  preferredLanguage: z.string().optional(),
  profileImageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  isAdmin: z.boolean().optional(),
});

const userCreateSchema = z.object({
  licenceAgreementId: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  profileImageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional(),
});

type UserUpdate = z.infer<typeof userUpdateSchema>;
type UserCreate = z.infer<typeof userCreateSchema>;

function UserEditDialog({ user, onClose }: { user: UserType; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  const { data: availableLicenceAgreements = [] } = useQuery<LicenceAgreementWithDetails[]>({
    queryKey: ["/api/licence-agreements/available"],
  });

  const form = useForm<UserUpdate>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      licenceAgreementId: user.licenceAgreementId || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      preferredLanguage: user.preferredLanguage || "",
      profileImageUrl: user.profileImageUrl || "",
      isAdmin: user.isAdmin || false,
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdate) => {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to update user";
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user",
      });
    },
  });

  const onSubmit = (data: UserUpdate) => {
    updateUserMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="licenceAgreementId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Licence Agreement</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-user-licence-agreement">
                      <SelectValue placeholder="Select a licence agreement" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableLicenceAgreements.map((agreement) => (
                      <SelectItem
                        key={agreement.id}
                        value={agreement.id}
                        data-testid={`option-licence-agreement-${agreement.id}`}
                      >
                        {agreement.licenceAgreementTemplate?.name || agreement.id} - {agreement.licenceSeatsRemaining} seats remaining
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} data-testid="input-user-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} data-testid="input-user-first-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} data-testid="input-user-last-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredLanguage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Language</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-user-preferred-language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem
                        key={language.id}
                        value={language.languageCode}
                        data-testid={`option-language-${language.languageCode}`}
                      >
                        {language.languageCode} - {language.languageName}
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
            name="profileImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter profile image URL (optional)" {...field} data-testid="input-user-profile-image" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-user-is-admin"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is Admin</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-save-user">
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function UserCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availableLicenceAgreements = [] } = useQuery<LicenceAgreementWithDetails[]>({
    queryKey: ["/api/licence-agreements/available"],
  });

  const form = useForm<UserCreate>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      licenceAgreementId: "",
      email: "",
      firstName: "",
      lastName: "",
      profileImageUrl: "",
      password: "",
      isAdmin: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserCreate) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to create user";
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text;
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user",
      });
    },
  });

  const onSubmit = (data: UserCreate) => {
    createUserMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create User</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="licenceAgreementId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Licence Agreement</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-create-user-licence-agreement">
                      <SelectValue placeholder="Select a licence agreement" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableLicenceAgreements.map((agreement) => (
                      <SelectItem
                        key={agreement.id}
                        value={agreement.id}
                        data-testid={`option-create-licence-agreement-${agreement.id}`}
                      >
                        {agreement.licenceAgreementTemplate?.name || agreement.id} - {agreement.licenceSeatsRemaining} seats remaining
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} data-testid="input-create-user-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} data-testid="input-create-user-first-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} data-testid="input-create-user-last-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="profileImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter profile image URL (optional)" {...field} data-testid="input-create-user-profile-image" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter password (min 6 characters)" {...field} data-testid="input-create-user-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-create-user-is-admin"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Is Admin</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-save-create-user">
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success", 
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    },
  });

  const filteredUsers = users.filter((user: UserType) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query)
    );
  });

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getUserDisplayName = (user: UserType) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email?.split("@")[0] || "Unknown User";
  };

  const getUserInitials = (user: UserType) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Users</h3>
            <p className="text-sm text-muted-foreground">
              Manage user accounts and access permissions
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading users...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Users</h3>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and access permissions
          </p>
        </div>
        <Button onClick={() => setIsCreatingUser(true)} data-testid="button-create-user">
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-user-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Accounts ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery ? "No users match your search" : "No users found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: UserType) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || ""} alt={getUserDisplayName(user)} />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium" data-testid={`user-name-${user.id}`}>
                          {getUserDisplayName(user)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`user-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell data-testid={`text-user-admin-${user.id}`}>
                      {user.isGlobalAdmin ? (
                        <span className="text-green-600 font-medium">
                          Global Admin
                        </span>
                      ) : user.isAdmin ? (
                        <span className="text-blue-600 font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">User</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {getUserDisplayName(user)}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                data-testid={`button-confirm-delete-user-${user.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        {editingUser && (
          <UserEditDialog
            user={editingUser}
            onClose={() => setEditingUser(null)}
          />
        )}
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreatingUser} onOpenChange={(open) => !open && setIsCreatingUser(false)}>
        {isCreatingUser && (
          <UserCreateDialog
            onClose={() => setIsCreatingUser(false)}
          />
        )}
      </Dialog>
    </div>
  );
}