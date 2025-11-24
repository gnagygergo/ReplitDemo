import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { NumberField } from "@/components/ui/number-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm, FormProvider } from "react-hook-form";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface TextFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface TextFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  subtype?: string;
  maxLength?: number;
  defaultValue?: string;
  required?: boolean;
  helpText?: string;
  placeHolder?: string;
  visibleLinesInView?: number;
  visibleLinesInEdit?: number;
  copyAble?: boolean;
}

export function TextFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: TextFieldDetailProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<TextFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  // Create a form context even though we manage state manually
  // This is needed because field components use FormLabel/FormControl internally
  const formMethods = useForm();

  // Extract fieldCode from filePath (remove .field_meta.xml extension)
  const fieldCode = field.filePath.replace('.field_meta.xml', '');

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<TextFieldMetadata>({
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

  // Mutation to save field metadata
  const saveMutation = useMutation({
    mutationFn: async (data: TextFieldMetadata) => {
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
      // Invalidate queries to refresh data
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
            <TextField
              mode="view"
              value={formData.subtype || ""}
              onChange={(val) => setFormData({ ...formData, subtype: val })}
              label="Subtype"
              placeholder="text, email, url, password"
              data-testid="input-subtype"
            />
            <NumberField
              mode={isEditing ? "edit" : "view"}
              value={formData.maxLength || null}
              onChange={(val) => setFormData({ ...formData, maxLength: val || undefined })}
              label="Max Length"
              data-testid="input-max-length"
              decimals={0}
            />
          </div>

          <TextField
            mode={isEditing ? "edit" : "view"}
            value={formData.helpText || ""}
            onChange={(val) => setFormData({ ...formData, helpText: val })}
            label="Help Text"
            data-testid="input-help-text"
          />

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              mode={isEditing ? "edit" : "view"}
              value={formData.visibleLinesInView || null}
              onChange={(val) => setFormData({ ...formData, visibleLinesInView: val || undefined })}
              label="Visible Lines in View"
              data-testid="input-visible-lines-view"
              decimals={0}
            />
            <NumberField
              mode={isEditing ? "edit" : "view"}
              value={formData.visibleLinesInEdit || null}
              onChange={(val) => setFormData({ ...formData, visibleLinesInEdit: val || undefined })}
              label="Visible Lines in Edit"
              data-testid="input-visible-lines-edit"
              decimals={0}
            />
          </div>

          <CheckboxField
            mode={isEditing ? "edit" : "view"}
            value={formData.copyAble || false}
            onChange={(val) => setFormData({ ...formData, copyAble: val })}
            label="Copy-able"
            data-testid="input-copyable"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Field Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <TextField
            mode="edit"
            value=""
            label={formData.label || field.label}
            placeholder={formData.placeHolder || `Example ${formData.subtype || 'text'} field...`}
            type={(formData.subtype as any) || "text"}
            maxLength={formData.maxLength}
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
