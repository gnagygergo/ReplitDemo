import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel, FormControl } from "@/components/ui/form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MessageCircleQuestion } from "lucide-react";
import { useFieldDefinition } from "@/hooks/use-field-definition";

export interface CheckboxFieldProps {
  mode: "edit" | "view" | "table";
  value: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  helpText?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  objectCode?: string;
  fieldCode?: string;
}

export function CheckboxField({
  mode,
  value,
  onChange,
  label,
  helpText,
  placeholder,
  testId,
  className,
  objectCode,
  fieldCode,
}: CheckboxFieldProps) {
  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedHelpText = helpText ?? fieldDef?.helpText ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "";

  // Auto-generate testId based on mode if not provided and fieldCode is available
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `checkbox-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `checkbox-${fieldCode}-disabled` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  const defaultEditClassName = "flex items-center gap-2";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    return (
      <div className={className || defaultEditClassName}>
        <FormControl>
          <Checkbox
            checked={value}
            onCheckedChange={(checked) => onChange?.(checked as boolean)}
            data-testid={mergedTestId}
          />
        </FormControl>
        {mergedLabel && (
          <FormLabel className="text-muted-foreground font-normal cursor-pointer">
            {mergedLabel}
          </FormLabel>
        )}
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
  }

  if (mode === "view") {
    return (
      <div className={className || defaultEditClassName}>
        <Checkbox
          checked={value}
          disabled
          data-testid={mergedTestId}
        />
        {mergedLabel && (
          <FormLabel className="text-muted-foreground font-normal">
            {mergedLabel}
          </FormLabel>
        )}
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
  }

  if (mode === "table") {
    return (
      <span 
        className={className || defaultTableClassName}
        data-testid={mergedTestId}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  return null;
}
