import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User as UserIcon } from "lucide-react";
import { type User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

interface UserLookupDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  selectedUserId?: string;
  autoSelectCurrentUser?: boolean;
}

export default function UserLookupDialog({ 
  open, 
  onClose, 
  onSelect, 
  selectedUserId,
  autoSelectCurrentUser = false
}: UserLookupDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string>(selectedUserId || "");
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Update selected ID when prop changes
  useEffect(() => {
    setSelectedId(selectedUserId || "");
  }, [selectedUserId]);

  // Auto-select current user when dialog opens if enabled and no user is already selected
  useEffect(() => {
    if (open && autoSelectCurrentUser && currentUser && !selectedUserId) {
      setSelectedId(currentUser.id);
    }
  }, [open, autoSelectCurrentUser, currentUser, selectedUserId]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
    }
  }, [open]);

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    const selectedUser = users.find(user => user.id === selectedId);
    if (selectedUser) {
      onSelect(selectedUser);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    onClose();
  };

  const handleRowClick = (userId: string) => {
    setSelectedId(userId);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>User Lookup</DialogTitle>
          <DialogDescription>
            Search and select a user to assign as the owner.
          </DialogDescription>
        </DialogHeader>

        {/* Search Box */}
        <div className="flex items-center space-x-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-users"
              autoFocus
            />
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-auto border rounded-md">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <UserIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      {searchTerm ? `No users found matching "${searchTerm}"` : "No users available"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedId === user.id ? 'bg-muted/30' : ''}`}
                      onClick={() => handleRowClick(user.id)}
                      data-testid={`row-user-${user.id}`}
                    >
                      <TableCell>
                        <RadioGroupItem 
                          value={user.id} 
                          id={user.id}
                          data-testid={`radio-user-${user.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={user.id} 
                          className="font-medium cursor-pointer"
                          data-testid={`text-user-name-${user.id}`}
                        >
                          {getUserDisplayName(user)}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label 
                          htmlFor={user.id} 
                          className="cursor-pointer text-muted-foreground"
                          data-testid={`text-user-email-${user.id}`}
                        >
                          {user.email || 'No email'}
                        </Label>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            data-testid="button-cancel-lookup"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSelect} 
            disabled={!selectedId || isLoading}
            data-testid="button-select-user"
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}