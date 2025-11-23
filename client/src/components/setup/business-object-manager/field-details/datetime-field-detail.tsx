import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimeField } from "@/components/ui/date-time-field";
import { TextField } from "@/components/ui/text-field";
import { useForm, FormProvider } from "react-hook-form";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface DateTimeFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface DateTimeFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  fieldType?: string;
  helpText?: string;
}

export function DateTimeFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: DateTimeFieldDetailProps) {
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<DateTimeFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  const formMethods = useForm();

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<DateTimeFieldMetadata>({
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
            value={formData.fieldType || ""}
            onChange={(val) => setFormData({ ...formData, fieldType: val })}
            label="Field Type"
            placeholder="Date, Time, or DateTime"
            data-testid="input-field-type"
          />

          <TextField
            mode={isEditing ? "edit" : "view"}
            value={formData.helpText || ""}
            onChange={(val) => setFormData({ ...formData, helpText: val })}
            label="Help Text"
            data-testid="input-help-text"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <DateTimeField
            mode="edit"
            value={null}
            label={formData.label || field.label}
            fieldType={(formData.fieldType as any) || "DateTime"}
            data-testid="preview-field"
          />
          <p className="text-sm text-muted-foreground mt-2">
            This is how the field will appear in forms
          </p>
        </CardContent>
      </Card>
      </div>
    </FormProvider>
  );
}
