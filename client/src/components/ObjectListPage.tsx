/**
 * ObjectListPage.tsx
 * 
 * PURPOSE:
 * This is a generic wrapper component that dynamically loads the appropriate
 * table/list view layout for any business object (assets, accounts, quotes, etc.).
 * 
 * RESPONSIBILITIES:
 * 1. Determines which company-specific layout to load
 * 2. Passes the pre-bundled dependencies to the layout
 * 3. Provides the objectCode to the layout
 * 
 * FILE NAMING CONVENTION:
 * Looks for: {object}.table_view_meta.tsx
 * Falls back to: {object}.table-view.tsx (legacy)
 * Example: assets.table_view_meta.tsx for objectCode='assets'
 */

import { Suspense, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";
import layoutDependencies from "@/lib/layoutDependencies";

interface ObjectListPageProps {
  objectCode: string;
}

export default function ObjectListPage({ objectCode }: ObjectListPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  // Cache the loaded component to prevent re-loading on every render
  const componentRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  const prevObjectCodeRef = useRef<string>("");
  
  if (!componentRef.current || prevCompanyIdRef.current !== companyId || prevObjectCodeRef.current !== objectCode) {
    // Try new naming convention first, then fall back to legacy
    // New: assets.table_view_meta
    // Legacy: assets.table-view
    componentRef.current = loadCompanyComponent(
      companyId, 
      objectCode, 
      `${objectCode}.table_view_meta`,
      `${objectCode}.table-view` // fallback
    );
    prevCompanyIdRef.current = companyId;
    prevObjectCodeRef.current = objectCode;
  }
  
  const Component = componentRef.current;
  
  return (
    <Suspense fallback={
      <div 
        data-testid={`loading-${objectCode}`} 
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        Loading...
      </div>
    }>
      {/* Pass dependencies bundle and objectCode to the layout */}
      <Component 
        deps={layoutDependencies} 
        objectCode={objectCode}
      />
    </Suspense>
  );
}
