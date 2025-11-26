import type { FieldTypeMap, FieldTypeInfo } from "@/hooks/use-object-field-types";

type FieldValue = string | number | boolean | Date | string[] | null | undefined;

function getDefaultValue(fieldInfo: FieldTypeInfo): FieldValue {
  if (fieldInfo.type === "DropDownListField" && fieldInfo.isMultiSelect) {
    return [];
  }
  
  switch (fieldInfo.type) {
    case "TextField":
    case "LookupField":
    case "AddressField":
      return "";
    case "DropDownListField":
      return "";
    case "NumberField":
      return null;
    case "DateTimeField":
      return null;
    case "CheckboxField":
      return false;
    default:
      return "";
  }
}

export function buildDefaultFormValues(
  fieldTypeMap: FieldTypeMap,
  additionalDefaults: Record<string, FieldValue> = {}
): Record<string, FieldValue> {
  const defaults: Record<string, FieldValue> = {};

  for (const [fieldName, fieldInfo] of Object.entries(fieldTypeMap)) {
    defaults[fieldName] = getDefaultValue(fieldInfo);
  }

  return { ...defaults, ...additionalDefaults };
}

export function transformRecordToFormValues(
  record: Record<string, any> | null | undefined,
  fieldTypeMap: FieldTypeMap,
  additionalDefaults: Record<string, FieldValue> = {}
): Record<string, FieldValue> {
  if (!record) {
    return buildDefaultFormValues(fieldTypeMap, additionalDefaults);
  }

  const formValues: Record<string, FieldValue> = {};

  for (const [fieldName, fieldInfo] of Object.entries(fieldTypeMap)) {
    const rawValue = record[fieldName];
    formValues[fieldName] = transformFieldValue(rawValue, fieldInfo);
  }

  for (const [key, value] of Object.entries(record)) {
    if (!(key in formValues)) {
      formValues[key] = transformFieldValueByInference(value);
    }
  }

  return { ...formValues, ...additionalDefaults };
}

function transformFieldValue(value: any, fieldInfo: FieldTypeInfo): FieldValue {
  if (value === null || value === undefined) {
    return getDefaultValue(fieldInfo);
  }

  switch (fieldInfo.type) {
    case "NumberField":
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
      return typeof value === "number" ? value : null;

    case "DateTimeField":
      return value || null;

    case "TextField":
    case "LookupField":
      return value || "";
      
    case "DropDownListField":
      if (fieldInfo.isMultiSelect) {
        if (Array.isArray(value)) return value;
        if (typeof value === "string" && value) return [value];
        return [];
      }
      return value || "";

    case "CheckboxField":
      return Boolean(value);

    default:
      return value ?? "";
  }
}

function transformFieldValueByInference(value: any): FieldValue {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string" && value !== "" && !isNaN(Number(value))) {
    return parseFloat(value);
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value;
  }

  if (Array.isArray(value)) {
    return value;
  }

  return value ?? "";
}
