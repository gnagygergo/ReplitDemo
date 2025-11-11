import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export interface TextFieldProps {
  mode: "edit" | "view" | "table";
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "url" | "password";
  testId?: string;
  className?: string;
  maxLength?: number;
  copyable?: boolean;
  truncate?: boolean;
  linkPath?: string;
  recordId?: string;
  visibleLinesInEdit?: number;
  visibleLinesInView?: number;
}

export function TextField({
  mode,
  value,
  onChange,
  placeholder = "",
  type = "text",
  testId,
  className,
  maxLength,
  copyable = false,
  truncate = false,
  linkPath,
  recordId,
  visibleLinesInEdit,
  visibleLinesInView,
}: TextFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    // Use Textarea for multi-line input
    if (visibleLinesInEdit) {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={visibleLinesInEdit}
          className={className || defaultEditClassName}
          data-testid={testId}
        />
      );
    }

    // Use Input for single-line input
    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={className || defaultEditClassName}
        data-testid={testId}
      />
    );
  }

  if (mode === "view") {
    const displayValue = value || "-";
    
    // Multi-line view mode with preserved line breaks
    if (visibleLinesInView) {
      const lineHeight = 1.5; // Tailwind's default line height for text-sm
      const maxHeight = `${visibleLinesInView * lineHeight}rem`;
      
      return (
        <div className={`flex items-start gap-2 ${className || defaultViewClassName}`}>
          <div 
            className="whitespace-pre-wrap overflow-y-auto"
            style={{ maxHeight }}
            data-testid={testId}
          >
            {displayValue}
          </div>
          {copyable && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0 flex-shrink-0"
              data-testid={`${testId}-copy`}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      );
    }
    
    // Single-line view mode (default behavior)
    return (
      <div className={`flex items-center gap-2 ${className || defaultViewClassName}`}>
        <span data-testid={testId}>
          {displayValue}
        </span>
        {copyable && value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 w-6 p-0"
            data-testid={`${testId}-copy`}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  if (mode === "table") {
    const displayValue = value || "-";
    const truncatedValue = truncate && value.length > 30 
      ? `${value.substring(0, 30)}...` 
      : displayValue;

    // If linkPath and recordId are provided, render as clickable link
    if (linkPath && recordId) {
      return (
        <Link href={`${linkPath}/${recordId}`}>
          <span 
            className="text-primary hover:underline cursor-pointer"
            data-testid={testId}
            title={truncate && value.length > 30 ? value : undefined}
          >
            {truncatedValue}
          </span>
        </Link>
      );
    }

    // Otherwise, render as plain text
    return (
      <span 
        className={className || defaultTableClassName}
        data-testid={testId}
        title={truncate && value.length > 30 ? value : undefined}
      >
        {truncatedValue}
      </span>
    );
  }

  return null;
}
