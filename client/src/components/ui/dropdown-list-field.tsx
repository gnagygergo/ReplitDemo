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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { FormLabel, FormControl } from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, MessageCircleQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useLayoutMandatoryField } from "@/contexts/LayoutModeContext";

export interface DropDownListFieldProps {
  mode: "edit" | "view" | "table";
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
  sourceType?: "universalMetadata" | "globalMetadata";
  sourcePath?: string;
  showSearch?: boolean;
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  disabled?: boolean;
  // Function to extract display value from metadata item
  getDisplayValue?: (item: any) => string;
  // Function to extract option value from metadata item
  getValue?: (item: any) => string;
  // Root key in XML structure (e.g., "currencies" for currencies.xml) - only used for universalMetadata
  rootKey?: string;
  // Item key in XML structure (e.g., "currency" for currencies.xml) - only used for universalMetadata
  itemKey?: string;
  objectCode?: string;
  fieldCode?: string;
  layoutMandatory?: string | boolean;
}

export function DropDownListField({
  mode,
  value,
  onValueChange,
  onChange,
  sourceType,
  sourcePath,
  showSearch,
  label,
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
  layoutMandatory,
}: DropDownListFieldProps) {
  const [open, setOpen] = useState(false);

  // Merge onChange and onValueChange - onChange takes precedence for consistency with other field components
  const handleValueChange = (newValue: string) => {
    onChange?.(newValue);
    onValueChange?.(newValue);
  };

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Register with LayoutModeContext if layoutMandatory is set
  const fieldId = fieldCode || testId || label || "dropdown-field";
  const { error: mandatoryError } = useLayoutMandatoryField({
    fieldId,
    value,
    layoutMandatory,
  });

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "Select an option";
  const mergedShowSearch = showSearch ?? fieldDef?.allowSearch ?? false;
  const mergedSourcePath = sourcePath ?? fieldDef?.sourcePath ?? fieldDef?.metadataSource ?? "";
  const mergedSourceType = sourceType ?? fieldDef?.sourceType ?? "universalMetadata";
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

  // Fetch metadata for both universalMetadata and globalMetadata
  const { data: metadataResponse, isLoading } = useMetadata({
    sourcePath: mergedSourcePath,
    enabled: !!mergedSourcePath,
  });

  // Extract sorting setting for globalMetadata (ascending, descending, or no sorting)
  const globalSorting = mergedSourceType === "globalMetadata" 
    ? metadataResponse?.GlobalValueSet?.sorting?.[0] || "no sorting"
    : "no sorting";

  // Extract items from XML response based on sourceType
  let rawItems: any[] = [];
  if (mergedSourceType === "globalMetadata") {
    // For globalMetadata, extract from GlobalValueSet.customValue structure
    rawItems = metadataResponse?.GlobalValueSet?.customValue || [];
  } else {
    // For universalMetadata, use rootKey/itemKey
    rawItems = metadataResponse?.[rootKey || "root"]?.[itemKey || "item"] || [];
  }

  // Sort items based on sorting setting (only for globalMetadata)
  const sortItems = (itemsToSort: any[]): any[] => {
    if (mergedSourceType !== "globalMetadata") {
      return itemsToSort;
    }

    const itemsCopy = [...itemsToSort];

    if (globalSorting === "ascending") {
      // Sort A-Z by label
      return itemsCopy.sort((a, b) => {
        const labelA = (a.label?.[0] || "").toLowerCase();
        const labelB = (b.label?.[0] || "").toLowerCase();
        return labelA.localeCompare(labelB);
      });
    } else if (globalSorting === "descending") {
      // Sort Z-A by label
      return itemsCopy.sort((a, b) => {
        const labelA = (a.label?.[0] || "").toLowerCase();
        const labelB = (b.label?.[0] || "").toLowerCase();
        return labelB.localeCompare(labelA);
      });
    } else {
      // No sorting - use order tag (default to array index if no order)
      return itemsCopy.sort((a, b) => {
        const orderA = parseInt(a.order?.[0] || "0", 10) || 0;
        const orderB = parseInt(b.order?.[0] || "0", 10) || 0;
        return orderA - orderB;
      });
    }
  };

  const items = sortItems(rawItems);

  // Default display value extractor
  const defaultGetDisplayValue = (item: any) => {
    if (typeof item === "string") return item;
    
    // For globalMetadata, extract from label (with fallback to first property)
    if (mergedSourceType === "globalMetadata") {
      const firstValue = Object.values(item)[0];
      const fallback = Array.isArray(firstValue) ? firstValue[0] : "";
      return item.label?.[0] || item.fullName?.[0] || item.valueName?.[0] || fallback || "";
    }
    
    // For universalMetadata, assume first property is display value
    const firstKey = Object.keys(item)[0];
    return item[firstKey]?.[0] || "";
  };

  // Default value extractor
  const defaultGetValue = (item: any) => {
    if (typeof item === "string") return item;
    
    // For globalMetadata, extract from code (with fallback to fullName/valueName)
    if (mergedSourceType === "globalMetadata") {
      const firstValue = Object.values(item)[0];
      const fallback = Array.isArray(firstValue) ? firstValue[0] : "";
      return item.code?.[0] || item.fullName?.[0] || item.valueName?.[0] || fallback || "";
    }
    
    // For universalMetadata, assume first property is the value
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
  if (mode === "edit" && !mergedSourcePath) {
    return (
      <>
        {renderLabel()}
        <FormControl>
          <div className={cn("text-sm text-destructive", className || defaultEditClassName)} data-testid={mergedTestId}>
            Missing source path for field
          </div>
        </FormControl>
      </>
    );
  }

  if (mode === "edit") {
    if (isLoading) {
      return (
        <>
          {renderLabel()}
          <FormControl>
            <div className={className || defaultEditClassName} data-testid={mergedTestId}>
              Loading options...
            </div>
          </FormControl>
        </>
      );
    }

    // Use Command component for searchable dropdown
    if (mergedShowSearch) {
      return (
        <>
          {renderLabel()}
          <FormControl>
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
                              handleValueChange(itemValue);
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
          </FormControl>
          {mandatoryError && (
            <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
              {mandatoryError}
            </p>
          )}
        </>
      );
    }

    // Use Select component for simple dropdown (no search)
    return (
      <>
        {renderLabel()}
        <FormControl>
          <Select
            value={value}
            onValueChange={handleValueChange}
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
    return (
      <>
        {renderLabel()}
        <div
          className={className || defaultViewClassName}
          data-testid={mergedTestId}
        >
          {displayTextForViewMode}
        </div>
      </>
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
