import { useMetadata } from "@/hooks/useMetadata";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface DropDownListFieldProps {
  mode: "edit" | "view" | "table";
  value: string;
  onValueChange?: (value: string) => void;
  sourceType: "metadata";
  sourcePath: string;
  showSearch?: boolean;
  placeholder?: string;
  testId?: string;
  className?: string;
  disabled?: boolean;
  // Function to extract display value from metadata item
  getDisplayValue?: (item: any) => string;
  // Function to extract option value from metadata item
  getValue?: (item: any) => string;
  // Root key in XML structure (e.g., "currencies" for currencies.xml)
  rootKey?: string;
  // Item key in XML structure (e.g., "currency" for currencies.xml)
  itemKey?: string;
}

export function DropDownListField({
  mode,
  value,
  onValueChange,
  sourceType,
  sourcePath,
  showSearch = false,
  placeholder = "Select an option",
  testId,
  className,
  disabled = false,
  getDisplayValue,
  getValue,
  rootKey,
  itemKey,
}: DropDownListFieldProps) {
  const [open, setOpen] = useState(false);

  // Only fetch metadata for sourceType="metadata"
  const { data: metadataResponse, isLoading } = useMetadata({
    sourcePath,
    enabled: sourceType === "metadata",
  });

  // Extract items from XML response
  const items = metadataResponse?.[rootKey || "root"]?.[itemKey || "item"] || [];

  // Default display value extractor (assumes first property is display value)
  const defaultGetDisplayValue = (item: any) => {
    if (typeof item === "string") return item;
    const firstKey = Object.keys(item)[0];
    return item[firstKey]?.[0] || "";
  };

  // Default value extractor (assumes first property is the value)
  const defaultGetValue = (item: any) => {
    if (typeof item === "string") return item;
    const firstKey = Object.keys(item)[0];
    return item[firstKey]?.[0] || "";
  };

  const extractDisplayValue = getDisplayValue || defaultGetDisplayValue;
  const extractValue = getValue || defaultGetValue;

  // Find the selected item
  const selectedItem = items.find(
    (item: any) => extractValue(item) === value
  );
  const displayText = selectedItem
    ? extractDisplayValue(selectedItem)
    : value || "-";

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    if (isLoading) {
      return (
        <div className={className || defaultEditClassName} data-testid={testId}>
          Loading options...
        </div>
      );
    }

    // Use Command component for searchable dropdown
    if (showSearch) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "justify-between font-normal",
                className || defaultEditClassName
              )}
              disabled={disabled}
              data-testid={testId}
            >
              {displayText}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>No option found.</CommandEmpty>
                <CommandGroup>
                  {items.map((item: any, index: number) => {
                    const itemValue = extractValue(item);
                    const itemDisplay = extractDisplayValue(item);
                    return (
                      <CommandItem
                        key={`${itemValue}-${index}`}
                        value={itemDisplay}
                        onSelect={() => {
                          onValueChange?.(itemValue);
                          setOpen(false);
                        }}
                        data-testid={`${testId}-option-${itemValue}`}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === itemValue ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {itemDisplay}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    // Use Select component for simple dropdown (no search)
    return (
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={className || defaultEditClassName}
          data-testid={testId}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item: any, index: number) => {
            const itemValue = extractValue(item);
            const itemDisplay = extractDisplayValue(item);
            return (
              <SelectItem
                key={`${itemValue}-${index}`}
                value={itemValue}
                data-testid={`${testId}-option-${itemValue}`}
              >
                {itemDisplay}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  if (mode === "view") {
    return (
      <div
        className={className || defaultViewClassName}
        data-testid={testId}
      >
        {displayText}
      </div>
    );
  }

  if (mode === "table") {
    return (
      <div
        className={className || defaultTableClassName}
        data-testid={testId}
      >
        {displayText}
      </div>
    );
  }

  return null;
}
