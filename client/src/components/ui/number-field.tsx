import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

export interface NumberFieldProps {
  mode: "edit" | "view" | "table";
  value: number | null;
  onChange?: (value: number | null) => void;
  placeholder?: string;
  testId?: string;
  className?: string;
  step?: number;
  format?: "number" | "percentage";
  decimals?: number;
}

export function NumberField({
  mode,
  value,
  onChange,
  placeholder = "",
  testId,
  className,
  step = 1,
  format = "number",
  decimals = 2,
}: NumberFieldProps) {
  // Internal state to track the string representation during editing
  // This allows intermediate states like "-", "1.", or "-5." while typing
  const [inputValue, setInputValue] = useState<string>("");

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  // Sync internal state with prop value
  useEffect(() => {
    if (mode === "edit") {
      setInputValue(value !== null ? String(value) : "");
    }
  }, [value, mode]);

  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return "-";

    const formattedNum = num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (format === "percentage") {
      return `${formattedNum}%`;
    }

    return formattedNum;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    
    // Always update the internal string state to preserve what user types
    setInputValue(newInputValue);
    
    // Parse and propagate to parent only when we have a valid number or empty string
    if (newInputValue === "") {
      onChange?.(null);
      return;
    }
    
    const numValue = Number(newInputValue);
    
    // Only call onChange when we have a finite number
    // This allows intermediate states like "-" or "1." without clearing the field
    if (isFinite(numValue)) {
      onChange?.(numValue);
    }
  };

  if (mode === "edit") {
    return (
      <Input
        type="number"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        step={step}
        className={className || defaultEditClassName}
        data-testid={testId}
      />
    );
  }

  if (mode === "view") {
    return (
      <div className={className || defaultViewClassName} data-testid={testId}>
        {formatNumber(value)}
      </div>
    );
  }

  if (mode === "table") {
    return (
      <span className={className || defaultTableClassName} data-testid={testId}>
        {formatNumber(value)}
      </span>
    );
  }

  return null;
}
