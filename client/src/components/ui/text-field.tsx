import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormLabel, FormControl } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Copy, Check, MessageCircleQuestion } from "lucide-react";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { PhoneField } from "@/components/ui/phone-field";
import { useLayoutMandatoryField } from "@/contexts/LayoutModeContext";

export interface TextFieldProps {
  mode: "edit" | "view" | "table";
  value: string;
  onChange?: (value: string) => void;
  label?: string;
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
  objectCode?: string;
  fieldCode?: string;
  layoutMandatory?: string | boolean;
}

export function TextField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  type,
  testId,
  className,
  maxLength,
  copyable,
  truncate,
  linkPath,
  recordId,
  visibleLinesInEdit,
  visibleLinesInView,
  objectCode,
  fieldCode,
  layoutMandatory,
}: TextFieldProps) {
  const [copied, setCopied] = useState(false);

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Register with LayoutModeContext if layoutMandatory is set
  const fieldId = fieldCode || testId || label || "text-field";
  const { error: mandatoryError } = useLayoutMandatoryField({
    fieldId,
    value,
    layoutMandatory,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "";
  const mergedType = type ?? (fieldDef?.subtype as "text" | "email" | "url" | "password") ?? "text";
  const mergedMaxLength = maxLength ?? (fieldDef?.maxLength ? parseInt(fieldDef.maxLength) : undefined);
  const mergedCopyable = copyable ?? fieldDef?.copyAble ?? false;
  const mergedTruncate = truncate ?? fieldDef?.truncate ?? false;
  const mergedVisibleLinesInEdit = visibleLinesInEdit ?? (fieldDef?.visibleLinesInEdit ? parseInt(fieldDef.visibleLinesInEdit) : undefined);
  const mergedVisibleLinesInView = visibleLinesInView ?? (fieldDef?.visibleLinesInView ? parseInt(fieldDef.visibleLinesInView) : undefined);
  const mergedHelpText = fieldDef?.helpText ?? "";

  const renderLabel = () => {
    if (!mergedLabel) return null;
    return (
      <div className="flex items-center gap-1">
        <FormLabel className="text-muted-foreground">
          {mergedLabel}
        </FormLabel>
        {mergedHelpText && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-foreground">
                <MessageCircleQuestion className="h-4 w-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="text-sm">
              {mergedHelpText}
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    );
  };
  
  // Auto-generate testId based on mode if not provided and fieldCode is available
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `text-${fieldCode}` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

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

  if (fieldDef?.subtype === "phone") {
    return (
      <PhoneField
        mode={mode}
        value={value}
        onChange={onChange}
        label={mergedLabel}
        testId={mergedTestId}
        className={className}
      />
    );
  }

  if (mode === "edit") {
    // Use Textarea for multi-line input
    if (mergedVisibleLinesInEdit) {
      return (
        <>
          {renderLabel()}
          <FormControl>
            <Textarea
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={mergedPlaceholder}
              maxLength={mergedMaxLength}
              rows={mergedVisibleLinesInEdit}
              className={className || defaultEditClassName}
              data-testid={mergedTestId}
            />
          </FormControl>
          {mandatoryError && (
            <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
              {mandatoryError}
            </p>
          )}
        </>
      );
    }

    // Use Input for single-line input
    return (
      <>
        {renderLabel()}
        <FormControl>
          <Input
            type={mergedType}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={mergedPlaceholder}
            maxLength={mergedMaxLength}
            className={className || defaultEditClassName}
            data-testid={mergedTestId}
          />
        </FormControl>
        {mandatoryError && (
          <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
            {mandatoryError}
          </p>
        )}
      </>
    );
  }

  if (mode === "view") {
    const displayValue = value || "-";
    
    // Multi-line view mode with preserved line breaks
    if (mergedVisibleLinesInView) {
      const lineHeight = 1.5; // Tailwind's default line height for text-sm
      const maxHeight = `${mergedVisibleLinesInView * lineHeight}rem`;
      
      return (
        <>
          {renderLabel()}
          <div className={`flex items-start gap-2 ${className || defaultViewClassName}`}>
            <div 
              className="whitespace-pre-wrap overflow-y-auto"
              style={{ maxHeight }}
              data-testid={mergedTestId}
            >
              {displayValue}
            </div>
            {mergedCopyable && value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 flex-shrink-0"
                data-testid={`${mergedTestId}-copy`}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </>
      );
    }
    
    // Single-line view mode (default behavior)
    return (
      <>
        {renderLabel()}
        <div className={`flex items-center gap-2 ${className || defaultViewClassName}`}>
          <span data-testid={mergedTestId}>
            {displayValue}
          </span>
          {mergedCopyable && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 w-6 p-0"
              data-testid={`${mergedTestId}-copy`}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </>
    );
  }

  if (mode === "table") {
    const displayValue = value || "-";
    const truncatedValue = mergedTruncate && value.length > 30 
      ? `${value.substring(0, 30)}...` 
      : displayValue;

    // If linkPath and recordId are provided, render as clickable link
    if (linkPath && recordId) {
      return (
        <Link href={`${linkPath}/${recordId}`}>
          <span 
            className="text-primary hover:underline cursor-pointer"
            data-testid={mergedTestId}
            title={mergedTruncate && value.length > 30 ? value : undefined}
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
        data-testid={mergedTestId}
        title={mergedTruncate && value.length > 30 ? value : undefined}
      >
        {truncatedValue}
      </span>
    );
  }

  return null;
}
