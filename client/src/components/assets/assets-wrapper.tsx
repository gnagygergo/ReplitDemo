import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Company } from "@shared/schema";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";

/**
 * Wrapper component that dynamically loads the company-specific Assets list component.
 * This component fetches the current user's company context and loads the appropriate
 * company-specific React component from companies/[companyId]/objects/assets/layouts/assets.tsx
 */
export default function AssetsWrapper() {
  // Fetch current user's company data
  const { data: companyData, isLoading: isLoadingCompany } = useQuery<Company>({
    queryKey: ["/api/auth/my-company"],
  });

  if (isLoadingCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!companyData?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-destructive">
          Error: Company context not found. Please log in again.
        </div>
      </div>
    );
  }

  // Dynamically load the company-specific Assets component
  const CompanyAssets = loadCompanyComponent(
    companyData.id,
    "assets",
    "assets"
  );

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse">Loading assets...</div>
        </div>
      }
    >
      <CompanyAssets />
    </Suspense>
  );
}
