import { useState } from "react";
import { format as formatDate, set as setDate } from "date-fns";
import { Calendar as CalendarIcon, MessageCircleQuestion } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { useDateTimeFormat } from "@/hooks/useDateTimeFormat";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { utcToUserZoned, userZonedToUtc, parseDateInput } from "@/utils/timezone-utils";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useLayoutMandatoryField } from "@/contexts/LayoutModeContext";

export interface DateTimeFieldProps {
  fieldType?: "Date" | "Time" | "DateTime";
  mode: "edit" | "view" | "table";
  value: string | Date | null;
  onChange?: (value: Date | null) => void;
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  objectCode?: string;
  fieldCode?: string;
  layoutMandatory?: string | boolean;
}

export function DateTimeField({
  fieldType,
  mode,
  value,
  onChange,
  label,
  placeholder,
  testId,
  className,
  objectCode,
  fieldCode,
  layoutMandatory,
}: DateTimeFieldProps) {
  const { formatDateValue, defaultTimePresentation } = useDateTimeFormat();
  const { timezone } = useUserTimezone();
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isOpen, setIsOpen] = useState(false);

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef, isLoading: isLoadingFieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Register with LayoutModeContext if layoutMandatory is set
  const fieldId = fieldCode || testId || label || "datetime-field";
  const { error: mandatoryError } = useLayoutMandatoryField({
    fieldId,
    value: value ? String(value) : null,
    layoutMandatory,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? undefined;
  const mergedFieldType = fieldType ?? (fieldDef?.fieldType as "Date" | "Time" | "DateTime" | undefined);
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
  
  // If fieldType is not explicitly provided and we're loading metadata, show loading state
  if (!fieldType && isLoadingFieldDef) {
    if (mode === "table") {
      return <span className={className || "text-sm"} data-testid={mergedTestId}>-</span>;
    }
    return (
      <>
        {renderLabel()}
        <div className={mode === "edit" ? "w-full" : "text-sm py-2"}>
          <span data-testid={mergedTestId}>-</span>
        </div>
      </>
    );
  }
  
  // Error handling: fieldType must be provided either as prop or via metadata
  // Only error if metadata has finished loading and still no fieldType
  if (!mergedFieldType) {
    console.error(
      `DateTimeField error: fieldType not provided. Either pass fieldType prop or provide objectCode="${objectCode}" and fieldCode="${fieldCode}" with valid XML metadata containing <fieldType>.`
    );
    return (
      <>
        {renderLabel()}
        <div className="text-sm text-destructive">
          <span data-testid={mergedTestId || "text-fieldtype-missing"}>
            Field type unavailable
          </span>
        </div>
      </>
    );
  }

  /**
   * Normalize string values to Date objects.
   * Handles three formats:
   * 1. Date-only (YYYY-MM-DD): Interpreted as UTC midnight
   * 2. DateTime with Z suffix (ISO 8601 UTC): Parsed as-is
   * 3. DateTime with offset (+HH:MM): Parsed as-is
   */
  let normalizedValue: Date | null = null;
  let hasError = false;
  
  if (value) {
    if (typeof value === 'string') {
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const hasExplicitTimezone = value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value);
      
      if (isDateOnly) {
        // Date-only format (YYYY-MM-DD) - interpret as UTC midnight
        const parsed = new Date(`${value}T00:00:00.000Z`);
        if (isNaN(parsed.getTime())) {
          console.error(`DateTimeField received invalid date-only string: ${value}`);
          hasError = true;
        } else {
          normalizedValue = parsed;
        }
      } else if (hasExplicitTimezone) {
        // DateTime with explicit timezone
        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) {
          console.error(`DateTimeField received invalid datetime string: ${value}`);
          hasError = true;
        } else {
          normalizedValue = parsed;
        }
      } else {
        // DateTime without timezone - reject to prevent ambiguity
        console.error(`DateTimeField received datetime string without explicit timezone: ${value}. Use 'Z' suffix or provide date-only format (YYYY-MM-DD).`);
        hasError = true;
      }
    } else {
      normalizedValue = value;
    }
  }
  
  if (hasError) {
    return (
      <>
        {renderLabel()}
        <div className={cn("text-sm text-destructive", className)}>
          <span data-testid={mergedTestId}>Invalid date</span>
        </div>
      </>
    );
  }

  const defaultPlaceholder = 
    mergedFieldType === "Date" ? "Select date..." :
    mergedFieldType === "Time" ? "Select time..." :
    "Select date and time...";

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    if (mergedFieldType === "Date") {
      // For Date fields, convert UTC to user timezone for display (preserves calendar day)
      const displayValue = normalizedValue && timezone ? utcToUserZoned(normalizedValue, timezone, "Date") : null;
      
      return (
        <>
          {renderLabel()}
          <FormControl>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !normalizedValue && "text-muted-foreground",
                    className || defaultEditClassName
                  )}
                  data-testid={mergedTestId}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {normalizedValue ? formatDateValue(normalizedValue, "Date") : (mergedPlaceholder || defaultPlaceholder)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={displayValue || undefined}
                  onSelect={(date) => {
                    if (!date || !timezone) {
                      onChange?.(null);
                    } else {
                      const newDate = setDate(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
                      onChange?.(parseDateInput(newDate, "Date", timezone, browserTimezone));
                    }
                    setIsOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormControl>
          {mandatoryError && (
            <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
              {mandatoryError}
            </p>
          )}
        </>
      );
    }

    if (mergedFieldType === "Time") {
      // For Time fields, convert UTC to user timezone for display
      const displayValue = normalizedValue && timezone ? utcToUserZoned(normalizedValue, timezone, "Time") : null;
      const timeValue = displayValue ? formatDate(displayValue, "HH:mm") : "";
      
      return (
        <>
          {renderLabel()}
          <FormControl>
            <Input
              type="time"
              value={timeValue}
              onChange={(e) => {
                if (!e.target.value || !timezone) {
                  onChange?.(null);
                  return;
                }
                const [hours, minutes] = e.target.value.split(":");
                const baseDate = normalizedValue && timezone ? 
                  utcToUserZoned(normalizedValue, timezone, "Time") : 
                  new Date();
                const newDate = setDate(baseDate, {
                  hours: parseInt(hours, 10),
                  minutes: parseInt(minutes, 10),
                  seconds: 0,
                  milliseconds: 0,
                });
                onChange?.(parseDateInput(newDate, "Time", timezone, browserTimezone));
              }}
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

    if (mergedFieldType === "DateTime") {
      // For DateTime fields, convert UTC to user timezone for display
      const displayValue = normalizedValue && timezone ? utcToUserZoned(normalizedValue, timezone, "DateTime") : null;
      const timeValue = displayValue ? formatDate(displayValue, "HH:mm") : "";
      
      return (
        <>
          {renderLabel()}
          <FormControl>
            <div className="flex gap-2">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !normalizedValue && "text-muted-foreground"
                    )}
                    data-testid={mergedTestId ? `${mergedTestId}-date` : undefined}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {normalizedValue ? formatDateValue(normalizedValue, "Date") : (mergedPlaceholder || "Select date...")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={displayValue || undefined}
                    onSelect={(date) => {
                      if (!date || !timezone) {
                        onChange?.(null);
                      } else {
                        const existingTime = displayValue || setDate(new Date(), { hours: 0, minutes: 0 });
                        const newDate = setDate(date, {
                          hours: existingTime.getHours(),
                          minutes: existingTime.getMinutes(),
                          seconds: 0,
                          milliseconds: 0,
                        });
                        onChange?.(parseDateInput(newDate, "DateTime", timezone, browserTimezone));
                      }
                      setIsOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={timeValue}
                onChange={(e) => {
                  if (!e.target.value || !timezone) return;
                  const [hours, minutes] = e.target.value.split(":");
                  const baseDate = displayValue || new Date();
                  const newDate = setDate(baseDate, {
                    hours: parseInt(hours, 10),
                    minutes: parseInt(minutes, 10),
                    seconds: 0,
                    milliseconds: 0,
                  });
                  onChange?.(parseDateInput(newDate, "DateTime", timezone, browserTimezone));
                }}
                className="w-32"
                data-testid={mergedTestId ? `${mergedTestId}-time` : undefined}
              />
            </div>
          </FormControl>
          {mandatoryError && (
            <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
              {mandatoryError}
            </p>
          )}
        </>
      );
    }
  }

  if (mode === "view") {
    const displayValue = formatDateValue(normalizedValue, mergedFieldType);
    
    return (
      <>
        {renderLabel()}
        <div className={className || defaultViewClassName}>
          <span data-testid={mergedTestId}>{displayValue}</span>
        </div>
      </>
    );
  }

  if (mode === "table") {
    const displayValue = formatDateValue(normalizedValue, mergedFieldType);
    
    return (
      <span className={className || defaultTableClassName} data-testid={mergedTestId}>
        {displayValue}
      </span>
    );
  }

  return null;
}
