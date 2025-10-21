import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "isomorphic-dompurify";
import SetupToggleLister from "@/components/setup/setup-toggle-lister";

type CompanySettingWithMaster = {
  id: string;
  companySettingsMasterId: string;
  settingCode: string | null;
  settingName: string | null;
  settingValue: string | null;
  companyId: string | null;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  lastUpdatedBy: string | null;
  settingFunctionalDomainCode: string | null;
  settingFunctionalDomainName: string | null;
  settingDescription: string | null;
  settingValues: string | null;
  defaultValue: string | null;
  cantBeTrueIfTheFollowingIsFalse: string | null;
  settingOrderWithinFunctionality: number | null;
  settingShowsInLevel: number | null;
};

type KnowledgeArticle = {
  id: string;
  articleTitle: string;
  articleCode: string | null;
  articleContent: string;
  functionalDomainId: string | null;
  functionalityId: string | null;
  languageCode: string | null;
  articleFunctionalDomain: string | null;
  articleFunctionalityName: string | null;
  articleTags: string | null;
  articleKeywords: string | null;
  isPublished: boolean;
  isInternal: boolean;
  authorId: string;
  createdDate: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export default function AccountManagementModels() {
  const [isArticleOpen, setIsArticleOpen] = useState(true);
  const { toast } = useToast();
  
  const { data: setting, isLoading: isLoadingSetting, error: settingError } = useQuery<CompanySettingWithMaster>({
    queryKey: ["/api/business-objects/company-settings/by-code", "Smart_account_management_activated"],
    queryFn: async () => {
      const response = await fetch("/api/business-objects/company-settings/by-code/Smart_account_management_activated", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch company setting");
      }
      return response.json();
    },
  });

  const { data: article, isLoading: isLoadingArticle, error: articleError } = useQuery<KnowledgeArticle>({
    queryKey: ["/api/knowledge-articles/by-code", "smart_account_management_intro"],
    queryFn: async () => {
      const response = await fetch("/api/knowledge-articles/by-code/smart_account_management_intro", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch knowledge article");
      }
      return response.json();
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (newValue: string) => {
      if (!setting?.id) throw new Error("Setting ID not found");
      const response = await fetch(`/api/business-objects/company-settings/${setting.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settingValue: newValue }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update setting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-code", "Smart_account_management_activated"] });
      toast({
        title: "Success",
        description: "Smart Account Management has been activated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="heading-account-management-models">
          Quote Settings
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure how your Quoting system should work
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Quote Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="general_quote_setting"
            title=""
          />
        </CardContent>
      </Card>
    </div>
  );
}
