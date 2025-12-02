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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  format: z.enum(["Number", "Percentage"]).optional(),
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

const dropDownListFieldSchema = z.object({
  type: z.literal("DropDownListField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  subtype: z.enum(["singleSelect", "multiSelect"]),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  sourceType: z.enum(["UniversalMetadata", "GlobalMetadata"]),
  sourcePath: z.string().min(1, "Source path is required"),
  showSearch: z.boolean().optional(),
  rootKey: z.string().optional(),
  itemKey: z.string().optional(),
});

const checkboxFieldSchema = z.object({
  type: z.literal("CheckboxField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  defaultValue: z.enum(["true", "false"]).optional(),
});

const addressFieldSchema = z.object({
  type: z.literal("AddressField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  streetAddressColumn: z.string().min(1, "Street address column is required"),
  cityColumn: z.string().min(1, "City column is required"),
  stateProvinceColumn: z.string().min(1, "State/Province column is required"),
  zipCodeColumn: z.string().min(1, "ZIP code column is required"),
  countryColumn: z.string().min(1, "Country column is required"),
});

const lookupFieldSchema = z.object({
  type: z.literal("LookupField"),
  apiCode: z.string().min(1, "API Code is required").regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "API Code must start with a letter and contain only letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required"),
  relationshipApiCode: z.string().optional(),
  relationshipName: z.string().optional(),
  helpText: z.string().optional(),
  placeHolder: z.string().optional(),
  referencedObject: z.string().min(1, "Referenced object is required"),
  primaryDisplayField: z.string().min(1, "Primary display field is required"),
  displayColumns: z.array(z.string()).min(1, "At least one display column is required").max(5, "Maximum 5 display columns allowed"),
});

const formSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  dateTimeFieldSchema,
  dropDownListFieldSchema,
  checkboxFieldSchema,
  addressFieldSchema,
  lookupFieldSchema,
]);

type FormData = z.infer<typeof formSchema>;
type TextFieldFormData = z.infer<typeof textFieldSchema>;
type NumberFieldFormData = z.infer<typeof numberFieldSchema>;
type DateTimeFieldFormData = z.infer<typeof dateTimeFieldSchema>;
type DropDownListFieldFormData = z.infer<typeof dropDownListFieldSchema>;
type CheckboxFieldFormData = z.infer<typeof checkboxFieldSchema>;
type AddressFieldFormData = z.infer<typeof addressFieldSchema>;
type LookupFieldFormData = z.infer<typeof lookupFieldSchema>;

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
  const [step, setStep] = useState<"fieldType" | "subtype" | "lookupObject" | "sourceSelection" | "form">(() => 
    fieldToEdit ? "form" : "fieldType"
  );
  const [selectedFieldType, setSelectedFieldType] = useState<string>(() =>
    fieldToEdit?.type || ""
  );
  
  // Track whether we're creating a new Global Value Set or using an existing one
  const [isNewGlobalValueSet, setIsNewGlobalValueSet] = useState(false);
  const [newGlobalValueSetName, setNewGlobalValueSetName] = useState("");
  const [newGlobalValueSetValues, setNewGlobalValueSetValues] = useState("");
  
  // Track which picklist source option is selected (for dropdown list fields)
  const [picklistSourceOption, setPicklistSourceOption] = useState<"countries" | "currencies" | "custom" | "newCustom" | "">("");

  // Sync picklistSourceOption when entering sourceSelection step (for editing or navigating back)
  useEffect(() => {
    if (step === "sourceSelection") {
      const sourcePath = form.getValues("sourcePath" as any) as string | undefined;
      // Check isNewGlobalValueSet first - takes priority over sourcePath
      if (isNewGlobalValueSet) {
        setPicklistSourceOption("newCustom");
      } else if (sourcePath === "countries.xml") {
        setPicklistSourceOption("countries");
      } else if (sourcePath === "currencies.xml") {
        setPicklistSourceOption("currencies");
      } else if (sourcePath?.startsWith("global_value_sets/")) {
        setPicklistSourceOption("custom");
      }
      // If none of the above, picklistSourceOption stays empty (for new fields)
    }
  }, [step, isNewGlobalValueSet]);

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
          format: "Number" as const,
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
      case "DropDownListField":
        return {
          type: "DropDownListField" as const,
          apiCode: "",
          label: "",
          subtype: "singleSelect" as const,
          helpText: "",
          placeHolder: "",
          sourceType: "GlobalMetadata" as const,
          sourcePath: "",
          showSearch: false,
          rootKey: "",
          itemKey: "",
        };
      case "CheckboxField":
        return {
          type: "CheckboxField" as const,
          apiCode: "",
          label: "",
          helpText: "",
          placeHolder: "",
          defaultValue: "false" as const,
        };
      case "AddressField":
        return {
          type: "AddressField" as const,
          apiCode: "",
          label: "",
          helpText: "",
          placeHolder: "",
          streetAddressColumn: "",
          cityColumn: "",
          stateProvinceColumn: "",
          zipCodeColumn: "",
          countryColumn: "",
        };
      case "LookupField":
        return {
          type: "LookupField" as const,
          apiCode: "",
          label: "",
          helpText: "",
          placeHolder: "",
          referencedObject: "",
          primaryDisplayField: "",
          displayColumns: [],
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

  // Fetch available objects for LookupField
  const { data: availableObjects = [] } = useQuery<Array<{
    apiCode: string;
    labelPlural: string;
    labelSingular: string;
    iconSet: string;
    icon: string;
  }>>({
    queryKey: ["/api/object-definitions"],
    enabled: step === "lookupObject" || (fieldToEdit?.type === "LookupField" && step === "form"),
  });

  // Fetch available global value sets for DropDownListField
  const { data: availableGlobalValueSets = [] } = useQuery<Array<{
    name: string;
    label: string;
    valueCount: number;
  }>>({
    queryKey: ["/api/global-value-sets"],
    enabled: step === "sourceSelection" || (fieldToEdit?.type === "DropDownListField" && step === "form"),
  });

  // Fetch fields for the selected referenced object
  const selectedReferencedObject = form.watch("referencedObject" as any);
  const { data: objectFields = [] } = useQuery<Array<{
    type: string;
    apiCode: string;
    label: string;
    filePath: string;
  }>>({
    queryKey: ["/api/object-fields", selectedReferencedObject],
    enabled: !!selectedReferencedObject && (step === "form" || step === "lookupObject"),
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
          // Convert legacy lowercase format values to UI format values
          let formatValue: "Number" | "Percentage" = "Number";
          if (data.format) {
            if (data.format === "percentage" || data.format === "Percentage") {
              formatValue = "Percentage";
            } else {
              // Legacy values like "number", "Decimal", "Integer", "Currency" all map to "Number"
              formatValue = "Number";
            }
          }
          
          form.reset({
            type: "NumberField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            step: data.step || "",
            format: formatValue,
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
        } else if (fieldType === "DropDownListField") {
          form.reset({
            type: "DropDownListField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            subtype: data.subtype || "singleSelect",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            sourceType: data.sourceType || "GlobalMetadata",
            sourcePath: data.sourcePath || "",
            showSearch: data.showSearch === "true" || data.showSearch === true,
            rootKey: data.rootKey || "",
            itemKey: data.itemKey || "",
          });
        } else if (fieldType === "CheckboxField") {
          form.reset({
            type: "CheckboxField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            defaultValue: data.defaultValue || "false",
          });
        } else if (fieldType === "AddressField") {
          form.reset({
            type: "AddressField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            streetAddressColumn: data.streetAddressColumn || "",
            cityColumn: data.cityColumn || "",
            stateProvinceColumn: data.stateProvinceColumn || "",
            zipCodeColumn: data.zipCodeColumn || "",
            countryColumn: data.countryColumn || "",
          });
        } else if (fieldType === "LookupField") {
          // Parse displayColumns if it's a string
          let displayColumns = data.displayColumns || [];
          if (typeof displayColumns === "string") {
            try {
              displayColumns = JSON.parse(displayColumns);
            } catch {
              displayColumns = displayColumns.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          
          form.reset({
            type: "LookupField",
            apiCode: data.apiCode || "",
            label: data.label || "",
            helpText: data.helpText || "",
            placeHolder: data.placeHolder || "",
            referencedObject: data.referencedObject || "",
            primaryDisplayField: data.primaryDisplayField || "",
            displayColumns: displayColumns,
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

  // Auto-populate AddressField column names based on apiCode prefix
  const apiCode = form.watch("apiCode");
  useEffect(() => {
    if (selectedFieldType === "AddressField" && !fieldToEdit) {
      if (apiCode) {
        form.setValue("streetAddressColumn", `${apiCode}StreetAddress`);
        form.setValue("cityColumn", `${apiCode}City`);
        form.setValue("stateProvinceColumn", `${apiCode}StateProvince`);
        form.setValue("zipCodeColumn", `${apiCode}ZipCode`);
        form.setValue("countryColumn", `${apiCode}Country`);
      } else {
        // Reset to empty strings when apiCode is cleared
        form.setValue("streetAddressColumn", "");
        form.setValue("cityColumn", "");
        form.setValue("stateProvinceColumn", "");
        form.setValue("zipCodeColumn", "");
        form.setValue("countryColumn", "");
      }
    }
  }, [apiCode, selectedFieldType, fieldToEdit, form]);

  const createFieldMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload: any = { ...data };
      
      // Transform boolean values to strings for TextField
      if (data.type === "TextField") {
        payload.copyAble = data.copyAble?.toString() || "false";
        payload.truncate = data.truncate?.toString() || "false";
      }
      
      // Transform boolean values to strings for DropDownListField
      if (data.type === "DropDownListField") {
        payload.showSearch = data.showSearch?.toString() || "false";
        
        // If we're creating a new Global Value Set, create it first
        if (isNewGlobalValueSet && newGlobalValueSetName.trim() && newGlobalValueSetValues.trim()) {
          const values = newGlobalValueSetValues
            .split('\n')
            .map(v => v.trim())
            .filter(v => v.length > 0);
          
          await apiRequest("POST", "/api/global-value-sets", {
            name: newGlobalValueSetName.trim(),
            values: values,
          });
        }
        
        // Normalize rootKey and itemKey for UniversalMetadata sources
        if (payload.sourceType === "UniversalMetadata") {
          if (!payload.rootKey || payload.rootKey.trim() === "") {
            // Set defaults based on sourcePath
            if (payload.sourcePath === "countries.xml") {
              payload.rootKey = "countries";
              payload.itemKey = "country";
            } else if (payload.sourcePath === "currencies.xml") {
              payload.rootKey = "currencies";
              payload.itemKey = "currency";
            }
          }
        }
      }
      
      return apiRequest("POST", `/api/object-fields/${objectName}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/object-fields", objectName] });
      queryClient.invalidateQueries({ queryKey: ["/api/global-value-sets"] });
      toast({
        title: "Success",
        description: isNewGlobalValueSet 
          ? "Global Value Set and field created successfully" 
          : "Field created successfully",
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
      
      // Transform boolean values to strings for DropDownListField
      if (data.type === "DropDownListField") {
        payload.showSearch = data.showSearch?.toString() || "false";
        
        // Normalize rootKey and itemKey for UniversalMetadata sources
        if (payload.sourceType === "UniversalMetadata") {
          if (!payload.rootKey || payload.rootKey.trim() === "") {
            // Set defaults based on sourcePath
            if (payload.sourcePath === "countries.xml") {
              payload.rootKey = "countries";
              payload.itemKey = "country";
            } else if (payload.sourcePath === "currencies.xml") {
              payload.rootKey = "currencies";
              payload.itemKey = "currency";
            }
          }
        }
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
      // DropDownListField needs source selection
      else if (selectedFieldType === "DropDownListField") {
        setStep("sourceSelection");
      }
      // LookupField needs object selection
      else if (selectedFieldType === "LookupField") {
        setStep("lookupObject");
      }
      // NumberField, CheckboxField, and AddressField skip directly to form
      else if (selectedFieldType === "NumberField" || selectedFieldType === "CheckboxField" || selectedFieldType === "AddressField") {
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
    } else if (step === "sourceSelection") {
      // Check if we're creating a new Global Value Set
      if (isNewGlobalValueSet) {
        // Validate new GVS name
        if (!newGlobalValueSetName.trim()) {
          toast({
            title: "Name Required",
            description: "Please enter a name for the new Global Value Set",
            variant: "destructive",
          });
          return;
        }
        // Validate name format (camelCase allowed, must start with letter)
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newGlobalValueSetName.trim())) {
          toast({
            title: "Invalid API Code",
            description: "API Code must start with a letter and contain only letters, numbers, and underscores",
            variant: "destructive",
          });
          return;
        }
        // Validate values
        if (!newGlobalValueSetValues.trim()) {
          toast({
            title: "Values Required",
            description: "Please enter at least one value for the Global Value Set",
            variant: "destructive",
          });
          return;
        }
        // Set the sourcePath to use the new GVS name
        const currentValues = form.getValues() as any;
        form.reset({
          type: "DropDownListField",
          apiCode: currentValues.apiCode || "",
          label: currentValues.label || "",
          subtype: currentValues.subtype || "singleSelect",
          helpText: currentValues.helpText || "",
          placeHolder: currentValues.placeHolder || "",
          sourceType: "GlobalMetadata",
          sourcePath: `global_value_sets/${newGlobalValueSetName.trim()}`,
          showSearch: false,
          rootKey: "",
          itemKey: "",
        });
        setStep("form");
      } else {
        // Existing flow: Validate that sourcePath is set
        const sourcePath = form.getValues("sourcePath" as any);
        if (!sourcePath) {
          toast({
            title: "Selection Required",
            description: "Please select a data source to continue",
            variant: "destructive",
          });
          return;
        }
        setStep("form");
      }
    } else if (step === "lookupObject") {
      // Validate that an object has been selected
      const selectedObject = form.getValues("referencedObject" as any);
      if (!selectedObject) {
        toast({
          title: "Selection Required",
          description: "Please select an object to continue",
          variant: "destructive",
        });
        return;
      }
      setStep("form");
    }
  };

  const handleBack = () => {
    if (step === "form") {
      // TextField and DateTimeField go back to subtype selection
      if (selectedFieldType === "TextField" || selectedFieldType === "DateTimeField") {
        setStep("subtype");
      }
      // DropDownListField goes back to source selection
      else if (selectedFieldType === "DropDownListField") {
        setStep("sourceSelection");
      }
      // LookupField goes back to object selection
      else if (selectedFieldType === "LookupField") {
        setStep("lookupObject");
      }
      // Other fields go back to field type selection
      else {
        setStep("fieldType");
      }
    } else if (step === "subtype") {
      setStep("fieldType");
    } else if (step === "sourceSelection") {
      setStep("fieldType");
    } else if (step === "lookupObject") {
      setStep("fieldType");
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setStep("fieldType");
      setSelectedFieldType("");
      setIsNewGlobalValueSet(false);
      setNewGlobalValueSetName("");
      setNewGlobalValueSetValues("");
      setPicklistSourceOption("");
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
            {step === "sourceSelection" && "Select the data source for this dropdown list"}
            {step === "lookupObject" && "Select the object this lookup field will reference"}
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
                <RadioGroupItem value="DropDownListField" id="type-dropdown" data-testid="radio-field-type-dropdown" />
                <Label htmlFor="type-dropdown" className="font-normal cursor-pointer">
                  Single select or multiselect dropdown list field
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
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CheckboxField" id="type-checkbox" data-testid="radio-field-type-checkbox" />
                <Label htmlFor="type-checkbox" className="font-normal cursor-pointer">
                  Checkbox field
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AddressField" id="type-address" data-testid="radio-field-type-address" />
                <Label htmlFor="type-address" className="font-normal cursor-pointer">
                  Address field with Google Maps autocomplete
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

        {step === "lookupObject" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Lookup field to reference a record on an object</p>
              <p className="text-xs text-muted-foreground">
                Select which object this field will reference. For example, if you're adding a lookup field to Assets, you might select "Accounts" to link each asset to an account.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencedObject" className="text-muted-foreground">
                Referenced Object <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("referencedObject" as any) || ""}
                onValueChange={(value) => {
                  form.setValue("referencedObject" as any, value);
                  // Reset display fields when object changes
                  form.setValue("primaryDisplayField" as any, "");
                  form.setValue("displayColumns" as any, []);
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
              {(form.formState.errors as any).referencedObject && (
                <p className="text-sm text-destructive">{(form.formState.errors as any).referencedObject?.message}</p>
              )}
            </div>
          </div>
        )}

        {step === "sourceSelection" && (
          <div className="space-y-4 py-4">
            <RadioGroup
              value={picklistSourceOption}
              onValueChange={(value: "countries" | "currencies" | "custom" | "newCustom") => {
                setPicklistSourceOption(value);
                const currentValues = form.getValues() as any;
                if (value === "countries") {
                  setIsNewGlobalValueSet(false);
                  setNewGlobalValueSetName("");
                  setNewGlobalValueSetValues("");
                  form.reset({
                    type: "DropDownListField",
                    apiCode: currentValues.apiCode || "",
                    label: currentValues.label || "",
                    subtype: currentValues.subtype || "singleSelect",
                    helpText: currentValues.helpText || "",
                    placeHolder: currentValues.placeHolder || "",
                    sourceType: "UniversalMetadata",
                    sourcePath: "countries.xml",
                    showSearch: false,
                    rootKey: "countries",
                    itemKey: "country",
                  });
                } else if (value === "currencies") {
                  setIsNewGlobalValueSet(false);
                  setNewGlobalValueSetName("");
                  setNewGlobalValueSetValues("");
                  form.reset({
                    type: "DropDownListField",
                    apiCode: currentValues.apiCode || "",
                    label: currentValues.label || "",
                    subtype: currentValues.subtype || "singleSelect",
                    helpText: currentValues.helpText || "",
                    placeHolder: currentValues.placeHolder || "",
                    sourceType: "UniversalMetadata",
                    sourcePath: "currencies.xml",
                    showSearch: false,
                    rootKey: "currencies",
                    itemKey: "currency",
                  });
                } else if (value === "custom") {
                  setIsNewGlobalValueSet(false);
                  setNewGlobalValueSetName("");
                  setNewGlobalValueSetValues("");
                  form.reset({
                    type: "DropDownListField",
                    apiCode: currentValues.apiCode || "",
                    label: currentValues.label || "",
                    subtype: currentValues.subtype || "singleSelect",
                    helpText: currentValues.helpText || "",
                    placeHolder: currentValues.placeHolder || "",
                    sourceType: "GlobalMetadata",
                    sourcePath: "",
                    showSearch: false,
                    rootKey: "",
                    itemKey: "",
                  });
                } else if (value === "newCustom") {
                  setIsNewGlobalValueSet(true);
                  form.reset({
                    type: "DropDownListField",
                    apiCode: currentValues.apiCode || "",
                    label: currentValues.label || "",
                    subtype: currentValues.subtype || "singleSelect",
                    helpText: currentValues.helpText || "",
                    placeHolder: currentValues.placeHolder || "",
                    sourceType: "GlobalMetadata",
                    sourcePath: "",
                    showSearch: false,
                    rootKey: "",
                    itemKey: "",
                  });
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="countries" id="source-countries" data-testid="radio-source-countries" />
                <Label htmlFor="source-countries" className="font-normal cursor-pointer">
                  I need a Country dropdown list
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="currencies" id="source-currencies" data-testid="radio-source-currencies" />
                <Label htmlFor="source-currencies" className="font-normal cursor-pointer">
                  I need a Currency dropdown list
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="source-custom" data-testid="radio-source-custom" />
                <Label htmlFor="source-custom" className="font-normal cursor-pointer">
                  I need a dropdown list for an existing Global Value Set
                </Label>
              </div>
              
              {/* Global Value Set selector - appears only when 'custom' option is selected */}
              {picklistSourceOption === "custom" && (
                <div className="space-y-2 ml-6 mt-2">
                  <Label htmlFor="globalValueSet" className="text-muted-foreground">
                    Select Global Value Set <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.watch("sourcePath" as any)?.replace("global_value_sets/", "") || ""}
                    onValueChange={(value) => {
                      const currentValues = form.getValues() as any;
                      form.reset({
                        type: "DropDownListField",
                        apiCode: currentValues.apiCode || "",
                        label: currentValues.label || "",
                        subtype: currentValues.subtype || "singleSelect",
                        helpText: currentValues.helpText || "",
                        placeHolder: currentValues.placeHolder || "",
                        sourceType: "GlobalMetadata",
                        sourcePath: `global_value_sets/${value}`,
                        showSearch: false,
                        rootKey: "",
                        itemKey: "",
                      });
                    }}
                  >
                    <SelectTrigger id="globalValueSet" data-testid="select-global-value-set">
                      <SelectValue placeholder="Select a global value set..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGlobalValueSets.map((gvs) => (
                        <SelectItem key={gvs.name} value={gvs.name}>
                          {gvs.label} ({gvs.valueCount} values)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="newCustom" id="source-new-custom" data-testid="radio-source-new-custom" />
                <Label htmlFor="source-new-custom" className="font-normal cursor-pointer">
                  I need a dropdown list for a new Global Value Set
                </Label>
              </div>
            </RadioGroup>

            {picklistSourceOption === "newCustom" && (
              <div className="space-y-4 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="newGlobalValueSetName" className="text-muted-foreground">
                    New Global Value Set API Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newGlobalValueSetName"
                    data-testid="input-new-gvs-name"
                    value={newGlobalValueSetName}
                    onChange={(e) => setNewGlobalValueSetName(e.target.value)}
                    placeholder="e.g., industries, productCategories, orderStatuses"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use letters and numbers, no spaces (camelCase allowed). This will be used as the API identifier.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newGlobalValueSetValues" className="text-muted-foreground">
                    Values <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="newGlobalValueSetValues"
                    data-testid="input-new-gvs-values"
                    value={newGlobalValueSetValues}
                    onChange={(e) => setNewGlobalValueSetValues(e.target.value)}
                    placeholder="Enter each value on a separate line, e.g.:&#10;Technology&#10;Healthcare&#10;Finance&#10;Retail&#10;Manufacturing"
                    rows={7}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each value on a separate line. These will become the dropdown options.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "form" && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Common Fields for All Types */}
            <div className="space-y-2">
              <Label htmlFor="apiCode" className="text-muted-foreground">
                {selectedFieldType === "AddressField" ? "Address Field Prefix" : "API Code"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="apiCode"
                data-testid="input-api-code"
                {...form.register("apiCode")}
                disabled={!!fieldToEdit}
                placeholder={selectedFieldType === "AddressField" ? "e.g., physical_location" : "e.g., customerEmail"}
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
                    onValueChange={(value) => form.setValue("format", value as "Number" | "Percentage")}
                  >
                    <SelectTrigger id="format" data-testid="select-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Number">Number</SelectItem>
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

            {/* DropDownListField-Specific Fields */}
            {selectedFieldType === "DropDownListField" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    What type of dropdown component do you need? <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={form.watch("subtype")}
                    onValueChange={(value) => form.setValue("subtype", value as "singleSelect" | "multiSelect")}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="singleSelect" id="subtype-single" data-testid="radio-subtype-single" />
                      <Label htmlFor="subtype-single" className="font-normal cursor-pointer">
                        Single Value Selection dropdown
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="multiSelect" id="subtype-multi" data-testid="radio-subtype-multi" />
                      <Label htmlFor="subtype-multi" className="font-normal cursor-pointer">
                        Multivalue Selection dropdown
                      </Label>
                    </div>
                  </RadioGroup>
                  {"subtype" in form.formState.errors && form.formState.errors.subtype && (
                    <p className="text-sm text-destructive">{form.formState.errors.subtype.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* CheckboxField-Specific Fields */}
            {selectedFieldType === "CheckboxField" && (
              <div className="space-y-2">
                <Label htmlFor="defaultValue" className="text-muted-foreground">
                  Default Value
                </Label>
                <Select
                  value={form.watch("defaultValue") || "false"}
                  onValueChange={(value) => form.setValue("defaultValue", value as "true" | "false")}
                >
                  <SelectTrigger id="defaultValue" data-testid="select-default-value">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Unchecked (False)</SelectItem>
                    <SelectItem value="true">Checked (True)</SelectItem>
                  </SelectContent>
                </Select>
                {"defaultValue" in form.formState.errors && form.formState.errors.defaultValue && (
                  <p className="text-sm text-destructive">{form.formState.errors.defaultValue.message}</p>
                )}
              </div>
            )}

            {/* AddressField-Specific Fields */}
            {selectedFieldType === "AddressField" && (
              <>
                {!fieldToEdit && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Auto-Generated Columns</p>
                        <p className="text-xs text-muted-foreground">
                          The API Code you enter will be used as a prefix to automatically generate 5 database columns:
                        </p>
                        <div className="mt-2 space-y-1 text-xs font-mono bg-background rounded p-2">
                          <div><span className="text-primary">{form.watch("apiCode") || "prefix"}StreetAddress</span></div>
                          <div><span className="text-primary">{form.watch("apiCode") || "prefix"}City</span></div>
                          <div><span className="text-primary">{form.watch("apiCode") || "prefix"}StateProvince</span></div>
                          <div><span className="text-primary">{form.watch("apiCode") || "prefix"}ZipCode</span></div>
                          <div><span className="text-primary">{form.watch("apiCode") || "prefix"}Country</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {fieldToEdit && (
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Database Column Mappings</p>
                        <p className="text-xs text-muted-foreground">
                          These column names were auto-generated when the field was created and cannot be changed:
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="streetAddressColumn" className="text-muted-foreground">
                    Street Address Column
                  </Label>
                  <Input
                    id="streetAddressColumn"
                    {...form.register("streetAddressColumn")}
                    disabled
                    data-testid="input-street-address-column"
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cityColumn" className="text-muted-foreground">
                      City Column
                    </Label>
                    <Input
                      id="cityColumn"
                      {...form.register("cityColumn")}
                      disabled
                      data-testid="input-city-column"
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stateProvinceColumn" className="text-muted-foreground">
                      State/Province Column
                    </Label>
                    <Input
                      id="stateProvinceColumn"
                      {...form.register("stateProvinceColumn")}
                      disabled
                      data-testid="input-state-province-column"
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCodeColumn" className="text-muted-foreground">
                      ZIP Code Column
                    </Label>
                    <Input
                      id="zipCodeColumn"
                      {...form.register("zipCodeColumn")}
                      disabled
                      data-testid="input-zip-code-column"
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="countryColumn" className="text-muted-foreground">
                      Country Column
                    </Label>
                    <Input
                      id="countryColumn"
                      {...form.register("countryColumn")}
                      disabled
                      data-testid="input-country-column"
                      className="bg-muted"
                    />
                  </div>
                </div>
              </>
            )}

            {/* LookupField-Specific Fields */}
            {selectedFieldType === "LookupField" && (
              <>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium">Lookup Configuration</p>
                  <p className="text-xs text-muted-foreground">
                    Select which field to display as the name and up to 5 fields to show in the lookup dialog table.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryDisplayField" className="text-muted-foreground">
                    Primary Display Field <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={(form.watch as any)("primaryDisplayField") || ""}
                    onValueChange={(value) => {
                      (form.setValue as any)("primaryDisplayField", value);
                    }}
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
                  {(form.formState.errors as any).primaryDisplayField && (
                    <p className="text-sm text-destructive">{(form.formState.errors as any).primaryDisplayField?.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This field will be displayed as the record name in view and edit modes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Display Columns (Select up to 5) <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-2 border rounded-md p-4 max-h-64 overflow-y-auto">
                    {objectFields.map((field) => {
                      const selectedColumns = (form.watch as any)("displayColumns") || [];
                      const isSelected = selectedColumns.includes(field.apiCode);
                      const isDisabled = !isSelected && selectedColumns.length >= 5;

                      return (
                        <div key={field.apiCode} className="flex items-center space-x-2">
                          <Checkbox
                            id={`column-${field.apiCode}`}
                            checked={isSelected}
                            disabled={isDisabled}
                            onCheckedChange={(checked) => {
                              const currentColumns = (form.watch as any)("displayColumns") || [];
                              if (checked) {
                                (form.setValue as any)("displayColumns", [...currentColumns, field.apiCode]);
                              } else {
                                (form.setValue as any)("displayColumns", currentColumns.filter((c: string) => c !== field.apiCode));
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
                    })}
                  </div>
                  {(form.formState.errors as any).displayColumns && (
                    <p className="text-sm text-destructive">{(form.formState.errors as any).displayColumns?.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Selected columns ({((form.watch as any)("displayColumns") || []).length}/5) will appear in the lookup dialog table
                  </p>
                </div>
              </>
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
          {(step === "fieldType" || step === "subtype" || step === "sourceSelection" || step === "lookupObject") && !fieldToEdit && (
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
