import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl } from "@/components/ui/form";
import { useFieldDefinition } from "@/hooks/use-field-definition";

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
  // Internal state to track the string representation during editing
  // This allows intermediate states like "-", "1.", or "-5." while typing
  const [inputValue, setInputValue] = useState<string>("");

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "";
  const mergedStep = step ?? 1;
  const mergedFormat = format ?? fieldDef?.format ?? "number";
  const mergedDecimals = decimals ?? (fieldDef?.decimalPlaces ? parseInt(fieldDef.decimalPlaces) : 2);
  
  // Auto-generate testId based on mode if not provided and fieldCode is available
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `text-${fieldCode}` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  // Sync internal state with prop value
  // Handle both string and number values for flexibility
  useEffect(() => {
    if (mode === "edit") {
      if (value === null || value === undefined) {
        setInputValue("");
      } else {
        setInputValue(String(value));
      }
    }
  }, [value, mode]);

  // Convert value to number for formatting (handles both string and number inputs)
  const getNumericValue = (val: string | number | null): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = typeof val === "string" ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  };

  const formatNumber = (val: string | number | null): string => {
    const num = getNumericValue(val);
    if (num === null) return "-";

    const formattedNum = num.toLocaleString("en-US", {
      minimumFractionDigits: mergedDecimals,
      maximumFractionDigits: mergedDecimals,
    });

    if (mergedFormat === "percentage") {
      return `${formattedNum}%`;
    }

    return formattedNum;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    
    // Always update the internal string state to preserve what user types
    setInputValue(newInputValue);
    
    // Propagate string value to parent (backend expects strings for decimal fields)
    if (newInputValue === "") {
      onChange?.(null);
      return;
    }
    
    const numValue = Number(newInputValue);
    
    // Only call onChange when we have a valid finite number
    // This allows intermediate states like "-" or "1." without clearing the field
    // Pass the string value directly for backend compatibility with decimal fields
    if (isFinite(numValue)) {
      onChange?.(newInputValue);
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
            type="number"
            value={inputValue}
            onChange={handleChange}
            placeholder={mergedPlaceholder}
            step={mergedStep}
            className={className || defaultEditClassName}
            data-testid={mergedTestId}
          />
        </FormControl>
      </>
    );
  }

  if (mode === "view") {
    return (
      <>
        {mergedLabel && (
          <FormLabel className="text-muted-foreground">
            {mergedLabel}
          </FormLabel>
        )}
        <div className={className || defaultViewClassName} data-testid={mergedTestId}>
          {formatNumber(value)}
        </div>
      </>
    );
  }

  if (mode === "table") {
    return (
      <span className={className || defaultTableClassName} data-testid={mergedTestId}>
        {formatNumber(value)}
      </span>
    );
  }

  return null;
}
