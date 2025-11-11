import { useState } from "react";
import { format as formatDate, set as setDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDateTimeFormat } from "@/hooks/useDateTimeFormat";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { utcToUserZoned, userZonedToUtc, parseDateInput } from "@/utils/timezone-utils";

export interface DateTimeFieldProps {
  fieldType: "Date" | "Time" | "DateTime";
  mode: "edit" | "view" | "table";
  value: string | Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  testId?: string;
  className?: string;
}

/**
 * Converts a local date/time to UTC by treating local components as UTC.
 * Example: Input "2024-11-11 15:00 local" -> Output "2024-11-11T15:00:00.000Z"
 * This is used when saving user-selected dates to ensure the wall-clock time is preserved in UTC.
 */
function toUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0,
    0
  ));
}

/**
 * Converts a UTC date to local by extracting UTC components and treating them as local.
 * Example: Input "2024-11-11T15:00:00.000Z" -> Output Date with local time "2024-11-11 15:00"
 * This is used for display to show the stored UTC time as-is without timezone conversion.
 */
function fromUTC(date: Date): Date {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    0,
    0
  );
}

export function DateTimeField({
  fieldType,
  mode,
  value,
  onChange,
  placeholder,
  testId,
  className,
}: DateTimeFieldProps) {
  const { formatDateValue, defaultTimePresentation } = useDateTimeFormat();
  const { timezone } = useUserTimezone();
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [isOpen, setIsOpen] = useState(false);

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
      <div className={cn("text-sm text-destructive", className)}>
        <span data-testid={testId}>Invalid date</span>
      </div>
    );
  }

  const defaultPlaceholder = 
    fieldType === "Date" ? "Select date..." :
    fieldType === "Time" ? "Select time..." :
    "Select date and time...";

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    if (fieldType === "Date") {
      // For Date fields, convert UTC to user timezone for display (preserves calendar day)
      const displayValue = normalizedValue && timezone ? utcToUserZoned(normalizedValue, timezone, "Date") : null;
      
      return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !normalizedValue && "text-muted-foreground",
                className || defaultEditClassName
              )}
              data-testid={testId}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {normalizedValue ? formatDateValue(normalizedValue, "Date") : (placeholder || defaultPlaceholder)}
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
      );
    }

    if (fieldType === "Time") {
      const displayValue = normalizedValue ? fromUTC(normalizedValue) : null;
      const timeValue = displayValue ? formatDate(displayValue, "HH:mm") : "";
      
      return (
        <Input
          type="time"
          value={timeValue}
          onChange={(e) => {
            if (!e.target.value) {
              onChange?.(null);
              return;
            }
            const [hours, minutes] = e.target.value.split(":");
            const baseDate = normalizedValue ? fromUTC(normalizedValue) : new Date();
            const newDate = setDate(baseDate, {
              hours: parseInt(hours, 10),
              minutes: parseInt(minutes, 10),
              seconds: 0,
              milliseconds: 0,
            });
            onChange?.(toUTC(newDate));
          }}
          className={className || defaultEditClassName}
          data-testid={testId}
        />
      );
    }

    if (fieldType === "DateTime") {
      const displayValue = normalizedValue ? fromUTC(normalizedValue) : null;
      const timeValue = displayValue ? formatDate(displayValue, "HH:mm") : "";
      
      return (
        <div className="flex gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !normalizedValue && "text-muted-foreground"
                )}
                data-testid={testId ? `${testId}-date` : undefined}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {normalizedValue ? formatDateValue(normalizedValue, "Date") : (placeholder || "Select date...")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={displayValue || undefined}
                onSelect={(date) => {
                  if (!date) {
                    onChange?.(null);
                  } else {
                    const existingTime = displayValue || setDate(new Date(), { hours: 0, minutes: 0 });
                    const newDate = setDate(date, {
                      hours: existingTime.getHours(),
                      minutes: existingTime.getMinutes(),
                      seconds: 0,
                      milliseconds: 0,
                    });
                    onChange?.(toUTC(newDate));
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
              if (!e.target.value) return;
              const [hours, minutes] = e.target.value.split(":");
              const baseDate = displayValue || new Date();
              const newDate = setDate(baseDate, {
                hours: parseInt(hours, 10),
                minutes: parseInt(minutes, 10),
                seconds: 0,
                milliseconds: 0,
              });
              onChange?.(toUTC(newDate));
            }}
            className="w-32"
            data-testid={testId ? `${testId}-time` : undefined}
          />
        </div>
      );
    }
  }

  if (mode === "view") {
    const displayValue = formatDateValue(normalizedValue, fieldType);
    
    return (
      <div className={className || defaultViewClassName}>
        <span data-testid={testId}>{displayValue}</span>
      </div>
    );
  }

  if (mode === "table") {
    const displayValue = formatDateValue(normalizedValue, fieldType);
    
    return (
      <span className={className || defaultTableClassName} data-testid={testId}>
        {displayValue}
      </span>
    );
  }

  return null;
}
