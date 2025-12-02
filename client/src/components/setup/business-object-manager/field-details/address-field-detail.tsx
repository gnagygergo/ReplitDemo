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

interface AddressFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface AddressFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  subtype?: string;
  maxLength?: string | number | null;
  defaultValue?: string;
  required?: boolean;
  helpText?: string;
  placeHolder?: string;
  visibleLinesInView?: string | number | null;
  visibleLinesInEdit?: string | number | null;
  copyAble?: boolean;
  streetAddressColumn?: string;
  cityColumn?: string;
  stateProvinceColumn?: string;
  zipCodeColumn?: string;
  countryColumn?: string;
}

export function AddressFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: AddressFieldDetailProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<AddressFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  const formMethods = useForm();

  const fieldCode = field.filePath.replace('.field_meta.xml', '');

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  const { data: metadata, isLoading } = useQuery<AddressFieldMetadata>({
    queryKey: ["/api/object-fields", objectName, fieldCode],
    queryFn: async () => {
      const response = await fetch(
        `/api/object-fields/${objectName}/${fieldCode}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch field metadata");
      }
      return await response.json();
    },
  });

  useEffect(() => {
    if (metadata) {
      setFormData(metadata);
    }
  }, [metadata]);

  const saveMutation = useMutation({
    mutationFn: async (data: AddressFieldMetadata) => {
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
            <CardTitle>Database Column Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                mode="view"
                value={formData.streetAddressColumn || ""}
                onChange={() => {}}
                label="Street Address Column"
                data-testid="input-street-address-column"
              />
              <TextField
                mode="view"
                value={formData.cityColumn || ""}
                onChange={() => {}}
                label="City Column"
                data-testid="input-city-column"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TextField
                mode="view"
                value={formData.stateProvinceColumn || ""}
                onChange={() => {}}
                label="State/Province Column"
                data-testid="input-state-province-column"
              />
              <TextField
                mode="view"
                value={formData.zipCodeColumn || ""}
                onChange={() => {}}
                label="Zip Code Column"
                data-testid="input-zip-code-column"
              />
            </div>

            <TextField
              mode="view"
              value={formData.countryColumn || ""}
              onChange={() => {}}
              label="Country Column"
              data-testid="input-country-column"
            />
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
