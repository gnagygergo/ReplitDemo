import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface FieldDefinition {
  type: string;
  apiCode: string;
  label: string;
  filePath: string;
}

interface LookupFieldDetailProps {
  field: FieldDefinition;
  objectName: string;
  mode: 'view' | 'edit';
  onBack: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

interface LookupFieldMetadata {
  type: string;
  apiCode: string;
  label: string;
  referencedObject?: string;
  primaryDisplayField?: string;
  displayColumns?: string[];
  helpText?: string;
}

export function LookupFieldDetail({
  field,
  objectName,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
}: LookupFieldDetailProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [formData, setFormData] = useState<LookupFieldMetadata>({
    type: field.type,
    apiCode: field.apiCode,
    label: field.label,
  });

  const formMethods = useForm();

  useEffect(() => {
    setIsEditing(mode === 'edit');
  }, [mode]);

  // Fetch available objects for Referenced Object dropdown
  const { data: availableObjects = [] } = useQuery<Array<{
    apiCode: string;
    labelPlural: string;
    labelSingular: string;
    iconSet: string;
    icon: string;
  }>>({
    queryKey: ["/api/object-definitions"],
  });

  // Fetch fields for the selected referenced object
  const { data: objectFields = [] } = useQuery<Array<{
    type: string;
    apiCode: string;
    label: string;
    filePath: string;
  }>>({
    queryKey: ["/api/object-fields", formData.referencedObject],
    enabled: !!formData.referencedObject,
  });

  const { data: metadata, isLoading } = useQuery<LookupFieldMetadata>({
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
    mutationFn: async (data: LookupFieldMetadata) => {
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
            <Label htmlFor="referencedObject" className="text-muted-foreground">
              Referenced Object
            </Label>
            {isEditing ? (
              <Select
                value={formData.referencedObject || ""}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    referencedObject: value,
                    primaryDisplayField: "",
                    displayColumns: [],
                  });
                }}
              >
                <SelectTrigger id="referencedObject" data-testid="select-referenced-object">
                  <SelectValue placeholder="Select an object..." />
                </SelectTrigger>
                <SelectContent>
                  {availableObjects.map((obj) => (
                    <SelectItem key={obj.apiCode} value={obj.apiCode}>
                      {obj.labelSingular}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm py-2">
                {formData.referencedObject || "-"}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryDisplayField" className="text-muted-foreground">
              Primary Display Field
            </Label>
            {isEditing ? (
              <Select
                value={formData.primaryDisplayField || ""}
                onValueChange={(value) => {
                  setFormData({ ...formData, primaryDisplayField: value });
                }}
                disabled={!formData.referencedObject}
              >
                <SelectTrigger id="primaryDisplayField" data-testid="select-primary-display-field">
                  <SelectValue placeholder="Select field to display..." />
                </SelectTrigger>
                <SelectContent>
                  {objectFields.map((field) => (
                    <SelectItem key={field.apiCode} value={field.apiCode}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm py-2">
                {formData.primaryDisplayField || "-"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              This field will be displayed as the record name in view and edit modes
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">
              Display Columns (Select up to 5)
            </Label>
            {isEditing ? (
              <div className="space-y-2 border rounded-md p-4 max-h-64 overflow-y-auto">
                {formData.referencedObject && objectFields.length > 0 ? (
                  objectFields.map((field) => {
                    const selectedColumns = formData.displayColumns || [];
                    const isSelected = selectedColumns.includes(field.apiCode);
                    const isDisabled = !isSelected && selectedColumns.length >= 5;

                    return (
                      <div key={field.apiCode} className="flex items-center space-x-2">
                        <Checkbox
                          id={`column-${field.apiCode}`}
                          checked={isSelected}
                          disabled={isDisabled}
                          onCheckedChange={(checked) => {
                            const currentColumns = formData.displayColumns || [];
                            if (checked) {
                              setFormData({
                                ...formData,
                                displayColumns: [...currentColumns, field.apiCode],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                displayColumns: currentColumns.filter((c) => c !== field.apiCode),
                              });
                            }
                          }}
                          data-testid={`checkbox-column-${field.apiCode}`}
                        />
                        <Label
                          htmlFor={`column-${field.apiCode}`}
                          className={`font-normal cursor-pointer ${isDisabled ? 'text-muted-foreground' : ''}`}
                        >
                          {field.label} ({field.type})
                        </Label>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a referenced object first
                  </p>
                )}
              </div>
            ) : (
              <div className="text-sm py-2">
                {formData.displayColumns && formData.displayColumns.length > 0
                  ? formData.displayColumns.join(", ")
                  : "-"}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Selected columns ({(formData.displayColumns || []).length}/5) will appear in the lookup dialog table
            </p>
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
          <p className="text-sm text-muted-foreground mb-4">
            Lookup field configuration summary
          </p>
          <div className="p-4 border rounded-md bg-muted/50 space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Label</p>
              <p className="text-sm">{formData.label || field.label}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Referenced Object</p>
              <p className="text-sm">{formData.referencedObject || "Not configured"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Primary Display Field</p>
              <p className="text-sm">{formData.primaryDisplayField || "Not configured"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Display Columns</p>
              <p className="text-sm">
                {formData.displayColumns && formData.displayColumns.length > 0
                  ? formData.displayColumns.join(", ")
                  : "Not configured"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </FormProvider>
  );
}
