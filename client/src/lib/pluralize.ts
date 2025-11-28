/**
 * pluralize.ts
 * 
 * PURPOSE:
 * Provides utility functions for converting between singular and plural
 * forms of object names. This is needed because file naming conventions
 * use singular forms (asset-detail) while object codes use plural forms (assets).
 * 
 * WHY NOT JUST REMOVE 's'?
 * Simple string slicing fails for irregular plurals:
 * - "opportunities" -> "opportunitie" (WRONG, should be "opportunity")
 * - "companies" -> "companie" (WRONG, should be "company")
 * - "categories" -> "categorie" (WRONG, should be "category")
 * 
 * This utility handles common irregular patterns.
 */

// ============================================================================
// IRREGULAR PLURALS MAP
// Maps irregular plural forms to their singular equivalents
// ============================================================================

const irregularPlurals: Record<string, string> = {
  // Common CRM objects
  opportunities: "opportunity",
  companies: "company",
  categories: "category",
  activities: "activity",
  properties: "property",
  entries: "entry",
  histories: "history",
  territories: "territory",
  deliveries: "delivery",
  inventories: "inventory",
  currencies: "currency",
  countries: "country",
  industries: "industry",
  
  // Standard irregular words
  people: "person",
  men: "man",
  women: "woman",
  children: "child",
  mice: "mouse",
  feet: "foot",
  teeth: "tooth",
  geese: "goose",
  
  // Words ending in 'es' that need special handling
  addresses: "address",
  statuses: "status",
  taxes: "tax",
  boxes: "box",
  businesses: "business",
  processes: "process",
};

// ============================================================================
// SINGULARIZATION FUNCTION
// ============================================================================

/**
 * Converts a plural word to its singular form.
 * 
 * @param plural - The plural form of a word (e.g., 'assets', 'opportunities')
 * @returns The singular form (e.g., 'asset', 'opportunity')
 * 
 * @example
 * toSingular('assets') // 'asset'
 * toSingular('opportunities') // 'opportunity'
 * toSingular('companies') // 'company'
 */
export function toSingular(plural: string): string {
  const lower = plural.toLowerCase();
  
  // Check irregular plurals first
  if (irregularPlurals[lower]) {
    return irregularPlurals[lower];
  }
  
  // Handle common patterns
  
  // Words ending in 'ies' -> 'y' (e.g., activities -> activity)
  if (lower.endsWith('ies')) {
    return lower.slice(0, -3) + 'y';
  }
  
  // Words ending in 'es' after 's', 'x', 'z', 'ch', 'sh' -> remove 'es'
  // (e.g., boxes -> box, watches -> watch)
  if (lower.endsWith('es')) {
    const stem = lower.slice(0, -2);
    if (stem.endsWith('s') || stem.endsWith('x') || stem.endsWith('z') ||
        stem.endsWith('ch') || stem.endsWith('sh')) {
      return stem;
    }
    // Otherwise just remove 's' (e.g., 'types' -> 'type')
    return lower.slice(0, -1);
  }
  
  // Default: just remove trailing 's'
  if (lower.endsWith('s')) {
    return lower.slice(0, -1);
  }
  
  // Already singular or unknown, return as-is
  return lower;
}

/**
 * Converts a singular word to its plural form.
 * 
 * @param singular - The singular form of a word (e.g., 'asset', 'opportunity')
 * @returns The plural form (e.g., 'assets', 'opportunities')
 * 
 * @example
 * toPlural('asset') // 'assets'
 * toPlural('opportunity') // 'opportunities'
 * toPlural('company') // 'companies'
 */
export function toPlural(singular: string): string {
  const lower = singular.toLowerCase();
  
  // Find in irregulars (reverse lookup)
  for (const [plural, sing] of Object.entries(irregularPlurals)) {
    if (sing === lower) {
      return plural;
    }
  }
  
  // Words ending in 'y' with consonant before -> 'ies'
  if (lower.endsWith('y')) {
    const beforeY = lower.charAt(lower.length - 2);
    if (!'aeiou'.includes(beforeY)) {
      return lower.slice(0, -1) + 'ies';
    }
  }
  
  // Words ending in 's', 'x', 'z', 'ch', 'sh' -> add 'es'
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') ||
      lower.endsWith('ch') || lower.endsWith('sh')) {
    return lower + 'es';
  }
  
  // Default: add 's'
  return lower + 's';
}

/**
 * Capitalizes the first letter of a string.
 * 
 * @param str - The string to capitalize
 * @returns The string with first letter capitalized
 * 
 * @example
 * capitalize('asset') // 'Asset'
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Gets the human-readable singular label for an object code.
 * 
 * @param objectCode - The object code (plural, e.g., 'assets')
 * @returns The singular label with first letter capitalized (e.g., 'Asset')
 * 
 * @example
 * getSingularLabel('assets') // 'Asset'
 * getSingularLabel('opportunities') // 'Opportunity'
 */
export function getSingularLabel(objectCode: string): string {
  return capitalize(toSingular(objectCode));
}

/**
 * Gets the human-readable plural label for an object code.
 * 
 * @param objectCode - The object code (e.g., 'assets')
 * @returns The plural label with first letter capitalized (e.g., 'Assets')
 * 
 * @example
 * getPluralLabel('assets') // 'Assets'
 */
export function getPluralLabel(objectCode: string): string {
  return capitalize(objectCode);
}
