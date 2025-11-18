import { lazy, ComponentType } from "react";

// Use import.meta.glob to tell Vite about all possible component paths
// This creates a map of all company-specific layout components
// Note: Vite returns keys relative to this file's location (e.g., "../companies/...")
const componentModules = import.meta.glob(
  "../companies/*/objects/*/layouts/*.tsx"
);

/**
 * Dynamically loads a company-specific component based on the logged-in user's company context.
 * 
 * @param companyId - The ID of the company (from user's company context)
 * @param objectName - The business object name (e.g., "assets", "accounts", "quotes")
 * @param componentName - The component filename without extension (e.g., "assets", "asset-detail")
 * @returns A lazily-loaded React component
 * 
 * @example
 * const Assets = loadCompanyComponent(companyId, "assets", "assets");
 * const AssetDetail = loadCompanyComponent(companyId, "assets", "asset-detail");
 */
export function loadCompanyComponent<T extends ComponentType<any>>(
  companyId: string | undefined,
  objectName: string,
  componentName: string
): ComponentType<any> {
  // Construct the relative path (matching the glob pattern above)
  const componentPath = `../companies/${companyId}/objects/${objectName}/layouts/${componentName}.tsx`;

  // Check if the component exists for this company
  const moduleLoader = componentModules[componentPath];

  if (!moduleLoader) {
    // If component doesn't exist for this company, fall back to default template
    const defaultPath = `../companies/0_default/objects/${objectName}/layouts/${componentName}.tsx`;
    const defaultLoader = componentModules[defaultPath];

    if (!defaultLoader) {
      throw new Error(
        `Component not found: ${componentName} for object ${objectName}. ` +
        `Checked paths: ${componentPath} and ${defaultPath}. ` +
        `Available keys: ${Object.keys(componentModules).join(", ")}`
      );
    }

    return lazy(() =>
      defaultLoader().then((module: any) => ({
        default: module.default,
      }))
    ) as ComponentType<any>;
  }

  // Load the company-specific component
  return lazy(() =>
    moduleLoader().then((module: any) => ({
      default: module.default,
    }))
  ) as ComponentType<any>;
}
