/**
 * ObjectDetailPage.tsx
 * 
 * PURPOSE:
 * This is a generic wrapper component that dynamically loads the appropriate
 * detail view layout for any business object (assets, accounts, quotes, etc.).
 * 
 * RESPONSIBILITIES:
 * 1. Determines which company-specific layout to load
 * 2. Passes the pre-bundled dependencies to the layout
 * 3. Provides the objectCode and id to the layout
 * 
 * FILE NAMING CONVENTION:
 * Looks for: {singular-object}-detail.detail_view_meta.tsx
 * Falls back to: {singular-object}-detail.detail-view.tsx (legacy)
 * Example: asset-detail.detail_view_meta.tsx for objectCode='assets'
 */

import { Suspense, useRef } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent } from "@/lib/loadCompanyComponent";
import layoutDependencies from "@/lib/layoutDependencies";
import { toSingular } from "@/lib/pluralize";

interface ObjectDetailPageProps {
  objectCode: string;
}

export default function ObjectDetailPage({ objectCode }: ObjectDetailPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  // Extract the ID from the route (e.g., /assets/:id -> id)
  const [, params] = useRoute(`/${objectCode}/:id`);
  const id = params?.id;
  
  // Convert plural objectCode to singular for detail view file naming
  // Uses proper singularization that handles irregular plurals like:
  // - 'assets' -> 'asset'
  // - 'opportunities' -> 'opportunity' (not 'opportunitie')
  // - 'companies' -> 'company' (not 'companie')
  const singularObjectCode = toSingular(objectCode);
  
  // Cache the loaded component to prevent re-loading on every render
  const componentRef = useRef<ReturnType<typeof loadCompanyComponent> | null>(null);
  const prevCompanyIdRef = useRef<string>("0_default");
  const prevObjectCodeRef = useRef<string>("");
  
  if (!componentRef.current || prevCompanyIdRef.current !== companyId || prevObjectCodeRef.current !== objectCode) {
    // Try new naming convention first, then fall back to legacy
    // New: asset-detail.detail_view_meta
    // Legacy: asset-detail.detail-view
    componentRef.current = loadCompanyComponent(
      companyId, 
      objectCode, 
      `${singularObjectCode}-detail.detail_view_meta`,
      `${singularObjectCode}-detail.detail-view` // fallback
    );
    prevCompanyIdRef.current = companyId;
    prevObjectCodeRef.current = objectCode;
  }
  
  const Component = componentRef.current;
  
  return (
    <Suspense fallback={
      <div 
        data-testid={`loading-${singularObjectCode}-detail`} 
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        Loading...
      </div>
    }>
      {/* Pass dependencies bundle, objectCode, and id to the layout */}
      <Component 
        deps={layoutDependencies} 
        objectCode={objectCode}
        id={id}
      />
    </Suspense>
  );
}
