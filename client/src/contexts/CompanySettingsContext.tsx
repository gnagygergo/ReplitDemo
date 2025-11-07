import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

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

interface CompanySettingsContextType {
  settings: CompanySettingWithMaster[];
  isLoading: boolean;
  isSettingEnabled: (settingCode: string) => boolean;
  getSetting: (settingCode: string) => CompanySettingWithMaster | undefined;
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

interface CompanySettingsProviderProps {
  children: ReactNode;
}

export function CompanySettingsProvider({ children }: CompanySettingsProviderProps) {
  const { data: settings = [], isLoading } = useQuery<CompanySettingWithMaster[]>({
    queryKey: ["/api/company-settings"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const isSettingEnabled = (settingCode: string): boolean => {
    const setting = settings.find((s) => s.settingCode === settingCode);
    return setting?.settingValue?.toLowerCase() === "true";
  };

  const getSetting = (settingCode: string): CompanySettingWithMaster | undefined => {
    return settings.find((s) => s.settingCode === settingCode);
  };

  const value: CompanySettingsContextType = {
    settings,
    isLoading,
    isSettingEnabled,
    getSetting,
  };

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings(): CompanySettingsContextType {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error("useCompanySettings must be used within a CompanySettingsProvider");
  }
  return context;
}
