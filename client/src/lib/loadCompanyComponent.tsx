/**
 * loadCompanyComponent.tsx
 * 
 * PURPOSE:
 * This utility dynamically loads company-specific layout components at runtime.
 * It allows different companies to have customized layouts while sharing the
 * same core application code.
 * 
 * HOW IT WORKS:
 * 1. Uses Vite's import.meta.glob to discover all available layout files
 * 2. Attempts to load the company-specific version first
 * 3. Falls back to default version if company-specific doesn't exist
 * 4. Supports fallback component names for legacy file naming
 * 
 * FILE NAMING PATTERNS:
 * - New convention: {object}.table_view_meta.tsx, {object}-detail.detail_view_meta.tsx
 * - Legacy convention: {object}.table-view.tsx, {object}-detail.detail-view.tsx
 */

import { lazy, ComponentType } from "react";

// Use import.meta.glob to tell Vite about all possible component paths
// This creates a map of all company-specific layout components
// Note: Vite returns keys relative to this file's location (e.g., "../companies/...")
const componentModules = import.meta.glob(
  "../companies/*/objects/*/layouts/*.tsx"
);

/**
 * Tries to get a component loader without throwing an error if not found.
 * Useful for checking if a new-style layout exists before falling back to legacy.
 * 
 * @returns The loader function if found, undefined otherwise
 */
export function tryLoadCompanyComponent(
  companyId: string | undefined,
  objectName: string,
  componentName: string
): (() => Promise<any>) | undefined {
  // Try company-specific path first
  const companyPath = `../companies/${companyId}/objects/${objectName}/layouts/${componentName}.tsx`;
  const companyLoader = componentModules[companyPath];
  
  if (companyLoader) {
    return companyLoader;
  }
  
  // Fall back to default company
  const defaultPath = `../companies/0_default/objects/${objectName}/layouts/${componentName}.tsx`;
  return componentModules[defaultPath];
}

/**
 * Dynamically loads a company-specific component based on the logged-in user's company context.
 * 
 * @param companyId - The ID of the company (from user's company context)
 * @param objectName - The business object name (e.g., "assets", "accounts", "quotes")
 * @param componentName - The component filename without extension (e.g., "assets.table_view_meta")
 * @param fallbackComponentName - Optional fallback filename for legacy naming (e.g., "assets.table-view")
 * @returns A lazily-loaded React component
 * 
 * @example
 * // New naming with fallback to legacy
 * const Assets = loadCompanyComponent(companyId, "assets", "assets.table_view_meta", "assets.table-view");
 * const AssetDetail = loadCompanyComponent(companyId, "assets", "asset-detail.detail_view_meta", "asset-detail.detail-view");
 */
export function loadCompanyComponent<T extends ComponentType<any>>(
  companyId: string | undefined,
  objectName: string,
  componentName: string,
  fallbackComponentName?: string
): ComponentType<any> {
  
  /**
   * Helper function to try loading a component from a specific path.
   * Returns the loader function if found, undefined otherwise.
   */
  const tryGetLoader = (name: string) => {
    // Try company-specific path first
    const companyPath = `../companies/${companyId}/objects/${objectName}/layouts/${name}.tsx`;
    const companyLoader = componentModules[companyPath];
    
    if (companyLoader) {
      return companyLoader;
    }
    
    // Fall back to default company
    const defaultPath = `../companies/0_default/objects/${objectName}/layouts/${name}.tsx`;
    return componentModules[defaultPath];
  };
  
  // Try primary component name first
  let moduleLoader = tryGetLoader(componentName);
  
  // If not found and fallback provided, try fallback name
  if (!moduleLoader && fallbackComponentName) {
    moduleLoader = tryGetLoader(fallbackComponentName);
  }
  
  if (!moduleLoader) {
    // Build helpful error message with all paths we tried
    const triedPaths = [
      `../companies/${companyId}/objects/${objectName}/layouts/${componentName}.tsx`,
      `../companies/0_default/objects/${objectName}/layouts/${componentName}.tsx`,
    ];
    
    if (fallbackComponentName) {
      triedPaths.push(
        `../companies/${companyId}/objects/${objectName}/layouts/${fallbackComponentName}.tsx`,
        `../companies/0_default/objects/${objectName}/layouts/${fallbackComponentName}.tsx`
      );
    }
    
    throw new Error(
      `Component not found for object "${objectName}". ` +
      `Tried paths: ${triedPaths.join(", ")}. ` +
      `Available keys: ${Object.keys(componentModules).slice(0, 10).join(", ")}...`
    );
  }

  // Load the component lazily
  return lazy(() =>
    moduleLoader().then((module: any) => ({
      default: module.default,
    }))
  ) as ComponentType<any>;
}
