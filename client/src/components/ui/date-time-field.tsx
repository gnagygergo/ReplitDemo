import { useState } from "react";
import { format as formatDate, set as setDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDateTimeFormat } from "@/hooks/useDateTimeFormat";

export interface DateTimeFieldProps {
  fieldType: "Date" | "Time" | "DateTime";
  mode: "edit" | "view" | "table";
  value: Date | null;
  onChange?: (value: Date | null) => void;
  placeholder?: string;
  testId?: string;
  className?: string;
}

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
  const [isOpen, setIsOpen] = useState(false);

  const defaultPlaceholder = 
    fieldType === "Date" ? "Select date..." :
    fieldType === "Time" ? "Select time..." :
    "Select date and time...";

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    if (fieldType === "Date") {
      const displayValue = value ? fromUTC(value) : null;
      
      return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !value && "text-muted-foreground",
                className || defaultEditClassName
              )}
              data-testid={testId}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? formatDateValue(value, "Date") : (placeholder || defaultPlaceholder)}
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
                  const newDate = setDate(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
                  onChange?.(toUTC(newDate));
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
      const displayValue = value ? fromUTC(value) : null;
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
            const baseDate = value ? fromUTC(value) : new Date();
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
      const displayValue = value ? fromUTC(value) : null;
      const timeValue = displayValue ? formatDate(displayValue, "HH:mm") : "";
      
      return (
        <div className="flex gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
                data-testid={testId ? `${testId}-date` : undefined}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? formatDateValue(value, "Date") : (placeholder || "Select date...")}
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
    const displayValue = formatDateValue(value, fieldType);
    
    return (
      <div className={className || defaultViewClassName}>
        <span data-testid={testId}>{displayValue}</span>
      </div>
    );
  }

  if (mode === "table") {
    const displayValue = formatDateValue(value, fieldType);
    
    return (
      <span className={className || defaultTableClassName} data-testid={testId}>
        {displayValue}
      </span>
    );
  }

  return null;
}
