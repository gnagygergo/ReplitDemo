import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [parentSetting, setParentSetting] = useState<CompanySettingWithMaster | null>(null);
  const [dependentSettings, setDependentSettings] = useState<CompanySettingWithMaster[]>([]);
  const { toast } = useToast();
  
  // Helper function to get indentation class based on settingShowsInLevel
  const getIndentationClass = (level: number | null | undefined): string => {
    if (!level || level === 1) return "ml-0";
    if (level === 2) return "ml-8";
    if (level === 3) return "ml-16";
    return "ml-0"; // Default for any other value
  };
  
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

  const { data: accountTypeSettings, isLoading: isLoadingAccountTypes, error: accountTypesError } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/business-objects/company-settings/by-prefix", "smart_account_management_accountType_"],
    queryFn: async () => {
      const response = await fetch("/api/business-objects/company-settings/by-prefix/smart_account_management_accountType_", {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch account type settings");
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

  const updateAccountTypeSettingMutation = useMutation({
    mutationFn: async ({ id, newValue }: { id: string; newValue: string }) => {
      return apiRequest("PATCH", `/api/business-objects/company-settings/${id}`, { settingValue: newValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-prefix", "smart_account_management_accountType_"] });
      toast({
        title: "Success",
        description: "Account type setting updated",
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

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; settingValue: string }>) => {
      const response = await apiRequest("POST", "/api/business-objects/company-settings/bulk-update", { updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-prefix", "smart_account_management_accountType_"] });
      setIsConfirmDialogOpen(false);
      setParentSetting(null);
      setDependentSettings([]);
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
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

  const handleAccountTypeToggleChange = async (accountTypeSetting: CompanySettingWithMaster, checked: boolean) => {
    // If turning ON, just update directly
    if (checked) {
      updateAccountTypeSettingMutation.mutate({ id: accountTypeSetting.id, newValue: "TRUE" });
      return;
    }

    // If turning OFF, check for dependent settings
    try {
      const response = await fetch(`/api/business-objects/company-settings/${accountTypeSetting.id}/dependents`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to check dependencies");
      }
      
      const dependents: CompanySettingWithMaster[] = await response.json();
      
      if (dependents.length > 0) {
        // Show confirmation dialog with dependent settings
        setParentSetting(accountTypeSetting);
        setDependentSettings(dependents);
        setIsConfirmDialogOpen(true);
      } else {
        // No dependents, just update directly
        updateAccountTypeSettingMutation.mutate({ id: accountTypeSetting.id, newValue: "FALSE" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check dependencies",
        variant: "destructive",
      });
    }
  };

  const handleConfirmTurnOffAll = () => {
    if (!parentSetting) return;

    // Create updates array: parent + all dependents
    const updates = [
      { id: parentSetting.id, settingValue: "FALSE" },
      ...dependentSettings.map(dep => ({ id: dep.id, settingValue: "FALSE" }))
    ];

    bulkUpdateMutation.mutate(updates);
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

          {isLoadingAccountTypes ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : accountTypesError ? (
            <Alert variant="destructive" data-testid="alert-account-types-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load account type settings.
              </AlertDescription>
            </Alert>
          ) : accountTypeSettings && accountTypeSettings.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Account Types - tell us who are your clients</h3>
              {accountTypeSettings.map((accountTypeSetting) => (
                <div 
                  key={accountTypeSetting.id} 
                  className={`flex items-center justify-between space-x-4 rounded-lg border p-4 ${getIndentationClass(accountTypeSetting.settingShowsInLevel)}`}
                  data-testid={`account-type-setting-${accountTypeSetting.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`toggle-${accountTypeSetting.id}`} className="text-base font-medium">
                      {accountTypeSetting.settingName}
                    </Label>
                    {accountTypeSetting.settingDescription && (
                      <p className="text-sm text-muted-foreground">
                        {accountTypeSetting.settingDescription}
                      </p>
                    )}
                  </div>
                  <Switch
                    id={`toggle-${accountTypeSetting.id}`}
                    checked={accountTypeSetting.settingValue === "TRUE"}
                    onCheckedChange={(checked) => handleAccountTypeToggleChange(accountTypeSetting, checked)}
                    disabled={updateAccountTypeSettingMutation.isPending}
                    data-testid={`switch-account-type-${accountTypeSetting.id}`}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Turn Off Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You tried to turn off <strong>{parentSetting?.settingName}</strong>. There are settings that are dependent on this and must be turned off if you want to turn off "{parentSetting?.settingName}":
            </p>
            
            <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
              {/* Parent Setting */}
              {parentSetting && (
                <div className="flex items-center justify-between space-x-4 rounded-lg border bg-background p-3">
                  <div className="flex-1">
                    <Label className="text-base font-medium">{parentSetting.settingName}</Label>
                  </div>
                  <Switch
                    checked={false}
                    disabled
                    data-testid="switch-parent-preview"
                  />
                </div>
              )}
              
              {/* Dependent Settings */}
              {dependentSettings.length > 0 && (
                <>
                  <p className="text-sm font-medium mt-4">Dependent Settings:</p>
                  {dependentSettings.map((depSetting) => (
                    <div 
                      key={depSetting.id}
                      className="flex items-center justify-between space-x-4 rounded-lg border bg-background p-3"
                    >
                      <div className="flex-1">
                        <Label className="text-base font-medium">{depSetting.settingName}</Label>
                      </div>
                      <Switch
                        checked={false}
                        disabled
                        data-testid={`switch-dependent-preview-${depSetting.id}`}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>

            <p className="text-sm font-medium">
              Do you want to turn these off, as well as the setting "{parentSetting?.settingName}"?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              data-testid="button-cancel-turnoff"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTurnOffAll}
              disabled={bulkUpdateMutation.isPending}
              data-testid="button-confirm-turnoff"
            >
              {bulkUpdateMutation.isPending ? "Turning off..." : "Okay, turn off all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
