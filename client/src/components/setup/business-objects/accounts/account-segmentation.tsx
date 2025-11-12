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
import { DropDownListFieldTypeEditor } from "@/components/ui/dropdown-list-field-type-editor";

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

export default function AccountSegmentationManagement() {
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

      

      <DropDownListFieldTypeEditor
        sourceType="metadata"
        sourcePath="companies/[companyId]/global_value_sets/industries.globalValueSet-meta.xml"
        title="Industry Types"
        description="Manage the list of industry types available for account segmentation"
        rootKey="GlobalValueSet"
        itemKey="customValue"
      />
    </div>
  );
}
