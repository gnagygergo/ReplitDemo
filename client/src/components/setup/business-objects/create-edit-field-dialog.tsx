import { useState, useEffect, useLayoutEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const textFieldSchema = z.object({
  type: z.literal("TextField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  subtype: z.enum(["text", "email", "phone", "url"]),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  maxLength: z.string().optional(),
  copyAble: z.boolean().optional(),
  truncate: z.boolean().optional(),
  visibleLinesInView: z.string().optional(),
  visibleLinesInEdit: z.string().optional(),
});

const numberFieldSchema = z.object({
  type: z.literal("NumberField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  step: z.string().optional().refine(
    (val) => !val || !isNaN(Number(val)),
    { message: "Step must be a valid number" }
  ),
  format: z.enum(["Integer", "Decimal", "Currency", "Percentage"]).optional(),
  decimalPlaces: z.string().optional().refine(
    (val) => {
      if (!val) return true; // Optional field
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 10;
    },
    { message: "Decimal places must be a number between 0 and 10" }
  ),
});

const dateTimeFieldSchema = z.object({
  type: z.literal("DateTimeField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  fieldType: z.enum(["Date", "Time", "DateTime"]),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
});

const picklistFieldSchema = z.object({
  type: z.literal("PicklistField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
});

const formSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  dateTimeFieldSchema,
  picklistFieldSchema,
]);

type FormData = z.infer<typeof formSchema>;
type TextFieldFormData = z.infer<typeof textFieldSchema>;
type NumberFieldFormData = z.infer<typeof numberFieldSchema>;
type DateTimeFieldFormData = z.infer<typeof dateTimeFieldSchema>;
type PicklistFieldFormData = z.infer<typeof picklistFieldSchema>;

interface CreateEditFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectName: string;
  fieldToEdit?: {
    type: string;
    apiCode: string;
    label: string;
    filePath: string;
  } | null;
}

export function CreateEditFieldDialog({
  open,
  onOpenChange,
  objectName,
  fieldToEdit,
}: CreateEditFieldDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize step based on whether we're editing or creating
  const [step, setStep] = useState<"fieldType" | "subtype" | "form">(() => 
    fieldToEdit ? "form" : "fieldType"
  );
  const [selectedFieldType, setSelectedFieldType] = useState<string>(() =>
    fieldToEdit?.type || ""
  );

  // Helper to get default values based on field type
  const getDefaultValues = (type: string): any => {
    switch (type) {
      case "TextField":
        return {
          type: "TextField" as const,
          apiCode: "",
          label: "",
          subtype: "text" as const,
          helpText: "",
          placeHolder: "",
          maxLength: "",
          copyAble: false,
          truncate: false,
          visibleLinesInView: "",
          visibleLinesInEdit: "",
        };
      case "NumberField":
        return {
          type: "NumberField" as const,
          apiCode: "",
          label: "",
          helpText: "",
          placeHolder: "",
          step: "",
          format: "Decimal" as const,
          decimalPlaces: "2",
        };
      case "DateTimeField":
        return {
          type: "DateTimeField" as const,
          apiCode: "",
          label: "",
          fieldType: "Date" as const,
          helpText: "",
          placeHolder: "",
        };
      case "PicklistField":
        return {
          type: "PicklistField" as const,
          apiCode: "",
          label: "",
          helpText: "",
          placeHolder: "",
        };
      default:
        return {
          type: "TextField" as const,
          apiCode: "",
          label: "",
          subtype: "text" as const,
          helpText: "",
          placeHolder: "",
        };
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(selectedFieldType || "TextField"),
  });

  // Sync state when dialog opens or mode changes (before paint)
  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    if (fieldToEdit) {
      setSelectedFieldType(fieldToEdit.type);
      setStep("form");
    } else {
      setStep("fieldType");
      setSelectedFieldType("");
      form.reset(getDefaultValues("TextField"));
    }
  }, [open, fieldToEdit, form]);

  // Load field data for editing (after paint is fine)
  useEffect(() => {
    if (!open || !fieldToEdit) {
      return;
    }

    fetch(`/api/object-fields/${objectName}/${fieldToEdit.apiCode}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const fieldType = data.type || fieldToEdit.type;
        
        if (fieldType === "TextField") {
          form.reset({
            type: "TextField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            subtype: data.subtype || "text",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            maxLength: data.maxLength || "",
            copyAble: data.copyAble === "true" || data.copyAble === true,
            truncate: data.truncate === "true" || data.truncate === true,
            visibleLinesInView: data.visibleLinesInView || "",
            visibleLinesInEdit: data.visibleLinesInEdit || "",
          });
        } else if (fieldType === "NumberField") {
          form.reset({
            type: "NumberField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            step: data.step || "",
            format: data.format || "Decimal",
            decimalPlaces: data.decimalPlaces || "2",
          });
        } else if (fieldType === "DateTimeField") {
          form.reset({
            type: "DateTimeField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            fieldType: data.fieldType || "Date",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
          });
        } else if (fieldType === "PicklistField") {
          form.reset({
            type: "PicklistField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
          });
        }
      })
      .catch((error) => {
        console.error("Error loading field data:", error);
        toast({
          title: "Error",
          description: "Failed to load field data for editing",
          variant: "destructive",
        });
      });
  }, [open, fieldToEdit, objectName, form, toast]);

  const createFieldMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = { ...data };
      
      // Transform boolean values to strings for TextField
      if (data.type === "TextField") {
        payload.copyAble = data.copyAble?.toString() || "false";
        payload.truncate = data.truncate?.toString() || "false";
      }
      
      return apiRequest("POST", `/api/object-fields/${objectName}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/object-fields", objectName] });
      toast({
        title: "Success",
        description: "Field created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create field",
        variant: "destructive",
      });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = { ...data };
      
      // Transform boolean values to strings for TextField
      if (data.type === "TextField") {
        payload.copyAble = data.copyAble?.toString() || "false";
        payload.truncate = data.truncate?.toString() || "false";
      }
      
      return apiRequest("PUT", `/api/object-fields/${objectName}/${fieldToEdit?.apiCode}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/object-fields", objectName] });
      toast({
        title: "Success",
        description: "Field updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update field",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (fieldToEdit) {
      updateFieldMutation.mutate(data);
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const handleFieldTypeSelect = (fieldType: string) => {
    setSelectedFieldType(fieldType);
    // Reset form with appropriate defaults for the selected field type
    form.reset(getDefaultValues(fieldType));
  };

  const handleSubtypeSelect = (subtype: string) => {
    if (selectedFieldType === "TextField") {
      form.setValue("subtype", subtype as "text" | "email" | "phone" | "url");
    } else if (selectedFieldType === "DateTimeField") {
      form.setValue("fieldType", subtype as "Date" | "Time" | "DateTime");
    }
  };

  const handleNext = () => {
    if (step === "fieldType") {
      if (!selectedFieldType) {
        toast({
          title: "Selection Required",
          description: "Please select a field type to continue",
          variant: "destructive",
        });
        return;
      }
      
      // TextField and DateTimeField need subtype selection
      if (selectedFieldType === "TextField" || selectedFieldType === "DateTimeField") {
        setStep("subtype");
      } 
      // NumberField and PicklistField skip directly to form
      else if (selectedFieldType === "NumberField" || selectedFieldType === "PicklistField") {
        setStep("form");
      }
      // Other field types show coming soon message
      else {
        toast({
          title: "Coming Soon",
          description: `${selectedFieldType} creation will be available in a future update`,
        });
      }
    } else if (step === "subtype") {
      setStep("form");
    }
  };

  const handleBack = () => {
    if (step === "form") {
      // TextField and DateTimeField go back to subtype selection
      if (selectedFieldType === "TextField" || selectedFieldType === "DateTimeField") {
        setStep("subtype");
      } else {
        // NumberField and PicklistField go back to field type selection
        setStep("fieldType");
      }
    } else if (step === "subtype") {
      setStep("fieldType");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setStep("fieldType");
      setSelectedFieldType("");
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fieldToEdit ? "Edit Field" : "Add New Field"}
          </DialogTitle>
          <DialogDescription>
            {step === "fieldType" && "Select the type of field you want to create"}
            {step === "subtype" && selectedFieldType === "TextField" && "Select the subtype for the text field"}
            {step === "subtype" && selectedFieldType === "DateTimeField" && "Select the type of date/time field"}
            {step === "form" && "Configure the field properties"}
          </DialogDescription>
        </DialogHeader>

        {step === "fieldType" && (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedFieldType}
              onValueChange={handleFieldTypeSelect}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="TextField" id="type-text" data-testid="radio-field-type-text" />
                <Label htmlFor="type-text" className="font-normal cursor-pointer">
                  Simple Text Field, Email, Phone or Hyperlink (URL)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NumberField" id="type-number" data-testid="radio-field-type-number" />
                <Label htmlFor="type-number" className="font-normal cursor-pointer">
                  Number field
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AmountField" id="type-amount" data-testid="radio-field-type-amount" />
                <Label htmlFor="type-amount" className="font-normal cursor-pointer">
                  Amount field with currency support
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DateTimeField" id="type-datetime" data-testid="radio-field-type-datetime" />
                <Label htmlFor="type-datetime" className="font-normal cursor-pointer">
                  Date, Time or Date and Time field
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PicklistField" id="type-picklist" data-testid="radio-field-type-picklist" />
                <Label htmlFor="type-picklist" className="font-normal cursor-pointer">
                  Single select or multiselect picklist field
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LookupField" id="type-lookup" data-testid="radio-field-type-lookup" />
                <Label htmlFor="type-lookup" className="font-normal cursor-pointer">
                  Lookup relationship field
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FormulaField" id="type-formula" data-testid="radio-field-type-formula" />
                <Label htmlFor="type-formula" className="font-normal cursor-pointer">
                  Formula field
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === "subtype" && selectedFieldType === "TextField" && (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={form.watch("subtype")}
              onValueChange={handleSubtypeSelect}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="subtype-text" data-testid="radio-subtype-text" />
                <Label htmlFor="subtype-text" className="font-normal cursor-pointer">
                  Text
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="subtype-email" data-testid="radio-subtype-email" />
                <Label htmlFor="subtype-email" className="font-normal cursor-pointer">
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="subtype-phone" data-testid="radio-subtype-phone" />
                <Label htmlFor="subtype-phone" className="font-normal cursor-pointer">
                  Phone
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="subtype-url" data-testid="radio-subtype-url" />
                <Label htmlFor="subtype-url" className="font-normal cursor-pointer">
                  URL
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === "subtype" && selectedFieldType === "DateTimeField" && (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={form.watch("fieldType")}
              onValueChange={handleSubtypeSelect}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Date" id="fieldtype-date" data-testid="radio-fieldtype-date" />
                <Label htmlFor="fieldtype-date" className="font-normal cursor-pointer">
                  Date
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Time" id="fieldtype-time" data-testid="radio-fieldtype-time" />
                <Label htmlFor="fieldtype-time" className="font-normal cursor-pointer">
                  Time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DateTime" id="fieldtype-datetime" data-testid="radio-fieldtype-datetime" />
                <Label htmlFor="fieldtype-datetime" className="font-normal cursor-pointer">
                  Date and Time
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === "form" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Common Fields for All Types */}
            <div className="space-y-2">
              <Label htmlFor="apiCode" className="text-muted-foreground">
                API Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apiCode"
                data-testid="input-api-code"
                {...form.register("apiCode")}
                disabled={!!fieldToEdit}
                placeholder="e.g., customerEmail"
              />
              {form.formState.errors.apiCode && (
                <p className="text-sm text-destructive">{form.formState.errors.apiCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-muted-foreground">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="label"
                data-testid="input-label"
                {...form.register("label")}
                placeholder="e.g., Customer Email"
              />
              {form.formState.errors.label && (
                <p className="text-sm text-destructive">{form.formState.errors.label.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="helpText" className="text-muted-foreground">
                Help Text
              </Label>
              <Textarea
                id="helpText"
                data-testid="input-help-text"
                {...form.register("helpText")}
                placeholder="Provide guidance to users"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeHolder" className="text-muted-foreground">
                Placeholder
              </Label>
              <Input
                id="placeHolder"
                data-testid="input-placeholder"
                {...form.register("placeHolder")}
                placeholder="e.g., Enter email address"
              />
            </div>

            {/* TextField-Specific Fields */}
            {selectedFieldType === "TextField" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxLength" className="text-muted-foreground">
                      Max Length
                    </Label>
                    <Input
                      id="maxLength"
                      data-testid="input-max-length"
                      type="number"
                      {...form.register("maxLength")}
                      placeholder="e.g., 255"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibleLinesInView" className="text-muted-foreground">
                      Visible Lines in View Mode
                    </Label>
                    <Input
                      id="visibleLinesInView"
                      data-testid="input-visible-lines-view"
                      type="number"
                      min="1"
                      max="10"
                      {...form.register("visibleLinesInView")}
                      placeholder="1-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="visibleLinesInEdit" className="text-muted-foreground">
                      Visible Lines in Edit Mode
                    </Label>
                    <Input
                      id="visibleLinesInEdit"
                      data-testid="input-visible-lines-edit"
                      type="number"
                      min="1"
                      max="10"
                      {...form.register("visibleLinesInEdit")}
                      placeholder="1-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="copyAble"
                      data-testid="checkbox-copyable"
                      checked={form.watch("copyAble")}
                      onCheckedChange={(checked) => form.setValue("copyAble", checked === true)}
                    />
                    <Label htmlFor="copyAble" className="font-normal cursor-pointer">
                      Copy-able (Show copy to clipboard button)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="truncate"
                      data-testid="checkbox-truncate"
                      checked={form.watch("truncate")}
                      onCheckedChange={(checked) => form.setValue("truncate", checked === true)}
                    />
                    <Label htmlFor="truncate" className="font-normal cursor-pointer">
                      Truncate long text with ellipsis
                    </Label>
                  </div>
                </div>
              </>
            )}

            {/* NumberField-Specific Fields */}
            {selectedFieldType === "NumberField" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="step" className="text-muted-foreground">
                      Step
                    </Label>
                    <Input
                      id="step"
                      data-testid="input-step"
                      type="number"
                      {...form.register("step")}
                      placeholder="e.g., 1 or 0.01"
                    />
                    {"step" in form.formState.errors && form.formState.errors.step && (
                      <p className="text-sm text-destructive">{form.formState.errors.step.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="decimalPlaces" className="text-muted-foreground">
                      Decimal Places
                    </Label>
                    <Input
                      id="decimalPlaces"
                      data-testid="input-decimal-places"
                      type="number"
                      min="0"
                      max="10"
                      {...form.register("decimalPlaces")}
                      placeholder="e.g., 2"
                    />
                    {"decimalPlaces" in form.formState.errors && form.formState.errors.decimalPlaces && (
                      <p className="text-sm text-destructive">{form.formState.errors.decimalPlaces.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format" className="text-muted-foreground">
                    Format
                  </Label>
                  <Select
                    value={form.watch("format")}
                    onValueChange={(value) => form.setValue("format", value as "Integer" | "Decimal" | "Currency" | "Percentage")}
                  >
                    <SelectTrigger id="format" data-testid="select-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Integer">Integer</SelectItem>
                      <SelectItem value="Decimal">Decimal</SelectItem>
                      <SelectItem value="Currency">Currency</SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* DateTimeField-Specific Fields - Type selector only if not coming from subtype */}
            {selectedFieldType === "DateTimeField" && (
              <div className="space-y-2">
                <Label htmlFor="fieldType" className="text-muted-foreground">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.watch("fieldType")}
                  onValueChange={(value) => form.setValue("fieldType", value as "Date" | "Time" | "DateTime")}
                >
                  <SelectTrigger id="fieldType" data-testid="select-field-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Date">Date</SelectItem>
                    <SelectItem value="Time">Time</SelectItem>
                    <SelectItem value="DateTime">Date and Time</SelectItem>
                  </SelectContent>
                </Select>
                {"fieldType" in form.formState.errors && form.formState.errors.fieldType && (
                  <p className="text-sm text-destructive">{form.formState.errors.fieldType.message}</p>
                )}
              </div>
            )}

            {/* PicklistField - No additional fields beyond common ones */}
          </form>
        )}

        <DialogFooter>
          {step !== "fieldType" && !fieldToEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              data-testid="button-back"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogClose(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          {(step === "fieldType" || step === "subtype") && !fieldToEdit && (
            <Button
              type="button"
              onClick={handleNext}
              data-testid="button-next"
            >
              Next
            </Button>
          )}
          {step === "form" && (
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
              data-testid="button-save"
            >
              {createFieldMutation.isPending || updateFieldMutation.isPending
                ? "Saving..."
                : fieldToEdit
                ? "Update Field"
                : "Create Field"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
