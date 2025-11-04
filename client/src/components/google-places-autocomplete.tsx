import { useEffect, useRef, useState, memo } from "react";
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

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

function GooglePlacesAutocompleteComponent({
  apiKey,
  onPlaceSelected,
  placeholder = "Start typing an address...",
  label = "Search Address",
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const callbackRef = useRef(onPlaceSelected);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializationAttemptedRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = onPlaceSelected;
  });

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey || apiKey.trim() === "") {
      setError("Google Maps API key is not configured. Please add it in External Systems Connection settings.");
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("[GooglePlaces] Google Maps already loaded");
      setIsLoaded(true);
      return;
    }

    console.log("[GooglePlaces] Loading Google Maps script...");
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      console.log("[GooglePlaces] Google Maps loaded successfully");
      setIsLoaded(true);
    };

    script.onerror = (e) => {
      console.error("[GooglePlaces] Failed to load Google Maps script:", e);
      setError("Failed to load Google Maps. Please check your API key and internet connection.");
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.initGoogleMaps;
    };
  }, [apiKey]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isLoaded || !inputRef.current) {
      return;
    }

    // Only initialize once
    if (initializationAttemptedRef.current) {
      console.log("[GooglePlaces] Skipping re-initialization");
      return;
    }

    initializationAttemptedRef.current = true;
    console.log("[GooglePlaces] Initializing autocomplete...");

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        }
      );

      autocompleteRef.current = autocomplete;
      console.log("[GooglePlaces] Autocomplete initialized successfully");

      autocomplete.addListener("place_changed", () => {
        console.log("[GooglePlaces] Place changed event fired");
        const place = autocomplete.getPlace();
        
        if (!place.address_components) {
          console.log("[GooglePlaces] No address components in selected place");
          return;
        }

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

        if (streetNumber && route) {
          addressComponents.streetAddress = `${streetNumber} ${route}`;
        } else if (route) {
          addressComponents.streetAddress = route;
        } else if (streetNumber) {
          addressComponents.streetAddress = streetNumber;
        }

        console.log("[GooglePlaces] Parsed address:", addressComponents);
        callbackRef.current(addressComponents);

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      });
    } catch (err) {
      console.error("[GooglePlaces] Error during initialization:", err);
      setError("Failed to initialize address autocomplete.");
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
        <input
          disabled
          placeholder="Loading Google Maps..."
          data-testid="input-address-autocomplete-loading"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="google-autocomplete">{label}</Label>
      <input
        ref={inputRef}
        id="google-autocomplete"
        type="text"
        placeholder={placeholder}
        data-testid="input-address-autocomplete"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        autoComplete="off"
        onInput={(e) => {
          console.log("[GooglePlaces] Input event - value:", (e.target as HTMLInputElement).value);
        }}
        onKeyDown={(e) => {
          console.log("[GooglePlaces] KeyDown event - key:", e.key);
        }}
      />
      <p className="text-sm text-muted-foreground">
        Select an address from the dropdown to auto-fill the fields below.
      </p>
    </div>
  );
}

export const GooglePlacesAutocomplete = memo(GooglePlacesAutocompleteComponent);
