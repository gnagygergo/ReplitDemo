import { useCallback, useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl } from "@/components/ui/form";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";
import { useLayoutMandatoryField } from "@/contexts/LayoutModeContext";

export interface AddressValue {
  streetAddress?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
  country?: string;
}

export interface AddressFieldProps {
  mode: "edit" | "view" | "table";
  // Form integration (preferred approach) - objectCode and fieldCode are required when using form
  form?: UseFormReturn<any>;
  objectCode?: string;
  fieldCode?: string;
  // Legacy props for backward compatibility (used when form is not provided)
  value?: AddressValue;
  onChange?: (value: AddressValue) => void;
  // Optional overrides
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  layoutMandatory?: string | boolean;
}

export function AddressField({
  mode,
  form,
  objectCode,
  fieldCode,
  value: legacyValue,
  onChange: legacyOnChange,
  label,
  placeholder,
  testId,
  className,
  layoutMandatory,
}: AddressFieldProps) {
  const { getSetting } = useCompanySettings();

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef, isLoading: isLoadingFieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

  // Get column names from metadata (with defaults for backward compatibility)
  const columnNames = useMemo(() => ({
    streetAddress: fieldDef?.streetAddressColumn || "streetAddress",
    city: fieldDef?.cityColumn || "city",
    stateProvince: fieldDef?.stateProvinceColumn || "stateProvince",
    zipCode: fieldDef?.zipCodeColumn || "zipCode",
    country: fieldDef?.countryColumn || "country",
  }), [fieldDef]);

  // Determine if we're using form integration or legacy props
  const useFormIntegration = !!form && !!fieldDef;

  // Register fields with react-hook-form when using form integration
  useEffect(() => {
    if (useFormIntegration && form && fieldDef) {
      // Register each address column with the form
      const fieldsToRegister = [
        columnNames.streetAddress,
        columnNames.city,
        columnNames.stateProvince,
        columnNames.zipCode,
        columnNames.country,
      ];
      
      fieldsToRegister.forEach((fieldName) => {
        // Always register the field with react-hook-form
        form.register(fieldName);
        
        // Only set default value if field is truly unset (undefined)
        // Preserve null values from database - don't coerce to empty string
        const currentValue = form.getValues(fieldName);
        if (currentValue === undefined) {
          // Field wasn't in defaultValues, set to empty string
          form.setValue(fieldName, "", { shouldDirty: false });
        }
        // If currentValue is null or has a value, leave it as-is
      });
    }
  }, [useFormIntegration, form, fieldDef, columnNames]);

  // Get current value - either from form or legacy props
  const value: AddressValue = useMemo(() => {
    if (useFormIntegration && form) {
      return {
        streetAddress: form.watch(columnNames.streetAddress) || "",
        city: form.watch(columnNames.city) || "",
        stateProvince: form.watch(columnNames.stateProvince) || "",
        zipCode: form.watch(columnNames.zipCode) || "",
        country: form.watch(columnNames.country) || "",
      };
    }
    return legacyValue || {};
  }, [useFormIntegration, form, columnNames, legacyValue, 
      form?.watch(columnNames.streetAddress),
      form?.watch(columnNames.city),
      form?.watch(columnNames.stateProvince),
      form?.watch(columnNames.zipCode),
      form?.watch(columnNames.country)]);

  // Merge field definition with explicit props (explicit props take precedence)
  const mergedLabel = label ?? fieldDef?.label ?? "";
  const mergedPlaceholder = placeholder ?? fieldDef?.placeHolder ?? "";

  // Auto-generate testId based on mode if not provided and fieldCode is available
  const mergedTestId = testId ?? (
    mode === "edit" ? fieldDef?.testIdEdit ?? (fieldCode ? `input-${fieldCode}` : undefined)
    : mode === "view" ? fieldDef?.testIdView ?? (fieldCode ? `text-${fieldCode}` : undefined)
    : fieldDef?.testIdTable ?? (fieldCode ? `text-${fieldCode}` : undefined)
  );

  // Get Google Maps API key from company settings
  const googleMapsApiKey = getSetting("google_maps_api_key")?.settingValue || "";

  // Register with LayoutModeContext if layoutMandatory is set
  // For AddressField, check if any address component has a value
  const addressHasValue = !!(value.streetAddress || value.city || value.stateProvince || value.zipCode || value.country);
  const fieldId = fieldCode || testId || label || "address-field";
  const { error: mandatoryError } = useLayoutMandatoryField({
    fieldId,
    value: addressHasValue ? "has-value" : null,
    layoutMandatory,
  });

  // Handle onChange - either update form fields or call legacy onChange
  const handleAddressChange = useCallback((newValue: AddressValue) => {
    if (useFormIntegration && form) {
      const setValueOptions = { shouldDirty: true, shouldTouch: true, shouldValidate: true };
      form.setValue(columnNames.streetAddress, newValue.streetAddress || "", setValueOptions);
      form.setValue(columnNames.city, newValue.city || "", setValueOptions);
      form.setValue(columnNames.stateProvince, newValue.stateProvince || "", setValueOptions);
      form.setValue(columnNames.zipCode, newValue.zipCode || "", setValueOptions);
      form.setValue(columnNames.country, newValue.country || "", setValueOptions);
    } else {
      legacyOnChange?.(newValue);
    }
  }, [useFormIntegration, form, columnNames, legacyOnChange]);

  // Handle Google Places autocomplete selection
  const handlePlaceSelected = useCallback((addressComponents: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
  }) => {
    handleAddressChange({
      streetAddress: addressComponents.streetAddress,
      city: addressComponents.city,
      stateProvince: addressComponents.stateProvince,
      zipCode: addressComponents.zipCode,
      country: addressComponents.country,
    });
  }, [handleAddressChange]);

  // Handle individual field changes
  const handleFieldChange = (field: keyof AddressValue, newValue: string) => {
    handleAddressChange({
      ...value,
      [field]: newValue,
    });
  };

  // Show loading state while fetching field definition (only when form integration is expected)
  if (form && isLoadingFieldDef) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    );
  }

  const defaultEditClassName = "w-full";
  const defaultViewClassName = "text-sm py-2";
  const defaultTableClassName = "text-sm";

  if (mode === "edit") {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        {mergedLabel && (
          <h3 className="font-semibold text-sm">{mergedLabel}</h3>
        )}
        
        {/* Google Places Autocomplete */}
        <GooglePlacesAutocomplete
          apiKey={googleMapsApiKey}
          onPlaceSelected={handlePlaceSelected}
          placeholder={mergedPlaceholder || "Start typing an address..."}
        />

        {/* Street Address */}
        <div>
          <FormLabel className="text-muted-foreground">Street Address</FormLabel>
          <FormControl>
            <Input
              value={value.streetAddress || ""}
              onChange={(e) => handleFieldChange("streetAddress", e.target.value)}
              placeholder="Enter street address"
              data-testid={mergedTestId ? `${mergedTestId}-street` : "input-address-street"}
            />
          </FormControl>
        </div>

        {/* City, State/Province, ZIP Code in a grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* City */}
          <div>
            <FormLabel className="text-muted-foreground">City</FormLabel>
            <FormControl>
              <Input
                value={value.city || ""}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                placeholder="Enter city"
                data-testid={mergedTestId ? `${mergedTestId}-city` : "input-address-city"}
              />
            </FormControl>
          </div>

          {/* State/Province */}
          <div>
            <FormLabel className="text-muted-foreground">State/Province</FormLabel>
            <FormControl>
              <Input
                value={value.stateProvince || ""}
                onChange={(e) => handleFieldChange("stateProvince", e.target.value)}
                placeholder="Enter state"
                data-testid={mergedTestId ? `${mergedTestId}-state` : "input-address-state"}
              />
            </FormControl>
          </div>

          {/* ZIP Code */}
          <div>
            <FormLabel className="text-muted-foreground">ZIP Code</FormLabel>
            <FormControl>
              <Input
                value={value.zipCode || ""}
                onChange={(e) => handleFieldChange("zipCode", e.target.value)}
                placeholder="Enter ZIP"
                data-testid={mergedTestId ? `${mergedTestId}-zip` : "input-address-zip"}
              />
            </FormControl>
          </div>
        </div>

        {/* Country */}
        <div>
          <FormLabel className="text-muted-foreground">Country</FormLabel>
          <FormControl>
            <Input
              value={value.country || ""}
              onChange={(e) => handleFieldChange("country", e.target.value)}
              placeholder="Enter country"
              data-testid={mergedTestId ? `${mergedTestId}-country` : "input-address-country"}
            />
          </FormControl>
        </div>

        {mandatoryError && (
          <p className="text-sm font-medium text-destructive" data-testid={`${mergedTestId}-mandatory-error`}>
            {mandatoryError}
          </p>
        )}
      </div>
    );
  }

  if (mode === "view") {
    // Format address for display
    const parts = [
      value.streetAddress,
      value.city,
      value.stateProvince,
      value.zipCode,
      value.country,
    ].filter(Boolean);

    const displayValue = parts.length > 0 ? parts.join(", ") : "-";
    const hasAddress = parts.length > 0;

    return (
      <>
        {mergedLabel && (
          <FormLabel className="text-muted-foreground">
            {mergedLabel}
          </FormLabel>
        )}
        <div className={className || defaultViewClassName}>
          {hasAddress ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayValue)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
              data-testid={mergedTestId ? `${mergedTestId}-link` : "link-view-address-on-map"}
            >
              <span data-testid={mergedTestId}>{displayValue}</span>
            </a>
          ) : (
            <span data-testid={mergedTestId}>{displayValue}</span>
          )}
        </div>
      </>
    );
  }

  if (mode === "table") {
    // Format address for table display (compact)
    const parts = [
      value.streetAddress,
      value.city,
      value.stateProvince,
    ].filter(Boolean);

    const displayValue = parts.length > 0 ? parts.join(", ") : "-";
    const truncatedValue = displayValue.length > 40 
      ? `${displayValue.substring(0, 40)}...` 
      : displayValue;

    return (
      <span 
        className={className || defaultTableClassName}
        data-testid={mergedTestId}
        title={displayValue.length > 40 ? displayValue : undefined}
      >
        {truncatedValue}
      </span>
    );
  }

  return null;
}
