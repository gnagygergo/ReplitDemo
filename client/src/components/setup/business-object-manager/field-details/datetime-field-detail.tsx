import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimeField } from "@/components/ui/date-time-field";
import { TextField } from "@/components/ui/text-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { useForm, FormProvider } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  const { toast } = useToast();
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

  // Mutation to save field metadata
  const saveMutation = useMutation({
    mutationFn: async (data: DateTimeFieldMetadata) => {
      const response = await fetch(
        `/api/metadata/companies/[companyId]/objects/${objectName}/fields/${field.filePath}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ FieldDefinition: data }),
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
      queryClient.invalidateQueries({ queryKey: ["/api/metadata", objectName, "fields", field.filePath] });
      
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

          <div className="space-y-2">
            <FormLabel className="text-muted-foreground">Field Type</FormLabel>
            <Select
              value={formData.fieldType || "DateTime"}
              onValueChange={(value) => setFormData({ ...formData, fieldType: value })}
            >
              <SelectTrigger disabled={!isEditing} data-testid="select-field-type">
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Date">Date</SelectItem>
                <SelectItem value="Time">Time</SelectItem>
                <SelectItem value="DateTime">DateTime</SelectItem>
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
