/**
 * ObjectDetailPage.tsx
 * 
 * PURPOSE:
 * This is a generic wrapper component that dynamically loads the appropriate
 * detail view layout for any business object (assets, accounts, quotes, etc.).
 * 
 * RESPONSIBILITIES:
 * 1. Determines which company-specific layout to load
 * 2. Supports new clean layout format (.layout.tsx) with DetailViewHandler
 * 3. Falls back to legacy format (.detail_view_meta.tsx) for compatibility
 * 4. Passes the pre-bundled dependencies to legacy layouts
 * 
 * FILE NAMING CONVENTION (in order of priority):
 * 1. NEW: {singular-object}-detail.layout.tsx (uses DetailViewHandler wrapper)
 * 2. Current: {singular-object}-detail.detail_view_meta.tsx
 * 3. Legacy: {singular-object}-detail.detail-view.tsx
 */

import { Suspense, useRef, lazy, ComponentType } from "react";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { loadCompanyComponent, tryLoadCompanyComponent } from "@/lib/loadCompanyComponent";
import layoutDependencies from "@/lib/layoutDependencies";
import { toSingular } from "@/lib/pluralize";

const detailViewHandlers = import.meta.glob(
  "../companies/*/components/ui/DetailViewHandler.tsx"
);

interface ObjectDetailPageProps {
  objectCode: string;
}

interface CachedComponent {
  Component: ComponentType<any>;
  isNewFormat: boolean;
}

const componentCache = new Map<string, CachedComponent>();

function getOrCreateComponent(
  companyId: string,
  objectCode: string,
  singularObjectCode: string
): CachedComponent {
  const cacheKey = `${companyId}:${objectCode}`;
  
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey)!;
  }
  
  const newLayoutName = `${singularObjectCode}-detail.layout`;
  const currentLayoutName = `${singularObjectCode}-detail.detail_view_meta`;
  const legacyLayoutName = `${singularObjectCode}-detail.detail-view`;
  
  const newLayoutLoader = tryLoadCompanyComponent(companyId, objectCode, newLayoutName);
  const handlerPath = `../companies/${companyId}/components/ui/DetailViewHandler.tsx`;
  const handlerLoader = detailViewHandlers[handlerPath];
  
  let result: CachedComponent;
  
  if (newLayoutLoader && handlerLoader) {
    const WrappedComponent = lazy(async () => {
      const [layoutModule, handlerModule] = await Promise.all([
        newLayoutLoader(),
        handlerLoader()
      ]);
      
      const Layout = layoutModule.default;
      const { DetailViewHandler } = handlerModule as { DetailViewHandler: ComponentType<any> };
      
      return {
        default: function WrappedLayout(props: { objectCode: string; id: string }) {
          return <DetailViewHandler objectCode={props.objectCode} id={props.id} Layout={Layout} />;
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

export default function ObjectDetailPage({ objectCode }: ObjectDetailPageProps) {
  const { user } = useAuth();
  const companyId = user?.companyId?.trim() || "0_default";
  
  const [, params] = useRoute(`/${objectCode}/:id`);
  const id = params?.id;
  
  const singularObjectCode = toSingular(objectCode);
  
  const { Component, isNewFormat } = getOrCreateComponent(companyId, objectCode, singularObjectCode);
  
  return (
    <Suspense fallback={
      <div 
        data-testid={`loading-${singularObjectCode}-detail`} 
        className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        Loading...
      </div>
    }>
      {isNewFormat ? (
        <Component objectCode={objectCode} id={id} />
      ) : (
        <Component 
          deps={layoutDependencies} 
          objectCode={objectCode}
          id={id}
        />
      )}
    </Suspense>
  );
}
