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
  Boxes,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountSegmentationManagement from "@/components/setup/business-objects/accounts/account-segmentation";
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

// Import page components
import UnitOfMeasuresManagement from "@/components/setup/unit-of-measures";
import AccountManagementModels from "@/components/setup/business-objects/accounts/account-management-models";
import QuoteManagement from "@/components/setup/business-objects/quotes/quote-settings";
import PricingMethods from "@/components/setup/business-objects/quotes/pricing-methods";
import CompanyDefaultSettings from "@/components/setup/business-objects/company-defaults/company-defaults";
import StandardAIServicesSettings from "@/components/setup/business-objects/ai-services/standard-ai-services";
import BusinessObjectsBuilderModule from "@/components/setup/business-object-manager/business-objects-builder-module"; 

// Type for child menu items with component
type ChildMenuItem = {
  id: string;
  label: string;
  description: string;
  component: React.ComponentType;
};

// Type for parent menu items
type MenuItem = {
  id: string;
  label: string;
  icon: any;
  description: string;
  globalAdminOnly?: boolean;
  companyAdminOnly?: boolean;
  category: string;
  component?: React.ComponentType; // For items without children
  children?: ChildMenuItem[]; // For parent items
};

// Setup menu items - BUSINESS OBJECTS
// To add a new menu item:
// 1. Import the component at the top
// 2. Add the menu item here with component reference
const setupMenuItems: MenuItem[] = [
  {
    id: "companyDefaults",
    label: "Company General Settings",
    icon: FileCheck,
    description: "Currency, Language, etc.",
    globalAdminOnly: false,
    category: "business-objects",
    component: CompanyDefaultSettings,
  },
  {
    id: "accounts",
    label: "Account management",
    icon: FileCheck,
    description: "The database of your clients",
    globalAdminOnly: false,
    category: "business-objects",
    children: [
      {
        id: "account-types",
        label: "Account Types",
        description: "Handle different client types",
        component: AccountManagementModels,
      },
      {
        id: "account-segmentation",
        label: "Segmentation",
        description: "Slice your account database",
        component: AccountSegmentationManagement,
      },
      {
        id: "account-lifecycle",
        label: "Account Lifecycle",
        description: "From new, to idle",
        component: () => (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Account Lifecycle</h2>
              <p className="text-muted-foreground"></p>
            </div>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Coming Soon:</p>
                <p className="text-muted-foreground">Account Statuses</p>
                <p className="text-muted-foreground">Account Approval Processes</p>
                <p className="text-muted-foreground">Credit limit</p>
              </CardContent>
            </Card>
          </div>
        ),
      },
    ],
  },
  {
    id: "quotes",
    label: "Quote management",
    icon: FileCheck,
    description: "Manage your Quoting process",
    globalAdminOnly: false,
    category: "business-objects",
    children: [
      {
        id: "quote-settings",
        label: "Quote Settings",
        description: "The fundamentals",
        component: QuoteManagement,
      },
      {
        id: "pricing-settings",
        label: "Pricing Methods",
        description: "Tell us how you price products",
        component: PricingMethods,
      },
      
    ],
  },
  {
    id: "ai-services",
    label: "AI Services",
    icon: Ruler,
    description: "You agents' training center",
    globalAdminOnly: true,
    category: "business-objects",
    children: [
      {
        id: "standard-ai-services",
        label: "Built-in Agent Services",
        description: "The training center",
        component: StandardAIServicesSettings,
      },
      {
        id: "custom-ai-agents",
        label: "Your custom agents",
        description: "The sky is the limit",
        component: StandardAIServicesSettings,
      },

    ],
  },
  {
    id: "object-process-builder",
    label: "Object and Process Builder",
    icon: Boxes,
    description: "Structure and Business Process",
    globalAdminOnly: true,
    category: "business-objects",
    children: [
      {
        id: "object-builder",
        label: "Object Builder",
        description: "Objects, Fields, Layouts, etc.",
        component: BusinessObjectsBuilderModule,
      },

    ],
  },
  {
    id: "unit-of-measures",
    label: "Unit of Measures",
    icon: Ruler,
    description: "Count and measure products",
    globalAdminOnly: true,
    category: "business-objects",
    component: UnitOfMeasuresManagement,
  },
];

export default function BusinessObjectsSetup() {
  const [location, setLocation] = useLocation();
  const [selectedItem, setSelectedItem] = useState("");
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
      const isCurrentItemInFiltered = filteredMenuItems.some(item => {
        // Check if it's a parent item
        if (item.id === selectedItem) return true;
        // Check if it's a child item
        if (item.children?.some(child => child.id === selectedItem)) return true;
        return false;
      });
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

  // Helper function to find the component for the selected menu item
  const getSelectedComponent = (): React.ComponentType | null => {
    // Search through all menu items
    for (const item of setupMenuItems) {
      // Check if it's a parent item (no children) with a component
      if (item.id === selectedItem && item.component) {
        return item.component;
      }
      // Check if it's in the children
      if (item.children) {
        const child = item.children.find(c => c.id === selectedItem);
        if (child?.component) {
          return child.component;
        }
      }
    }
    return null;
  };

  const renderContent = () => {
    const Component = getSelectedComponent();
    
    if (Component) {
      return <Component />;
    }
    
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a setup option from the menu</p>
      </div>
    );
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
                          {item.children!.map((child) => {
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
