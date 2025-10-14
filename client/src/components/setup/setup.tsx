import { useState, useEffect } from "react";
import {
  Search,
  Users,
  ChevronRight,
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

// Setup menu items
const setupMenuItems = [
  {
    id: "my-company",
    label: "My Company",
    icon: Building,
    description: "Your company information",
    companyAdminOnly: true,
    category: "my-company",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    description: "Manage user accounts and permissions",
    category: "my-company",
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    description: "Manage company information and details",
    category: "my-company",
  },
  {
    id: "company-roles",
    label: "Company Roles (in dev)",
    icon: Shield,
    description: "Manage reporting hierarchy",
    category: "my-company",
  },
  {
    id: "releases",
    label: "Release Plan",
    icon: Rocket,
    description: "Manage release planning and tracking",
    category: "my-company",
  },
  {
    id: "unit-of-measures",
    label: "Unit of Measures",
    icon: Ruler,
    description: "Manage measurement units and conversions",
    globalAdminOnly: true,
    category: "business-objects",
  },
  {
    id: "knowledge-articles",
    label: "Knowledge Articles",
    icon: BookOpen,
    description: "Manage knowledge base articles and documentation",
    globalAdminOnly: true,
    category: "business-objects",
  },
  {
    id: "languages",
    label: "Languages",
    icon: Languages,
    description: "Manage system languages",
    globalAdminOnly: true,
    category: "my-company",
  },
  {
    id: "translations",
    label: "Translations",
    icon: FileText,
    description: "Manage translation labels and content",
    globalAdminOnly: true,
    category: "my-company",
  },
  {
    id: "dev-patterns",
    label: "Dev Patterns",
    icon: FileCode,
    description: "Manage development patterns",
    globalAdminOnly: true,
    category: "my-company",
  },
  {
    id: "licences",
    label: "Licences",
    icon: Award,
    description: "Manage licence types",
    globalAdminOnly: true,
    category: "my-company",
  },
  {
    id: "licence-agreement-templates",
    label: "Licence Agreement Templates",
    icon: FileText,
    description: "Manage agreement templates",
    globalAdminOnly: true,
    category: "my-company",
  },
  {
    id: "licence-agreements",
    label: "Licence Agreements",
    icon: FileCheck,
    description: "Manage company licence agreements",
    globalAdminOnly: true,
    category: "my-company",
  },
];

import UserManagement from "@/components/setup/user-management";
import RoleHierarchy from "@/components/setup/role-hierarchy";
import CompanyManagement from "@/components/setup/company-management";
import ReleaseManagement from "@/components/setup/release-management";
import UnitOfMeasuresManagement from "@/components/setup/unit-of-measures";
import LanguagesManagement from "@/components/setup/languages";
import TranslationsManagement from "@/components/setup/translations";
import DevPatternsManagement from "@/components/setup/dev-patterns";
import LicencesManagement from "@/components/setup/licences";
import LicenceAgreementTemplatesManagement from "@/components/setup/licence-agreement-templates";
import LicenceAgreementsManagement from "@/components/setup/licence-agreements";
import CompanyDetail from "@/components/setup/company-detail";
import KnowledgeArticlesManagement from "@/components/setup/knowledge-articles";

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

// Release Plan management component
function ReleasesSetup() {
  return <ReleaseManagement />;
}

// Unit of Measures management component
function UnitOfMeasuresSetup() {
  return <UnitOfMeasuresManagement />;
}

// Languages management component
function LanguagesSetup() {
  return <LanguagesManagement />;
}

// Translations management component
function TranslationsSetup() {
  return <TranslationsManagement />;
}

// Dev Patterns management component
function DevPatternsSetup() {
  return <DevPatternsManagement />;
}

export default function Setup() {
  const [location] = useLocation();
  const [selectedItem, setSelectedItem] = useState("companies");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"my-company" | "business-objects">("my-company");
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

  // Filter menu items based on admin status and search query
  const availableMenuItems = setupMenuItems.filter((item) => {
    // Hide companies menu item if user is not global admin
    if (item.id === "companies" && !adminCheck?.isGlobalAdmin) {
      return false;
    }
    // Hide items marked globalAdminOnly if user is not global admin
    if ((item as any).globalAdminOnly && !adminCheck?.isGlobalAdmin) {
      return false;
    }
    // Hide items marked companyAdminOnly if user is not company admin or global admin
    if (
      (item as any).companyAdminOnly &&
      !companyAdminCheck?.isCompanyAdmin &&
      !adminCheck?.isGlobalAdmin
    ) {
      return false;
    }
    return true;
  });

  const filteredMenuItems = availableMenuItems.filter(
    (item) =>
      (item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (item as any).category === selectedTab,
  );

  // If selected item is companies but user is not admin, default to first available item
  useEffect(() => {
    if (selectedItem === "companies" && adminCheck?.isGlobalAdmin === false) {
      if (availableMenuItems.length > 0) {
        setSelectedItem(availableMenuItems[0].id);
      }
    }
  }, [adminCheck?.isGlobalAdmin, selectedItem, availableMenuItems]);

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
      case "companies":
        return <CompaniesSetup />;
      case "users":
        return <UsersSetup />;
      case "company-roles":
        return <CompanyRolesSetup />;
      case "releases":
        return <ReleasesSetup />;
      case "unit-of-measures":
        return <UnitOfMeasuresSetup />;
      case "knowledge-articles":
        return <KnowledgeArticlesManagement />;
      case "languages":
        return <LanguagesSetup />;
      case "translations":
        return <TranslationsSetup />;
      case "dev-patterns":
        return <DevPatternsSetup />;
      case "licences":
        return <LicencesManagement />;
      case "licence-agreement-templates":
        return <LicenceAgreementTemplatesManagement />;
      case "licence-agreements":
        return <LicenceAgreementsManagement />;
      case "my-company":
        return <CompanyDetail />;
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
            <div>
              <h1 className="text-2xl font-bold">Setup</h1>
              <p className="text-sm text-muted-foreground">
                Configure your application settings
              </p>
            </div>
            
            {/* Category Tabs */}
            <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "my-company" | "business-objects")}>
              <TabsList>
                <TabsTrigger value="my-company" data-testid="tab-my-company">
                  My Company
                </TabsTrigger>
                <TabsTrigger value="business-objects" data-testid="tab-business-objects">
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
        <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
