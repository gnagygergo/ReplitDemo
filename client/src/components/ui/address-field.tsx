import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { FormLabel, FormControl } from "@/components/ui/form";
import { useFieldDefinition } from "@/hooks/use-field-definition";
import { useCompanySettings } from "@/contexts/CompanySettingsContext";
import { GooglePlacesAutocomplete } from "@/components/google-places-autocomplete";

export interface AddressFieldProps {
  mode: "edit" | "view" | "table";
  value: {
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    zipCode?: string;
    country?: string;
  };
  onChange?: (value: {
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    zipCode?: string;
    country?: string;
  }) => void;
  label?: string;
  placeholder?: string;
  testId?: string;
  className?: string;
  objectCode?: string;
  fieldCode?: string;
}

export function AddressField({
  mode,
  value,
  onChange,
  label,
  placeholder,
  testId,
  className,
  objectCode,
  fieldCode,
}: AddressFieldProps) {
  const { getSetting } = useCompanySettings();

  // Fetch field definition if objectCode and fieldCode are provided
  const { data: fieldDef } = useFieldDefinition({
    objectCode,
    fieldCode,
  });

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

  // Handle Google Places autocomplete selection
  const handlePlaceSelected = useCallback((addressComponents: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    zipCode: string;
    country: string;
  }) => {
    onChange?.({
      streetAddress: addressComponents.streetAddress,
      city: addressComponents.city,
      stateProvince: addressComponents.stateProvince,
      zipCode: addressComponents.zipCode,
      country: addressComponents.country,
    });
  }, [onChange]);

  // Handle individual field changes
  const handleFieldChange = (field: keyof typeof value, newValue: string) => {
    onChange?.({
      ...value,
      [field]: newValue,
    });
  };

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
