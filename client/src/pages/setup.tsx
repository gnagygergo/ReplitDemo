import { useState, useEffect } from "react";
import { Search, Users, ChevronRight, Shield, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

// Type for global admin check response
type AdminCheckResponse = {
  isGlobalAdmin: boolean;
};

// Setup menu items
const setupMenuItems = [
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    description: "Manage company information and details",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "Manage user accounts and permissions",
  },
  {
    id: "company-roles",
    label: "Company Roles",
    icon: Shield,
    description: "Manage company role hierarchy and assignments",
  },
];

import UserManagement from "@/components/setup/user-management";
import RoleHierarchy from "@/components/setup/role-hierarchy";
import CompanyManagement from "@/components/setup/company-management";

// Companies management component
function CompaniesSetup() {
  return <CompanyManagement />;
}

// Users management component
function UsersSetup() {
  return <UserManagement />;
}

// Company Roles management component
function CompanyRolesSetup() {
  return <RoleHierarchy />;
}

export default function Setup() {
  const [selectedItem, setSelectedItem] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");

  // Query to check if user is global admin
  const { data: adminCheck, isLoading: isCheckingAdmin } = useQuery<AdminCheckResponse>({
    queryKey: ["/api/auth/verify-global-admin"],
  });

  // Filter menu items based on admin status and search query
  const availableMenuItems = setupMenuItems.filter(item => {
    // Hide companies menu item if user is not global admin
    if (item.id === "companies" && !adminCheck?.isGlobalAdmin) {
      return false;
    }
    return true;
  });

  const filteredMenuItems = availableMenuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If selected item is companies but user is not admin, default to first available item
  useEffect(() => {
    if (selectedItem === "companies" && adminCheck?.isGlobalAdmin === false) {
      if (availableMenuItems.length > 0) {
        setSelectedItem(availableMenuItems[0].id);
      }
    }
  }, [adminCheck?.isGlobalAdmin, selectedItem, availableMenuItems]);

  const renderContent = () => {
    switch (selectedItem) {
      case "companies":
        return <CompaniesSetup />;
      case "users":
        return <UsersSetup />;
      case "company-roles":
        return <CompanyRolesSetup />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a setup option from the menu</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Pane - Empty for now */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Setup</h1>
            <p className="text-sm text-muted-foreground">
              Configure your application settings
            </p>
          </div>
        </div>
      </div>

      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane - Setup Menu */}
        <div className="w-80 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search setup options..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-setup-search"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedItem === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => setSelectedItem(item.id)}
                    data-testid={`button-setup-${item.id}`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 text-left space-y-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      {isSelected && (
                        <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            {filteredMenuItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No setup options match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}