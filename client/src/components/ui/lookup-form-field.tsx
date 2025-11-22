import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ExternalLink } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import LookupDialog from "@/components/ui/lookup-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormContext } from "react-hook-form";

interface LookupFormFieldProps {
  objectCode: string;
  fieldCode: string;
  formFieldName?: string;
  mode?: "view" | "edit" | "table";
  value?: string | null;
  onChange?: (value: string | null) => void;
  onRecordClick?: (recordId: string) => void;
  disabled?: boolean;
}

interface FieldMetadata {
  type: string;
  label?: string;
  helpText?: string;
  placeHolder?: string;
  referencedObject?: string;
  primaryDisplayField?: string;
  displayColumns?: string;
}

export default function LookupFormField({
  objectCode,
  fieldCode,
  formFieldName,
  mode = "edit",
  value,
  onChange,
  onRecordClick,
  disabled = false,
}: LookupFormFieldProps) {
  const formContext = useFormContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Determine which field name to use for form binding (defaults to fieldCode for backward compatibility)
  const formField = formFieldName || fieldCode;

  // Use form context if available, otherwise use props
  const fieldValue = formContext 
    ? (formContext.watch(formField) as string | undefined)
    : value;
  
  const setFieldValue = (newValue: string | null) => {
    if (formContext) {
      formContext.setValue(formField, newValue || "");
    }
    onChange?.(newValue);
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
    queryKey: [`/api/${metadata?.referencedObject}/${fieldValue}`],
    enabled: !!fieldValue && !!metadata?.referencedObject,
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

  const handleSelect = (record: any) => {
    setFieldValue(record.id);
  };

  const handleClear = () => {
    setFieldValue(null);
  };

  const handleRecordClick = () => {
    if (fieldValue && onRecordClick) {
      onRecordClick(fieldValue);
    }
  };

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
        {metadata.label && (
          <FormLabel className="text-sm font-medium text-muted-foreground">
            {metadata.label}
          </FormLabel>
        )}
        <div className="flex items-center gap-2">
          {isLoadingRecord ? (
            <Skeleton className="h-6 w-48" />
          ) : fieldValue && selectedRecord ? (
            <>
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-3 h-3 text-primary" />
              </div>
              <button
                onClick={handleRecordClick}
                className="text-primary hover:underline flex items-center gap-1 font-medium"
                data-testid={`link-${formField}`}
              >
                {primaryDisplayValue}
                <ExternalLink className="w-3 h-3" />
              </button>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
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

    if (!fieldValue || !selectedRecord) {
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-3 h-3 text-primary" />
        </div>
        <span className="font-medium text-sm">{primaryDisplayValue}</span>
      </div>
    );
  }

  // Edit Mode - Click to open dialog, show X to clear
  return (
    <>
      <div className="space-y-2">
        {metadata.label && formContext && (
          <FormLabel className="text-sm font-medium">
            {metadata.label}
          </FormLabel>
        )}
        {!formContext && metadata.label && (
          <label className="text-sm font-medium">{metadata.label}</label>
        )}
        {metadata.helpText && (
          <p className="text-xs text-muted-foreground">{metadata.helpText}</p>
        )}
        <div
          className={`
            relative flex items-center gap-2 min-h-10 px-3 py-2 border rounded-md 
            ${disabled ? 'bg-muted cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'}
            ${formContext?.formState.errors[formField] ? 'border-destructive' : 'border-input'}
          `}
          onClick={() => !disabled && setIsDialogOpen(true)}
          data-testid={`input-${formField}`}
        >
          {isLoadingRecord ? (
            <Skeleton className="h-6 w-full" />
          ) : fieldValue && selectedRecord ? (
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
                  data-testid={`button-clear-${formField}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              {metadata.placeHolder || `Select ${metadata.label || referencedObjectDef?.labelSingular || "record"}...`}
            </span>
          )}
        </div>
        {formContext && <FormMessage />}
      </div>

      {/* Lookup Dialog */}
      {metadata.referencedObject && metadata.primaryDisplayField && displayColumns.length > 0 && (
        <LookupDialog
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelect={handleSelect}
          selectedRecordId={fieldValue}
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
