import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressComponents {
  streetAddress: string;
  city: string;
  stateProvince: string;
  zipCode: string;
  country: string;
}

interface GooglePlacesAutocompleteProps {
  apiKey: string;
  onPlaceSelected: (address: AddressComponents) => void;
  placeholder?: string;
  label?: string;
}

// Extend the Window interface to include google
declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

export function GooglePlacesAutocomplete({
  apiKey,
  onPlaceSelected,
  placeholder = "Start typing an address...",
  label = "Search Address",
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the ref when the callback changes
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    // Check if API key is provided
    if (!apiKey || apiKey.trim() === "") {
      setError("Google Maps API key is not configured. Please add it in Account Management settings.");
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps JavaScript API
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Set up callback for when the script loads
    window.initGoogleMaps = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError("Failed to load Google Maps. Please check your API key and internet connection.");
    };

    document.head.appendChild(script);

    return () => {
      // Clean up
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.initGoogleMaps;
    };
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) {
      return;
    }

    // Initialize the autocomplete
    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["address_components"],
          types: ["address"],
        }
      );

      // Add listener for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        
        if (!place.address_components) {
          return;
        }

        // Parse address components
        const addressComponents: AddressComponents = {
          streetAddress: "",
          city: "",
          stateProvince: "",
          zipCode: "",
          country: "",
        };

        let streetNumber = "";
        let route = "";

        place.address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes("street_number")) {
            streetNumber = component.long_name;
          } else if (types.includes("route")) {
            route = component.long_name;
          } else if (types.includes("locality")) {
            addressComponents.city = component.long_name;
          } else if (types.includes("administrative_area_level_1")) {
            addressComponents.stateProvince = component.short_name;
          } else if (types.includes("postal_code")) {
            addressComponents.zipCode = component.long_name;
          } else if (types.includes("country")) {
            addressComponents.country = component.long_name;
          }
        });

        // Combine street number and route
        if (streetNumber && route) {
          addressComponents.streetAddress = `${streetNumber} ${route}`;
        } else if (route) {
          addressComponents.streetAddress = route;
        } else if (streetNumber) {
          addressComponents.streetAddress = streetNumber;
        }

        // Call the callback with parsed address using the ref
        onPlaceSelectedRef.current(addressComponents);

        // Clear the input after selection
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      });
    } catch (err) {
      setError("Failed to initialize address autocomplete.");
      console.error("Google Places Autocomplete error:", err);
    }
  }, [isLoaded]);

  if (error) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="text-sm text-destructive p-3 border border-destructive rounded-md bg-destructive/10">
          {error}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          disabled
          placeholder="Loading Google Maps..."
          data-testid="input-address-autocomplete-loading"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="google-autocomplete">{label}</Label>
      <Input
        ref={inputRef}
        id="google-autocomplete"
        type="text"
        placeholder={placeholder}
        data-testid="input-address-autocomplete"
      />
      <p className="text-sm text-muted-foreground">
        Select an address from the dropdown to auto-fill the fields below.
      </p>
    </div>
  );
}
