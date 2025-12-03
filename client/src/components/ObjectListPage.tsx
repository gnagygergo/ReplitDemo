/**
 * ObjectListPage.tsx
 * 
 * PURPOSE:
 * This is a generic wrapper component that dynamically loads the appropriate
 * table/list view layout for any business object (assets, accounts, quotes, etc.).
 * 
 * RESPONSIBILITIES:
 * 1. Determines which company-specific layout to load
 * 2. Supports new clean layout format (.table_layout.tsx) with TableViewHandler
 * 3. Falls back to legacy format (.table_view_meta.tsx) for compatibility
 * 4. Passes the pre-bundled dependencies to legacy layouts
 * 
 * FILE NAMING CONVENTION (in order of priority):
 * 1. NEW: {object}.table_layout.tsx (uses TableViewHandler wrapper)
 * 2. Current: {object}.table_view_meta.tsx
 * 3. Legacy: {object}.table-view.tsx
 */

import { Suspense, lazy, ComponentType } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent, tryLoadCompanyComponent } from "@/lib/loadCompanyComponent";
import layoutDependencies from "@/lib/layoutDependencies";

const tableViewHandlers = import.meta.glob(
  "../companies/*/components/ui/TableViewHandler.tsx"
);

interface ObjectListPageProps {
  objectCode: string;
}

interface CachedComponent {
  Component: ComponentType<any>;
  isNewFormat: boolean;
}

const componentCache = new Map<string, CachedComponent>();

function getOrCreateComponent(
  companyId: string,
  objectCode: string
): CachedComponent {
  const cacheKey = `${companyId}:${objectCode}:table`;
  
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!;
  }
  
  const newLayoutName = `${objectCode}.table_layout`;
  const currentLayoutName = `${objectCode}.table_view_meta`;
  const legacyLayoutName = `${objectCode}.table-view`;
  
  const newLayoutLoader = tryLoadCompanyComponent(companyId, objectCode, newLayoutName);
  const handlerPath = `../companies/${companyId}/components/ui/TableViewHandler.tsx`;
  const handlerLoader = tableViewHandlers[handlerPath];
  
  let result: CachedComponent;
  
  if (newLayoutLoader && handlerLoader) {
    const WrappedComponent = lazy(async () => {
      const [layoutModule, handlerModule] = await Promise.all([
        newLayoutLoader(),
        handlerLoader()
      ]);
      
      const Layout = layoutModule.default;
      const { TableViewHandler } = handlerModule as { TableViewHandler: ComponentType<any> };
      
      return {
        default: function WrappedLayout(props: { objectCode: string }) {
          return <TableViewHandler objectCode={props.objectCode} Layout={Layout} />;
        },
      };
    });
    
    result = {
      Component: WrappedComponent,
      isNewFormat: true,
    };
  } else {
    result = {
      Component: loadCompanyComponent(companyId, objectCode, currentLayoutName, legacyLayoutName),
      isNewFormat: false,
    };
  }
  
  componentCache.set(cacheKey, result);
  return result;
}

export default function ObjectListPage({ objectCode }: ObjectListPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  const { Component, isNewFormat } = getOrCreateComponent(companyId, objectCode);
  
  return (
    <Suspense fallback={
      <div 
        data-testid={`loading-${objectCode}`} 
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        Loading...
      </div>
    }>
      {isNewFormat ? (
        <Component objectCode={objectCode} />
      ) : (
        <Component 
          deps={layoutDependencies} 
          objectCode={objectCode}
        />
      )}
    </Suspense>
  );
}
