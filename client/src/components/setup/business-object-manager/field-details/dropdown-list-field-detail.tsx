import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm, FormProvider } from "react-hook-form";
import { DropDownListFieldTypeEditor } from "../dropdown-list-field-type-editor";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface DropDownListFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface DropDownListFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  picklistName?: string;
  defaultValue?: string;
  required?: boolean;
  helpText?: string;
  sourceType?: string;
  sourcePath?: string;
}

export function DropDownListFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: DropDownListFieldDetailProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<DropDownListFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  const formMethods = useForm();

  // Extract fieldCode from filePath (remove .field_meta.xml extension)
  const fieldCode = field.filePath.replace('.field_meta.xml', '');

  // Construct the full metadata path for globalMetadata source type
  // sourcePath from field metadata is like "global_value_sets/industries"
  // We need to construct: "companies/[companyId]/global_value_sets/industries.globalValueSet-meta.xml"
  const getGlobalValueSetPath = (sourcePath: string): string => {
    // Remove any existing extension if present
    const pathWithoutExt = sourcePath.replace(/\.globalValueSet-meta\.xml$/i, '');
    return `companies/[companyId]/${pathWithoutExt}.globalValueSet-meta.xml`;
  };

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<DropDownListFieldMetadata>({
    queryKey: ["/api/object-fields", objectName, fieldCode],
    queryFn: async () => {
      const response = await fetch(
        `/api/object-fields/${objectName}/${fieldCode}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch field metadata");
      }
      // API already returns flattened data, no need to flatten again
      return await response.json();
    },
  });

  useEffect(() => {
    if (metadata) {
      setFormData(metadata);
    }
  }, [metadata]);

  const saveMutation = useMutation({
    mutationFn: async (data: DropDownListFieldMetadata) => {
      const response = await fetch(
        `/api/object-fields/${objectName}/${fieldCode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save field metadata");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/object-fields", objectName] });
      queryClient.invalidateQueries({ queryKey: ["/api/object-fields", objectName, fieldCode] });
      toast({
        title: "Field saved",
        description: "Field definition has been updated successfully.",
      });
      onSave();
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              data-testid="button-back-to-list"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Field List
            </Button>
            <h3 className="text-lg font-semibold" data-testid="text-field-title">
              {field.label} ({field.type})
            </h3>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(metadata || formData);
                  onCancel();
                }}
                disabled={saveMutation.isPending}
                data-testid="button-cancel-edit"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-field"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              data-testid="button-edit-field"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              mode={isEditing ? "edit" : "view"}
              value={formData.apiCode}
              onChange={(val) => setFormData({ ...formData, apiCode: val })}
              label="API Code"
              data-testid="input-api-code"
            />
            <TextField
              mode={isEditing ? "edit" : "view"}
              value={formData.label || ""}
              onChange={(val) => setFormData({ ...formData, label: val })}
              label="Label"
              data-testid="input-label"
            />
          </div>

          <TextField
            mode={isEditing ? "edit" : "view"}
            value={formData.picklistName || ""}
            onChange={(val) => setFormData({ ...formData, picklistName: val })}
            label="Picklist Name"
            data-testid="input-picklist-name"
          />

          <TextField
            mode={isEditing ? "edit" : "view"}
            value={formData.defaultValue || ""}
            onChange={(val) => setFormData({ ...formData, defaultValue: val })}
            label="Default Value"
            data-testid="input-default-value"
          />

          <TextField
            mode={isEditing ? "edit" : "view"}
            value={formData.helpText || ""}
            onChange={(val) => setFormData({ ...formData, helpText: val })}
            label="Help Text"
            data-testid="input-help-text"
          />

          <CheckboxField
            mode={isEditing ? "edit" : "view"}
            value={formData.required || false}
            onChange={(val) => setFormData({ ...formData, required: val })}
            label="Required Field"
            data-testid="input-required"
          />
        </CardContent>
      </Card>

      {/* Show Dropdown List Values editor for globalMetadata source type */}
      {formData.sourceType === "globalMetadata" && formData.sourcePath && (
        <DropDownListFieldTypeEditor
          sourceType="metadata"
          sourcePath={getGlobalValueSetPath(formData.sourcePath)}
          title="Dropdown List Values"
          description="Manage the values available in this dropdown field"
          rootKey="GlobalValueSet"
          itemKey="customValue"
        />
      )}
    </div>
    </FormProvider>
  );
}
