import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

type CompanySetting = {
  id: string;
  companySettingsMasterId: string;
  settingCode: string | null;
  settingName: string | null;
  settingValue: string | null;
  companyId: string | null;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  lastUpdatedBy: string | null;
  settingFunctionalDomain: string | null;
  settingDescription: string | null;
  settingValues: string | null;
  defaultValue: string | null;
};

export default function AccountManagementModels() {
  const functionalDomain = "Account Management";
  
  const { data: settings, isLoading, error } = useQuery<CompanySetting[]>({
    queryKey: ["/api/business-objects/company-settings", functionalDomain],
    queryFn: async () => {
      const encodedDomain = encodeURIComponent(functionalDomain);
      const response = await fetch(`/api/business-objects/company-settings/${encodedDomain}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch company settings");
      }
      return response.json();
    },
  });

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
          <CardTitle>Account Management Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : error ? (
            <Alert variant="destructive" data-testid="alert-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load settings. Please try again.
              </AlertDescription>
            </Alert>
          ) : settings && settings.length > 0 ? (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div
                  key={setting.id}
                  className="border rounded-lg p-4"
                  data-testid={`setting-item-${setting.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg" data-testid={`text-setting-name-${setting.id}`}>
                        {setting.settingName}
                      </h3>
                      {setting.settingDescription && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {setting.settingDescription}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium">Current Value:</span>
                        <span
                          className="text-sm px-2 py-1 bg-primary/10 text-primary rounded"
                          data-testid={`text-setting-value-${setting.id}`}
                        >
                          {setting.settingValue}
                        </span>
                      </div>
                      {setting.settingValues && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Possible Values:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {setting.settingValues}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground" data-testid="text-no-settings">
              No account management settings configured for your company.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
