import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Currency } from "@shared/schema";

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
  specialValueSet: string | null;
  cantBeTrueIfTheFollowingIsFalse: string | null;
  settingOrderWithinFunctionality: number | null;
  settingShowsInLevel: number | null;
  settingOnceEnabledCannotBeDisabled: boolean | null;
};

interface SetupToggleListerProps {
  settingPrefix: string;
  title?: string;
}

export default function SetupToggleLister({ settingPrefix, title = "Settings" }: SetupToggleListerProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLockedSettingConfirmOpen, setIsLockedSettingConfirmOpen] = useState(false);
  const [pendingLockedSetting, setPendingLockedSetting] = useState<CompanySettingWithMaster | null>(null);
  const [parentSetting, setParentSetting] = useState<CompanySettingWithMaster | null>(null);
  const [dependentSettings, setDependentSettings] = useState<CompanySettingWithMaster[]>([]);
  const [highlightedSettingId, setHighlightedSettingId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Auto-clear highlight after 5 seconds
  useEffect(() => {
    if (highlightedSettingId) {
      const timer = setTimeout(() => {
        setHighlightedSettingId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedSettingId]);
  
  // Helper function to get indentation class based on settingShowsInLevel
  const getIndentationClass = (level: number | null | undefined): string => {
    if (!level || level === 1) return "ml-0";
    if (level === 2) return "ml-8";
    if (level === 3) return "ml-16";
    return "ml-0"; // Default for any other value
  };

  // Helper function to check if settingValues only allows FALSE
  const isOnlyFalseAllowed = (settingValues: string | null): boolean => {
    if (!settingValues) return false;
    // Remove whitespace and convert to uppercase for comparison
    const normalized = settingValues.trim().toUpperCase();
    return normalized === "FALSE";
  };

  const { data: settings, isLoading, error } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/business-objects/company-settings/by-prefix", settingPrefix],
    queryFn: async () => {
      const response = await fetch(`/api/business-objects/company-settings/by-prefix/${settingPrefix}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to fetch settings");
      }
      return response.json();
    },
  });

  // Fetch currencies for dropdown
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ["/api/currencies"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, newValue }: { id: string; newValue: string }) => {
      return apiRequest("PATCH", `/api/business-objects/company-settings/${id}`, { settingValue: newValue });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-prefix", settingPrefix] });
      // Clear any highlight when successful
      setHighlightedSettingId(null);
      toast({
        title: "Success",
        description: "Setting updated",
      });
    },
    onError: (error: any) => {
      // Check if this is a dependency error
      const isDependencyError = error.message && error.message.includes("To turn this setting on");
      
      if (isDependencyError && settings) {
        // Parse parent setting name from error message
        // Format: "To turn this setting on, please turn the following setting on first: [Setting Name] "
        const match = error.message.match(/first:\s*(.+?)(?:\s*$)/);
        if (match && match[1]) {
          const parentSettingName = match[1].trim();
          
          // Find the parent setting in the settings array
          const parentSetting = settings.find(s => s.settingName === parentSettingName);
          if (parentSetting) {
            setHighlightedSettingId(parentSetting.id);
          }
        }
        
        // Show warning toast instead of error
        toast({
          title: "Parent Setting Required",
          description: error.message,
          className: "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100",
        });
      } else {
        // Regular error
        toast({
          title: "Error",
          description: error.message || "Failed to update setting",
          variant: "destructive",
        });
      }
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; settingValue: string }>) => {
      const response = await apiRequest("POST", "/api/business-objects/company-settings/bulk-update", { updates });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-objects/company-settings/by-prefix", settingPrefix] });
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

  // Auto-correct FALSE-only settings that have TRUE values
  useEffect(() => {
    if (!settings) return;
    
    const settingsToCorrect = settings.filter(setting => 
      isOnlyFalseAllowed(setting.settingValues) && setting.settingValue === "TRUE"
    );

    if (settingsToCorrect.length > 0) {
      // Correct each setting to FALSE
      settingsToCorrect.forEach(setting => {
        updateSettingMutation.mutate({ id: setting.id, newValue: "FALSE" });
      });
    }
  }, [settings, updateSettingMutation]);

  const handleToggleChange = async (setting: CompanySettingWithMaster, checked: boolean) => {
    // If turning ON
    if (checked) {
      // Check if this is a locked setting (once enabled cannot be disabled)
      if (setting.settingOnceEnabledCannotBeDisabled === true) {
        // Show confirmation dialog
        setPendingLockedSetting(setting);
        setIsLockedSettingConfirmOpen(true);
        return;
      }
      // Normal setting, update directly
      updateSettingMutation.mutate({ id: setting.id, newValue: "TRUE" });
      return;
    }

    // If turning OFF, first check if this is a locked setting
    if (setting.settingOnceEnabledCannotBeDisabled === true && setting.settingValue === "TRUE") {
      // Show warning - cannot turn off locked setting
      toast({
        title: "Cannot Turn Off",
        description: "This setting can't be turned off.",
        className: "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100",
      });
      return;
    }

    // If turning OFF, check for dependent settings
    try {
      const response = await fetch(`/api/business-objects/company-settings/${setting.id}/dependents`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to check dependencies");
      }
      
      const dependents: CompanySettingWithMaster[] = await response.json();
      
      if (dependents.length > 0) {
        // Show confirmation dialog with dependent settings
        setParentSetting(setting);
        setDependentSettings(dependents);
        setIsConfirmDialogOpen(true);
      } else {
        // No dependents, just update directly
        updateSettingMutation.mutate({ id: setting.id, newValue: "FALSE" });
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

  const handleConfirmLockedSettingEnable = () => {
    if (!pendingLockedSetting) return;
    updateSettingMutation.mutate({ id: pendingLockedSetting.id, newValue: "TRUE" });
    setIsLockedSettingConfirmOpen(false);
    setPendingLockedSetting(null);
  };

  const handleCurrencyChange = (setting: CompanySettingWithMaster, currencyCode: string) => {
    updateSettingMutation.mutate({ id: setting.id, newValue: currencyCode });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" data-testid="alert-settings-error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load settings.
        </AlertDescription>
      </Alert>
    );
  }

  if (!settings || settings.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground" data-testid="heading-toggle-list">{title}</h3>
        {settings.map((setting) => {
          const isHighlighted = setting.id === highlightedSettingId;
          const isLocked = setting.settingOnceEnabledCannotBeDisabled === true && setting.settingValue === "TRUE";
          const isFalseOnly = isOnlyFalseAllowed(setting.settingValues);
          const isCurrencyList = setting.specialValueSet === "Currency list";
          const isCurrencyLocked = setting.settingOnceEnabledCannotBeDisabled === true && setting.settingValue !== null && setting.settingValue !== "";
          
          return (
            <div 
              key={setting.id} 
              className={`flex items-center justify-between space-x-4 rounded-lg border p-4 transition-all ${getIndentationClass(setting.settingShowsInLevel)} ${
                isHighlighted 
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 shadow-lg shadow-amber-500/20 animate-pulse" 
                  : ""
              }`}
              data-testid={`setting-${setting.id}`}
            >
              <div className="flex-1 space-y-1">
                <Label htmlFor={isCurrencyList ? `currency-${setting.id}` : `toggle-${setting.id}`} className="text-base font-medium">
                  {setting.settingName}
                </Label>
                {setting.settingDescription && (
                  <p className="text-sm text-muted-foreground">
                    {setting.settingDescription}
                  </p>
                )}
              </div>
              
              {isCurrencyList ? (
                <Select
                  value={setting.settingValue || undefined}
                  onValueChange={(value) => handleCurrencyChange(setting, value)}
                  disabled={updateSettingMutation.isPending || isCurrencyLocked}
                >
                  <SelectTrigger className="w-[300px]" id={`currency-${setting.id}`} data-testid={`select-currency-${setting.id}`}>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem 
                        key={currency.currencyISOCode} 
                        value={currency.currencyISOCode}
                        data-testid={`option-currency-${currency.currencyISOCode}`}
                      >
                        {currency.currencyISOCode} - {currency.currencyName} - {currency.currencyLocaleName || currency.currencyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Switch
                  id={`toggle-${setting.id}`}
                  checked={isFalseOnly ? false : setting.settingValue === "TRUE"}
                  onCheckedChange={(checked) => handleToggleChange(setting, checked)}
                  disabled={updateSettingMutation.isPending || isLocked || isFalseOnly}
                  data-testid={`switch-${setting.id}`}
                />
              )}
            </div>
          );
        })}
      </div>

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

      <Dialog open={isLockedSettingConfirmOpen} onOpenChange={setIsLockedSettingConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Permanent Setting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you turn this setting on, it <strong>cannot be turned off anymore</strong>.
            </p>
            <p className="text-sm font-medium">
              Do you want to turn it on?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLockedSettingConfirmOpen(false);
                setPendingLockedSetting(null);
              }}
              data-testid="button-cancel-locked-setting"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLockedSettingEnable}
              disabled={updateSettingMutation.isPending}
              data-testid="button-confirm-locked-setting"
            >
              {updateSettingMutation.isPending ? "Turning on..." : "Yes, turn on"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
