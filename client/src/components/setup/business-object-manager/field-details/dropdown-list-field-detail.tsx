import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropDownListField } from "@/components/ui/dropdown-list-field";
import { TextField } from "@/components/ui/text-field";
import { CheckboxField } from "@/components/ui/checkbox-field";

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
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<DropDownListFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<DropDownListFieldMetadata>({
    queryKey: ["/api/metadata", objectName, "fields", field.filePath],
    queryFn: async () => {
      const response = await fetch(
        `/api/metadata/${objectName}/fields/${field.filePath}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch field metadata");
      }
      const xmlData = await response.json();
      return xmlData.FieldDefinition || {};
    },
  });

  useEffect(() => {
    if (metadata) {
      setFormData(metadata);
    }
  }, [metadata]);

  const handleSave = async () => {
    console.log("Saving field:", formData);
    onSave();
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
              data-testid="button-cancel-edit"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              data-testid="button-save-field"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
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

      <Card>
        <CardHeader>
          <CardTitle>Field Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <DropDownListField
            mode="edit"
            value=""
            onValueChange={() => {}}
            label={formData.label || field.label}
            sourceType="metadata"
            sourcePath={formData.picklistName || "sample_picklist"}
            data-testid="preview-field"
          />
          <p className="text-sm text-muted-foreground mt-2">
            This is how the field will appear in forms
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
