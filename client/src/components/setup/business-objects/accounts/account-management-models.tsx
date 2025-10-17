import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from "isomorphic-dompurify";

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
      return apiRequest("PATCH", `/api/business-objects/company-settings/${setting.id}`, { settingValue: newValue });
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

  const handleToggleChange = (checked: boolean) => {
    // Only allow FALSE to TRUE
    if (checked && setting?.settingValue === "FALSE") {
      updateSettingMutation.mutate("TRUE");
    }
  };

  const isActivated = setting?.settingValue === "TRUE";

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
          {isLoadingSetting ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : settingError ? (
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load setting. Please try again.
              </AlertDescription>
            </Alert>
          ) : setting ? (
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="smart-account-toggle" className="text-base font-medium">
                  {setting.settingName}
                </Label>
                {setting.settingDescription && (
                  <p className="text-sm text-muted-foreground">
                    {setting.settingDescription}
                  </p>
                )}
              </div>
              <Switch
                id="smart-account-toggle"
                checked={isActivated}
                onCheckedChange={handleToggleChange}
                disabled={isActivated || updateSettingMutation.isPending}
                data-testid="switch-smart-account-management"
              />
            </div>
          ) : null}

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
        </CardContent>
      </Card>
    </div>
  );
}
