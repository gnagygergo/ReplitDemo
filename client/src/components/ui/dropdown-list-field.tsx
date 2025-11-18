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
import { useFieldDefinition } from "@/hooks/use-field-definition";

export interface DropDownListFieldProps {
  mode: "edit" | "view" | "table";
  value?: string;
  onValueChange?: (value: string) => void;
  sourceType: "metadata";
  sourcePath?: string;
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
  objectCode?: string;
  fieldCode?: string;
}

export function DropDownListField({
  mode,
  value,
  onValueChange,
  sourceType,
  sourcePath,
  showSearch,
  placeholder,
  testId,
  className,
  disabled = false,
  getDisplayValue,
  getValue,
  rootKey,
  itemKey,
  objectCode,
  fieldCode,
}: DropDownListFieldProps) {
  const [open, setOpen] = useState(false);

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "Select an option";
  const mergedShowSearch = showSearch ?? fieldDef?.allowSearch ?? false;
  const mergedSourcePath = sourcePath ?? fieldDef?.metadataSource ?? "";
  
  // Auto-generate testId based on mode if not provided and fieldCode is available
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `text-${fieldCode}` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  // Only fetch metadata for sourceType="metadata"
  const { data: metadataResponse, isLoading } = useMetadata({
    sourcePath: mergedSourcePath,
    enabled: sourceType === "metadata" && !!mergedSourcePath,
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
  const selectedItem = value
    ? items.find((item: any) => extractValue(item) === value)
    : undefined;
  
  // Display text for view/table modes
  const displayTextForViewMode = selectedItem
    ? extractDisplayValue(selectedItem)
    : value || "-";

  // Display text for Command button in edit mode (shows placeholder if no value)
  const displayTextForEditMode = selectedItem
    ? extractDisplayValue(selectedItem)
    : mergedPlaceholder;

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  // Guard against missing metadata source path ONLY in edit mode
  // View/table modes don't need metadata - they just display the value
  if (mode === "edit" && sourceType === "metadata" && !mergedSourcePath) {
    return (
      <div className={cn("text-sm text-destructive", className || defaultEditClassName)} data-testid={mergedTestId}>
        Missing metadata source path for field
      </div>
    );
  }

  if (mode === "edit") {
    if (isLoading) {
      return (
        <div className={className || defaultEditClassName} data-testid={mergedTestId}>
          Loading options...
        </div>
      );
    }

    // Use Command component for searchable dropdown
    if (mergedShowSearch) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "justify-between font-normal",
                !value && "text-muted-foreground",
                className || defaultEditClassName
              )}
              disabled={disabled}
              data-testid={mergedTestId}
            >
              {displayTextForEditMode}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={`Search ${mergedPlaceholder.toLowerCase()}...`} />
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
                        data-testid={`${mergedTestId}-option-${itemValue}`}
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
          data-testid={mergedTestId}
        >
          <SelectValue placeholder={mergedPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item: any, index: number) => {
            const itemValue = extractValue(item);
            const itemDisplay = extractDisplayValue(item);
            return (
              <SelectItem
                key={`${itemValue}-${index}`}
                value={itemValue}
                data-testid={`${mergedTestId}-option-${itemValue}`}
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
        data-testid={mergedTestId}
      >
        {displayTextForViewMode}
      </div>
    );
  }

  if (mode === "table") {
    return (
      <div
        className={className || defaultTableClassName}
        data-testid={mergedTestId}
      >
        {displayTextForViewMode}
      </div>
    );
  }

  return null;
}
