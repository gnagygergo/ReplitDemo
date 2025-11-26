import { useQuery } from "@tanstack/react-query";

export interface FieldTypeInfo {
  apiCode: string;
  type: string;
  subtype?: string;
  fieldType?: string;
  isMultiSelect?: boolean;
}

export type FieldTypeMap = Record<string, FieldTypeInfo>;

interface UseObjectFieldTypesOptions {
  objectCode: string;
  enabled?: boolean;
}

export function useObjectFieldTypes({
  objectCode,
  enabled = true,
}: UseObjectFieldTypesOptions) {
  return useQuery<FieldTypeMap>({
    queryKey: ["/api/object-fields", objectCode, "all"],
    queryFn: async () => {
      if (!objectCode) return {};
      
      const response = await fetch(`/api/object-fields/${objectCode}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return {};
        }
        throw new Error(`Failed to fetch field types: ${response.statusText}`);
      }
      
      const fields: any[] = await response.json();
      
      const fieldTypeMap: FieldTypeMap = {};
      for (const field of fields) {
        const isMultiSelect = field.subtype === "multiSelect" || field.fieldType === "multiSelect";
        
        fieldTypeMap[field.apiCode] = {
          apiCode: field.apiCode,
          type: field.type,
          subtype: field.subtype,
          fieldType: field.fieldType,
          isMultiSelect,
        };
      }
      
      return fieldTypeMap;
    },
    enabled: enabled && !!objectCode,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
