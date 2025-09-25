import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit, Trash2, Users, ChevronRight, ChevronDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CompanyRoleWithParent, UserRoleAssignmentWithUserAndRole, User } from "@shared/schema";

// Tree node component for role hierarchy
interface TreeNodeProps {
  role: CompanyRoleWithParent;
  allRoles: CompanyRoleWithParent[];
  onSelectRole: (role: CompanyRoleWithParent) => void;
  selectedRoleId?: string;
  expandedNodes: Set<string>;
  onToggleExpand: (roleId: string) => void;
}

function TreeNode({ role, allRoles, onSelectRole, selectedRoleId, expandedNodes, onToggleExpand }: TreeNodeProps) {
  const childRoles = allRoles.filter(r => r.parentCompanyRoleId === role.id);
  const hasChildren = childRoles.length > 0;
  const isExpanded = expandedNodes.has(role.id);
  const isSelected = selectedRoleId === role.id;

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-accent/50 ${
          isSelected ? 'bg-accent' : ''
        }`}
        onClick={() => onSelectRole(role)}
        data-testid={`tree-node-role-${role.id}`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mr-1"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onToggleExpand(role.id);
            }
          }}
          disabled={!hasChildren}
          data-testid={`button-expand-${role.id}`}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>
        <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="font-medium">{role.name}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-6 pl-2 border-l border-border">
          {childRoles.map(childRole => (
            <TreeNode
              key={childRole.id}
              role={childRole}
              allRoles={allRoles}
              onSelectRole={onSelectRole}
              selectedRoleId={selectedRoleId}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoleHierarchy() {
  const [selectedRole, setSelectedRole] = useState<CompanyRoleWithParent | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleParentId, setNewRoleParentId] = useState<string>("null");
  const [isAssigningUser, setIsAssigningUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const { toast } = useToast();

  // Fetch company roles
  const { data: companyRoles = [], isLoading: isLoadingRoles, error: rolesError } = useQuery<CompanyRoleWithParent[]>({
    queryKey: ['/api/company-roles'],
  });

  // Fetch users for assignment
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch user role assignments for selected role
  const { data: userAssignments = [], isLoading: isLoadingAssignments } = useQuery<UserRoleAssignmentWithUserAndRole[]>({
    queryKey: ['/api/user-role-assignments/by-role', selectedRole?.id],
    enabled: !!selectedRole?.id,
  });

  // Create company role mutation
  const createRoleMutation = useMutation({
    mutationFn: (roleData: { name: string; parentCompanyRoleId?: string }) =>
      apiRequest('POST', '/api/company-roles', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-roles'] });
      setIsCreatingRole(false);
      setNewRoleName("");
      setNewRoleParentId("null");
      toast({ title: "Company role created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create company role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update company role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, ...roleData }: { id: string; name: string; parentCompanyRoleId?: string }) =>
      apiRequest('PATCH', `/api/company-roles/${id}`, roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-roles'] });
      setIsEditingRole(false);
      setNewRoleName("");
      setNewRoleParentId("null");
      toast({ title: "Company role updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update company role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete company role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/company-roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company-roles'] });
      setSelectedRole(null);
      toast({ title: "Company role deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete company role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Create user role assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: (assignmentData: { userId: string; companyRoleId: string }) =>
      apiRequest('POST', '/api/user-role-assignments', assignmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-role-assignments/by-role', selectedRole?.id] });
      setIsAssigningUser(false);
      setSelectedUserId("");
      toast({ title: "User assigned to role successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to assign user to role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete user role assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/user-role-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-role-assignments/by-role', selectedRole?.id] });
      toast({ title: "User removed from role successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to remove user from role", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Get root roles (roles without parent)
  const rootRoles = companyRoles.filter((role: CompanyRoleWithParent) => !role.parentCompanyRoleId);

  const handleToggleExpand = (roleId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({ title: "Please enter a role name", variant: "destructive" });
      return;
    }
    
    createRoleMutation.mutate({
      name: newRoleName.trim(),
      parentCompanyRoleId: newRoleParentId === "null" ? undefined : newRoleParentId || undefined,
    });
  };

  const handleUpdateRole = () => {
    if (!selectedRole || !newRoleName.trim()) {
      toast({ title: "Please enter a role name", variant: "destructive" });
      return;
    }
    
    updateRoleMutation.mutate({
      id: selectedRole.id,
      name: newRoleName.trim(),
      parentCompanyRoleId: newRoleParentId === "null" ? undefined : newRoleParentId || undefined,
    });
  };

  const handleDeleteRole = () => {
    if (!selectedRole) return;
    
    if (confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
      deleteRoleMutation.mutate(selectedRole.id);
    }
  };

  const handleAssignUser = () => {
    if (!selectedRole || !selectedUserId) {
      toast({ title: "Please select a user", variant: "destructive" });
      return;
    }
    
    createAssignmentMutation.mutate({
      userId: selectedUserId,
      companyRoleId: selectedRole.id,
    });
  };

  const handleRemoveUserAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to remove this user from the role?")) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

  // Initialize edit form when selectedRole changes
  useEffect(() => {
    if (selectedRole && isEditingRole) {
      setNewRoleName(selectedRole.name);
      setNewRoleParentId(selectedRole.parentCompanyRoleId || "null");
    }
  }, [selectedRole, isEditingRole]);

  const availableUsers = users.filter((user: User) => 
    !userAssignments.some((assignment: UserRoleAssignmentWithUserAndRole) => 
      assignment.userId === user.id
    )
  );

  return (
    <div className="h-full flex gap-6">
      {/* Left Section - Role Hierarchy Tree */}
      <div className="w-1/2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Company Role Hierarchy
              </CardTitle>
              <Button
                onClick={() => setIsCreatingRole(true)}
                size="sm"
                data-testid="button-create-role"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Role
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingRoles ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading roles...
              </div>
            ) : rolesError ? (
              <div className="text-center py-8 text-destructive">
                Failed to load roles
              </div>
            ) : rootRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No company roles created yet</p>
                <p className="text-sm">Click "New Role" to create your first role</p>
              </div>
            ) : (
              <div className="space-y-1">
                {rootRoles.map((role: CompanyRoleWithParent) => (
                  <TreeNode
                    key={role.id}
                    role={role}
                    allRoles={companyRoles}
                    onSelectRole={setSelectedRole}
                    selectedRoleId={selectedRole?.id}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            )}

            {/* Create Role Form */}
            {isCreatingRole && (
              <Card className="border-dashed">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-role-name">Role Name</Label>
                    <Input
                      id="new-role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                      data-testid="input-new-role-name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-role-parent">Parent Role (Optional)</Label>
                    <Select value={newRoleParentId} onValueChange={setNewRoleParentId}>
                      <SelectTrigger data-testid="select-new-role-parent">
                        <SelectValue placeholder="Select parent role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">No Parent (Root Role)</SelectItem>
                        {companyRoles.map((role: CompanyRoleWithParent) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateRole}
                      disabled={createRoleMutation.isPending}
                      data-testid="button-save-new-role"
                    >
                      {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreatingRole(false);
                        setNewRoleName("");
                        setNewRoleParentId("null");
                      }}
                      data-testid="button-cancel-new-role"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Section - User Assignments */}
      <div className="w-1/2 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Assignments
                {selectedRole && (
                  <span className="text-sm font-normal text-muted-foreground">
                    for "{selectedRole.name}"
                  </span>
                )}
              </CardTitle>
              {selectedRole && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingRole(true)}
                    data-testid="button-edit-role"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Role
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteRole}
                    disabled={deleteRoleMutation.isPending}
                    data-testid="button-delete-role"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedRole ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Select a role to view user assignments</p>
              </div>
            ) : (
              <>
                {/* Role Details */}
                <div className="space-y-2">
                  <h3 className="font-medium">Role Details</h3>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Name:</strong> {selectedRole.name}</p>
                    <p><strong>Parent Role:</strong> {selectedRole.parentCompanyRole?.name || "None (Root Role)"}</p>
                  </div>
                </div>

                <Separator />

                {/* User Assignments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Assigned Users</h3>
                    <Button
                      onClick={() => setIsAssigningUser(true)}
                      size="sm"
                      disabled={availableUsers.length === 0}
                      data-testid="button-assign-user"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Assign User
                    </Button>
                  </div>

                  {isLoadingAssignments ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Loading assignments...
                    </div>
                  ) : userAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      <p>No users assigned to this role</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userAssignments.map((assignment: UserRoleAssignmentWithUserAndRole) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`assignment-${assignment.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                              {assignment.user.firstName?.[0] || assignment.user.email?.[0] || "U"}
                            </div>
                            <div>
                              <p className="font-medium">
                                {assignment.user.firstName && assignment.user.lastName
                                  ? `${assignment.user.firstName} ${assignment.user.lastName}`
                                  : assignment.user.email}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.user.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUserAssignment(assignment.id)}
                            disabled={deleteAssignmentMutation.isPending}
                            data-testid={`button-remove-assignment-${assignment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assign User Form */}
                  {isAssigningUser && (
                    <Card className="border-dashed">
                      <CardContent className="pt-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="assign-user">Select User</Label>
                          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger data-testid="select-assign-user">
                              <SelectValue placeholder="Select user to assign" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsers.map((user: User) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName} (${user.email})`
                                    : user.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAssignUser}
                            disabled={createAssignmentMutation.isPending}
                            data-testid="button-save-assignment"
                          >
                            {createAssignmentMutation.isPending ? "Assigning..." : "Assign User"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAssigningUser(false);
                              setSelectedUserId("");
                            }}
                            data-testid="button-cancel-assignment"
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Edit Role Form */}
                {isEditingRole && (
                  <Card className="border-dashed">
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-role-name">Role Name</Label>
                        <Input
                          id="edit-role-name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Enter role name"
                          data-testid="input-edit-role-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-role-parent">Parent Role</Label>
                        <Select value={newRoleParentId} onValueChange={setNewRoleParentId}>
                          <SelectTrigger data-testid="select-edit-role-parent">
                            <SelectValue placeholder="Select parent role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">No Parent (Root Role)</SelectItem>
                            {companyRoles
                              .filter((role: CompanyRoleWithParent) => role.id !== selectedRole.id)
                              .map((role: CompanyRoleWithParent) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateRole}
                          disabled={updateRoleMutation.isPending}
                          data-testid="button-save-edit-role"
                        >
                          {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingRole(false);
                            setNewRoleName("");
                            setNewRoleParentId("null");
                          }}
                          data-testid="button-cancel-edit-role"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}