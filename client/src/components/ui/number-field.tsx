import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl } from "@/components/ui/form";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useCultureFormat } from "@/hooks/useCultureFormat";

export interface NumberFieldProps {
  mode: "edit" | "view" | "table";
  value: string | number | null;
  onChange?: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  step?: number;
  format?: "number" | "percentage";
  decimals?: number;
  objectCode?: string;
  fieldCode?: string;
}

export function NumberField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  testId,
  className,
  step,
  format,
  decimals,
  objectCode,
  fieldCode,
}: NumberFieldProps) {
  const [inputValue, setInputValue] = useState<string>("");

  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  const { 
    formatNumber, 
    formatForEdit, 
    normalizeForStorage, 
    constrainNumberInput,
    decimalSeparator 
  } = useCultureFormat();

  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "";
  const mergedStep = step ?? 1;
  const mergedFormat = format ?? fieldDef?.format ?? "number";
  const mergedDecimals = decimals ?? (fieldDef?.decimalPlaces !== undefined ? parseInt(fieldDef.decimalPlaces) : 2);
  
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `text-${fieldCode}` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  useEffect(() => {
    if (mode === "edit") {
      if (value === null || value === undefined) {
        setInputValue("");
      } else {
        const formatted = formatForEdit(value, mergedDecimals);
        setInputValue(formatted);
      }
    }
  }, [value, mode, mergedDecimals, formatForEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    const constrainedValue = constrainNumberInput(rawValue, mergedDecimals);
    
    setInputValue(constrainedValue);
    
    if (constrainedValue === "") {
      onChange?.(null);
      return;
    }
    
    const normalizedValue = normalizeForStorage(constrainedValue);
    const numValue = Number(normalizedValue);
    
    if (isFinite(numValue)) {
      onChange?.(normalizedValue);
    }
  };

  if (mode === "edit") {
    return (
      <>
        {mergedLabel && (
          <FormLabel className="text-muted-foreground">
            {mergedLabel}
          </FormLabel>
        )}
        <FormControl>
          <Input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            placeholder={mergedPlaceholder}
            className={className || defaultEditClassName}
            data-testid={mergedTestId}
          />
        </FormControl>
      </>
    );
  }

  const formattedValue = formatNumber(value, {
    decimalPlaces: mergedDecimals,
    format: mergedFormat as "number" | "percentage",
  });

  if (mode === "view") {
    return (
      <>
        {mergedLabel && (
          <FormLabel className="text-muted-foreground">
            {mergedLabel}
          </FormLabel>
        )}
        <div className={className || defaultViewClassName} data-testid={mergedTestId}>
          {formattedValue}
        </div>
      </>
    );
  }

  if (mode === "table") {
    return (
      <span className={className || defaultTableClassName} data-testid={mergedTestId}>
        {formattedValue}
      </span>
    );
  }

  return null;
}
