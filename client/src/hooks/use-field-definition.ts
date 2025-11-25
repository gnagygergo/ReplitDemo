import { useQuery } from "@tanstack/react-query";

export interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  subtype?: string;
  helpText?: string;
  placeHolder?: string;
  maxLength?: string;
  copyAble?: boolean;
  truncate?: boolean;
  visibleLinesInView?: string;
  visibleLinesInEdit?: string;
  testIdEdit?: string;
  testIdView?: string;
  testIdTable?: string;
  decimalPlaces?: string;
  format?: string;
  percentageDisplay?: boolean;
  fieldType?: string;
  metadataSource?: string;
  sourcePath?: string;
  sourceType?: "universalMetadata" | "globalMetadata";
  sortingDirection?: string;
  allowSearch?: boolean;
}

interface UseFieldDefinitionOptions {
  objectCode?: string;
  fieldCode?: string;
  enabled?: boolean;
}

export function useFieldDefinition({
  objectCode,
  fieldCode,
  enabled = true,
}: UseFieldDefinitionOptions) {
  return useQuery<FieldDefinition | null>({
    queryKey: ["/api/object-fields", objectCode, fieldCode],
    queryFn: async () => {
      if (!objectCode || !fieldCode) return null;
      
      const response = await fetch(`/api/object-fields/${objectCode}/${fieldCode}`, {
        credentials: "include",
      });
      
      // If field definition doesn't exist, return null (not an error)
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch field definition: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: enabled && !!objectCode && !!fieldCode,
    staleTime: 5 * 60 * 1000, // 5 minutes - field definitions don't change often
    retry: false, // Don't retry if field definition doesn't exist
  });
}
