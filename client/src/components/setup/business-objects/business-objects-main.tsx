import { useState, useEffect } from "react";
import {
  Search,
  Users,
  ChevronRight,
  ChevronDown,
  Shield,
  Building2,
  Rocket,
  Ruler,
  Languages,
  FileText,
  FileCode,
  Award,
  FileCheck,
  Building,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Company } from "@shared/schema";
import { useLocation } from "wouter";

// Type for admin check responses
type GlobalAdminCheckResponse = {
  isGlobalAdmin: boolean;
};

type CompanyAdminCheckResponse = {
  isCompanyAdmin: boolean;
};

// Type for menu items
type MenuItem = {
  id: string;
  label: string;
  icon: any;
  description: string;
  globalAdminOnly?: boolean;
  companyAdminOnly?: boolean;
  category: string;
  children?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
};

// Setup menu items - BUSINESS OBJECTS
const setupMenuItems: MenuItem[] = [
  {
    id: "accounts",
    label: "Accounts",
    icon: FileCheck,
    description: "Account management",
    globalAdminOnly: false,
    category: "business-objects",
    children: [
      {
        id: "account-list",
        label: "Account List",
        description: "View and manage all accounts",
      },
      {
        id: "account-types",
        label: "Account Types",
        description: "Configure account types",
      },
    ],
  },
  {
    id: "unit-of-measures",
    label: "Unit of Measures",
    icon: Ruler,
    description: "Discover your options",
    globalAdminOnly: true,
    category: "business-objects",
  },
];

import UnitOfMeasuresManagement from "@/components/setup/unit-of-measures";


// Unit of Measures management component
function UnitOfMeasuresSetup() {
  return <UnitOfMeasuresManagement />;
}

export default function BusinessObjectsSetup() {
  const [location, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"my-company" | "business-objects">("business-objects");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Auto-select menu item based on URL path
  useEffect(() => {
    // Check for nested routes and auto-select the appropriate menu item
    if (location.includes("/setup/knowledge-articles")) {
      setSelectedItem("knowledge-articles");
      setSelectedTab("business-objects");
    } else if (location.includes("/setup/my-company")) {
      setSelectedItem("my-company");
      setSelectedTab("my-company");
    }
    // Add more nested route checks here as needed
  }, [location]);

  // Query to check if user is global admin
  const { data: adminCheck, isLoading: isCheckingAdmin } =
    useQuery<GlobalAdminCheckResponse>({
      queryKey: ["/api/auth/verify-global-admin"],
    });

  // Query to check if user is company admin
  const { data: companyAdminCheck } = useQuery<CompanyAdminCheckResponse>({
    queryKey: ["/api/auth/verify-company-admin"],
  });

  // Query to fetch all companies (for global admin only)
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
    enabled: adminCheck?.isGlobalAdmin === true,
  });

  // Query to fetch current company context name
  const { data: currentCompanyData } = useQuery<{ companyName: string }>({
    queryKey: ["/api/auth/company-name"],
    enabled: adminCheck?.isGlobalAdmin === true,
  });

  // Mutation to switch company context
  const switchContextMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const response = await fetch("/api/auth/switch-company-context", {
        method: "POST",
        body: JSON.stringify({ companyId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to switch company context");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Context Switched",
        description: `Switched to ${data.companyName}`,
      });
      // Invalidate all queries to refresh data with new context
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch company context",
        variant: "destructive",
      });
    },
  });

  // Toggle expanded state for parent items
  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Filter menu items based on admin status and search query
  const availableMenuItems = setupMenuItems.filter((item) => {
    // Hide companies menu item if user is not global admin
    if (item.id === "companies" && !adminCheck?.isGlobalAdmin) {
      return false;
    }
    // Hide items marked globalAdminOnly if user is not global admin
    if (item.globalAdminOnly && !adminCheck?.isGlobalAdmin) {
      return false;
    }
    // Hide items marked companyAdminOnly if user is not company admin or global admin
    if (
      item.companyAdminOnly &&
      !companyAdminCheck?.isCompanyAdmin &&
      !adminCheck?.isGlobalAdmin
    ) {
      return false;
    }
    return true;
  });

  const filteredMenuItems = availableMenuItems.filter((item) => {
    const matchesCategory = item.category === selectedTab;
    if (!matchesCategory) return false;

    const query = searchQuery.toLowerCase();
    if (!query) return true;

    // Check if parent matches
    const parentMatches = 
      item.label.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    // Check if any child matches
    const childMatches = item.children?.some(
      (child) =>
        child.label.toLowerCase().includes(query) ||
        child.description.toLowerCase().includes(query)
    );

    // Auto-expand parent if child matches search
    if (childMatches && !expandedItems.has(item.id)) {
      setExpandedItems((prev) => new Set(prev).add(item.id));
    }

    return parentMatches || childMatches;
  });

  // Reset selectedItem when switching tabs or if current item is not in filtered list
  useEffect(() => {
    if (filteredMenuItems.length > 0) {
      const isCurrentItemInFiltered = filteredMenuItems.some(item => item.id === selectedItem);
      if (!isCurrentItemInFiltered) {
        setSelectedItem(filteredMenuItems[0].id);
      }
    }
  }, [selectedTab, filteredMenuItems, selectedItem]);

  // Handler for applying company context switch
  const handleApplyContextSwitch = () => {
    if (selectedCompanyId) {
      switchContextMutation.mutate(selectedCompanyId);
    }
  };

  const renderContent = () => {
    switch (selectedItem) {
      
      case "unit-of-measures":
        return <UnitOfMeasuresSetup />;
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
      {/* Header Pane */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            {/*<div>
              <h1 className="text-2xl font-bold">Business Objects</h1>
              <p className="text-sm text-muted-foreground">
                Configure the behavior of your system
              </p>
            </div>*/}

            {/* Category Tabs */}
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "my-company" | "business-objects")}>
              <TabsList>
                <TabsTrigger 
                  value="my-company" 
                  data-testid="tab-my-company"
                  onClick={() => setLocation('/setup')}
                >
                  My Company
                </TabsTrigger>
                <TabsTrigger 
                  value="business-objects" 
                  data-testid="tab-business-objects"
                  onClick={() => setLocation('/setup/business-objects')}
                >
                  Business objects manager
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Company Context Switcher - Only for Global Admins */}
          {adminCheck?.isGlobalAdmin && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Company Context:</span>
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="w-[250px]" data-testid="select-company-context">
                    <SelectValue 
                      placeholder={currentCompanyData?.companyName || "Select a company"}
                    >
                      {selectedCompanyId 
                        ? companies?.find(c => c.id === selectedCompanyId)?.companyOfficialName 
                        : currentCompanyData?.companyName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem 
                        key={company.id} 
                        value={company.id}
                        data-testid={`select-company-${company.id}`}
                      >
                        {company.companyOfficialName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleApplyContextSwitch}
                disabled={!selectedCompanyId || switchContextMutation.isPending}
                data-testid="button-apply-context"
              >
                {switchContextMutation.isPending ? "Applying..." : "Apply"}
              </Button>
            </div>
          )}
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
                placeholder="Search business objects..."
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
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.has(item.id);
                const isParentSelected = selectedItem === item.id;

                if (hasChildren) {
                  // Render collapsible parent item with children
                  return (
                    <Collapsible
                      key={item.id}
                      open={isExpanded}
                      onOpenChange={() => toggleExpanded(item.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-3 h-auto"
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
                            <ChevronDown
                              className={`h-4 w-4 flex-shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-9 mt-1 space-y-1">
                          {item.children.map((child) => {
                            const isChildSelected = selectedItem === child.id;
                            return (
                              <Button
                                key={child.id}
                                variant={isChildSelected ? "secondary" : "ghost"}
                                className="w-full justify-start p-2 h-auto text-sm"
                                onClick={() => setSelectedItem(child.id)}
                                data-testid={`button-setup-${child.id}`}
                              >
                                <div className="flex items-center space-x-2 w-full">
                                  <div className="flex-1 text-left">
                                    <div className="font-medium">{child.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {child.description}
                                    </div>
                                  </div>
                                  {isChildSelected && (
                                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                } else {
                  // Render regular item without children
                  return (
                    <Button
                      key={item.id}
                      variant={isParentSelected ? "secondary" : "ghost"}
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
                        {isParentSelected && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </div>
                    </Button>
                  );
                }
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
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
