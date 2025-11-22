import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import LookupDialog from "@/components/ui/lookup-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface LookupFormFieldProps {
  objectCode: string;
  fieldCode: string;
  mode?: "view" | "edit" | "table";
  value?: string | null;
  onChange?: (value: string | null) => void;
  onRecordClick?: (recordId: string) => void;
  disabled?: boolean;
  label?: string;
  testId?: string;
}

interface FieldMetadata {
  type: string;
  label?: string;
  helpText?: string;
  placeHolder?: string;
  referencedObject?: string;
  primaryDisplayField?: string;
  displayColumns?: string;
  testIdEdit?: string;
  testIdView?: string;
  testIdTable?: string;
}

export default function LookupFormField({
  objectCode,
  fieldCode,
  mode = "edit",
  value,
  onChange,
  onRecordClick,
  disabled = false,
  label,
  testId,
}: LookupFormFieldProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (record: any) => {
    onChange?.(record.id);
  };

  const handleClear = () => {
    onChange?.(null);
  };

  // Fetch field metadata from XML
  const { data: metadata, isLoading: isLoadingMetadata } = useQuery<FieldMetadata>({
    queryKey: [`/api/object-fields/${objectCode}/${fieldCode}`],
  });

  // Fetch object definition to get icon and label
  const { data: objectDefinitions = [] } = useQuery<Array<{
    apiCode: string;
    labelPlural: string;
    labelSingular: string;
    iconSet: string;
    icon: string;
  }>>({
    queryKey: ["/api/object-definitions"],
    enabled: !!metadata?.referencedObject,
  });

  // Find the referenced object definition
  const referencedObjectDef = objectDefinitions.find(
    obj => obj.apiCode === metadata?.referencedObject
  );

  // Fetch the selected record details
  const { data: selectedRecord, isLoading: isLoadingRecord } = useQuery<any>({
    queryKey: [`/api/${metadata?.referencedObject}/${value}`],
    enabled: !!value && !!metadata?.referencedObject,
    retry: false,
  });

  // Get icon component
  const getIconComponent = () => {
    const iconName = referencedObjectDef?.icon || "Package";
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Package;
    return IconComponent;
  };

  // Parse display columns from metadata
  const displayColumns = metadata?.displayColumns 
    ? metadata.displayColumns.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const handleRecordClick = () => {
    if (value && onRecordClick) {
      onRecordClick(value);
    }
  };

  // Merge label with metadata (explicit prop takes precedence like NumberField)
  const mergedLabel = label ?? metadata?.label;
  
  // Auto-generate testId based on mode if not provided (matches NumberField pattern)
  const mergedTestId = testId ?? (
    mode === "edit" ? metadata?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? metadata?.testIdView ?? (fieldCode ? `link-${fieldCode}` : undefined)
    : metadata?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  if (isLoadingMetadata) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (!metadata || metadata.type !== "LookupField") {
    return <div className="text-sm text-destructive">Invalid lookup field configuration</div>;
  }

  const IconComponent = getIconComponent();
  const primaryDisplayValue = selectedRecord?.[metadata.primaryDisplayField || "name"] || "";

  // View Mode - Display as clickable link with icon
  if (mode === "view") {
    return (
      <div className="space-y-2">
        {mergedLabel && (
          <FormLabel className="text-sm font-medium text-muted-foreground">
            {mergedLabel}
          </FormLabel>
        )}
        <div className="flex items-center gap-2">
          {isLoadingRecord ? (
            <Skeleton className="h-6 w-48" />
          ) : value && selectedRecord ? (
            <>
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-3 h-3 text-primary" />
              </div>
              <button
                onClick={handleRecordClick}
                className="text-primary hover:underline flex items-center gap-1 font-medium"
                data-testid={mergedTestId}
              >
                {primaryDisplayValue}
                <ExternalLink className="w-3 h-3" />
              </button>
            </>
          ) : (
            <span className="text-muted-foreground text-sm" data-testid={mergedTestId}>-</span>
          )}
        </div>
      </div>
    );
  }

  // Table Mode - Display icon and name inline
  if (mode === "table") {
    if (isLoadingRecord) {
      return <Skeleton className="h-6 w-32" />;
    }

    if (!value || !selectedRecord) {
      return <span className="text-muted-foreground text-sm" data-testid={mergedTestId}>-</span>;
    }

    // Render as clickable button if onRecordClick is provided
    if (onRecordClick) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-3 h-3 text-primary" />
          </div>
          <button
            onClick={handleRecordClick}
            className="font-medium text-sm text-primary hover:underline"
            data-testid={mergedTestId}
          >
            {primaryDisplayValue}
          </button>
        </div>
      );
    }

    // Otherwise render as plain text
    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-3 h-3 text-primary" />
        </div>
        <span className="font-medium text-sm" data-testid={mergedTestId}>{primaryDisplayValue}</span>
      </div>
    );
  }

  // Edit Mode - Click to open dialog, show X to clear
  return (
    <>
      <div className="space-y-2">
        {mergedLabel && (
          <FormLabel className="text-sm font-medium">
            {mergedLabel}
          </FormLabel>
        )}
        {metadata.helpText && (
          <p className="text-xs text-muted-foreground">{metadata.helpText}</p>
        )}
        <div
          className={`
            relative flex items-center gap-2 min-h-10 px-3 py-2 border rounded-md 
            ${disabled ? 'bg-muted cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}
            border-input
          `}
          onClick={() => !disabled && setIsDialogOpen(true)}
          data-testid={mergedTestId}
        >
          {isLoadingRecord ? (
            <Skeleton className="h-6 w-full" />
          ) : value && selectedRecord ? (
            <>
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-3 h-3 text-primary" />
              </div>
              <span className="flex-1 text-sm font-medium">{primaryDisplayValue}</span>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  data-testid={`button-clear-${fieldCode}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {metadata.placeHolder || `Select ${mergedLabel || referencedObjectDef?.labelSingular || "record"}...`}
            </span>
          )}
        </div>
      </div>

      {/* Lookup Dialog */}
      {metadata.referencedObject && metadata.primaryDisplayField && displayColumns.length > 0 && (
        <LookupDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelect={handleSelect}
          selectedRecordId={value}
          referencedObject={metadata.referencedObject}
          objectLabel={referencedObjectDef?.labelSingular || metadata.referencedObject}
          objectIcon={referencedObjectDef?.icon}
          primaryDisplayField={metadata.primaryDisplayField}
          displayColumns={displayColumns}
        />
      )}
    </>
  );
}
