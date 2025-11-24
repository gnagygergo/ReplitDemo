import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import { TextField } from "@/components/ui/text-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm, FormProvider } from "react-hook-form";
import { flattenXmlMetadata } from "@/lib/metadata-utils";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface NumberFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface NumberFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  helpText?: string;
  decimalPlaces?: number;
  step?: number;
  format?: string;
}

export function NumberFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: NumberFieldDetailProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<NumberFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });
  const hasLoadedMetadata = useRef(false);

  const formMethods = useForm();

  // Extract fieldCode from filePath (remove .field_meta.xml extension)
  const fieldCode = field.filePath.replace('.field_meta.xml', '');

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<NumberFieldMetadata>({
    queryKey: ["/api/object-fields", objectName, fieldCode],
    queryFn: async () => {
      const response = await fetch(
        `/api/object-fields/${objectName}/${fieldCode}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch field metadata");
      }
      const fieldData = await response.json();
      
      // Flatten and type-cast xml2js arrays (pass field type for context-aware casting)
      return flattenXmlMetadata(fieldData, field.type) as NumberFieldMetadata;
    },
  });

  useEffect(() => {
    if (metadata && !hasLoadedMetadata.current) {
      setFormData(metadata);
      hasLoadedMetadata.current = true;
    }
  }, [metadata]);

  const saveMutation = useMutation({
    mutationFn: async (data: NumberFieldMetadata) => {
      // Convert numeric values to strings for XML serialization
      // Normalize format to lowercase
      const xmlData = {
        ...data,
        decimalPlaces: data.decimalPlaces !== undefined ? String(data.decimalPlaces) : undefined,
        step: data.step !== undefined ? String(data.step) : undefined,
        format: data.format?.toLowerCase() || "number",
      };
      
      const response = await fetch(
        `/api/object-fields/${objectName}/${fieldCode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ FieldDefinition: xmlData }),
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
              mode="view"
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

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              mode={isEditing ? "edit" : "view"}
              value={formData.decimalPlaces ?? null}
              onChange={(val) => setFormData({ ...formData, decimalPlaces: val !== null ? val : undefined })}
              label="Decimal Places"
              data-testid="input-decimal-places"
              decimals={0}
            />
            <NumberField
              mode={isEditing ? "edit" : "view"}
              value={formData.step ?? null}
              onChange={(val) => setFormData({ ...formData, step: val !== null ? val : undefined })}
              label="Step"
              data-testid="input-step"
            />
          </div>

          <div className="space-y-2">
            <FormLabel className="text-muted-foreground">Format</FormLabel>
            <Select
              value={
                formData.format === "percentage" || formData.format === "Percentage"
                  ? "Percentage"
                  : "Number"
              }
              onValueChange={(value) => {
                const lowercaseValue = value.toLowerCase();
                setFormData({ ...formData, format: lowercaseValue });
              }}
              disabled={!isEditing}
            >
              <SelectTrigger data-testid="select-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Number">Number</SelectItem>
                <SelectItem value="Percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
          <NumberField
            mode="edit"
            value={null}
            label={formData.label || field.label}
            placeholder="0.00"
            decimals={formData.decimalPlaces}
            step={formData.step}
            format={(formData.format?.toLowerCase() === "percentage" ? "percentage" : "number") as "number" | "percentage"}
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
