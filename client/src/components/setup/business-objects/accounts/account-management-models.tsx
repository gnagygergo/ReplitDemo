import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown } from "lucide-react";
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

  // Sanitize HTML content from knowledge article
  const sanitizedContent = useMemo(() => {
    if (!article?.articleContent) return "";
    return DOMPurify.sanitize(article.articleContent);
  }, [article?.articleContent]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold" data-testid="heading-account-management-models">
          Account Management Models
        </h2>
        <p className="text-muted-foreground mt-2">
          Configure and manage your account data models
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Smart Account Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SetupToggleLister 
            settingPrefix="Smart_account_management_activated"
            title=""
          />

          {isLoadingArticle ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : articleError ? (
            <Alert variant="destructive" data-testid="alert-article-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load article content.
              </AlertDescription>
            </Alert>
          ) : article ? (
            <Collapsible open={isArticleOpen} onOpenChange={setIsArticleOpen}>
              <CollapsibleTrigger asChild>
                <button 
                  className="flex w-full items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  data-testid="button-toggle-article"
                >
                  <span className="text-sm font-medium">{article.articleTitle}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isArticleOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div 
                  className="rounded-lg border p-4 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  data-testid="content-article"
                />
              </CollapsibleContent>
            </Collapsible>
          ) : null}

          <SetupToggleLister 
            settingPrefix="smart_account_management_accountType_"
            title="Account Types - tell us who are your clients"
          />
        </CardContent>
      </Card>
    </div>
  );
}
