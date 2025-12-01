import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Phone, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  countryCode: string;
  countryCode3Digits: string;
  countryName: string;
  region: string;
  subRegion: string;
  intermediateRegion: string;
  phoneCountryCode: string;
  phoneNumberFormat: string;
}

export interface PhoneFieldProps {
  mode: "edit" | "view" | "table";
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  testId?: string;
  className?: string;
  disabled?: boolean;
}

export function PhoneField({
  mode,
  value,
  onChange,
  label,
  testId,
  className,
  disabled = false,
}: PhoneFieldProps) {
  const [open, setOpen] = useState(false);
  const [countryCodeInput, setCountryCodeInput] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: ["/api/universal/countries"],
  });

  const parsePhoneValue = (val: string): { countryCode: string; phoneNumber: string } => {
    if (!val) return { countryCode: "", phoneNumber: "" };
    
    const match = val.match(/^\+(\d+)/);
    if (match) {
      const fullCountryCode = match[1];
      const country = countries.find(c => c.phoneCountryCode === fullCountryCode);
      if (country) {
        const restOfNumber = val.slice(1 + fullCountryCode.length);
        return { countryCode: `+${fullCountryCode}`, phoneNumber: restOfNumber };
      }
      for (let len = Math.min(fullCountryCode.length, 4); len >= 1; len--) {
        const possibleCode = fullCountryCode.slice(0, len);
        const matchedCountry = countries.find(c => c.phoneCountryCode === possibleCode);
        if (matchedCountry) {
          const restOfNumber = val.slice(1 + possibleCode.length);
          return { countryCode: `+${possibleCode}`, phoneNumber: restOfNumber };
        }
      }
    }
    return { countryCode: "", phoneNumber: val.replace(/\D/g, "") };
  };

  const { countryCode, phoneNumber } = parsePhoneValue(value);

  const selectedCountry = countries.find(
    c => `+${c.phoneCountryCode}` === countryCode
  );

  const formatPhoneByPattern = (digits: string, pattern: string | undefined): string => {
    if (!digits) return "";
    const clean = digits.replace(/\D/g, "");
    
    if (!pattern) {
      const parts = [];
      for (let i = 0; i < clean.length; i += 4) {
        parts.push(clean.slice(i, i + 4));
      }
      return parts.join("-");
    }

    let result = "";
    let digitIndex = 0;
    
    for (let i = 0; i < pattern.length && digitIndex < clean.length; i++) {
      const char = pattern[i];
      if (char.toLowerCase() === "x") {
        result += clean[digitIndex];
        digitIndex++;
      } else {
        result += char;
      }
    }
    
    return result;
  };

  const getMaxDigitsFromPattern = (pattern: string | undefined): number => {
    if (!pattern) return 12;
    return (pattern.match(/x/gi) || []).length;
  };

  const getPlaceholderFromPattern = (pattern: string | undefined): string => {
    if (!pattern) return "1234-5678-9012";
    return pattern.replace(/x/gi, "0");
  };

  const phonePattern = selectedCountry?.phoneNumberFormat;
  const maxDigits = getMaxDigitsFromPattern(phonePattern);
  const placeholder = getPlaceholderFromPattern(phonePattern);

  const combineAndEmitValue = (newCountryCode: string, newPhoneDigits: string) => {
    const cleanDigits = newPhoneDigits.replace(/\D/g, "");
    const combined = newCountryCode + cleanDigits;
    onChange?.(combined);
  };

  const handleCountrySelect = (selectedCountry: Country) => {
    const newCode = `+${selectedCountry.phoneCountryCode}`;
    combineAndEmitValue(newCode, phoneNumber);
    setOpen(false);
    setCountryCodeInput("");
    phoneInputRef.current?.focus();
  };

  const handleCountryCodeInputChange = (inputValue: string) => {
    setCountryCodeInput(inputValue);
  };

  const handleCountryCodeInputBlur = () => {
    if (countryCodeInput) {
      const cleanInput = countryCodeInput.replace(/[^\d]/g, "");
      if (cleanInput) {
        const matchedCountry = countries.find(c => c.phoneCountryCode === cleanInput);
        if (matchedCountry) {
          const newCode = `+${matchedCountry.phoneCountryCode}`;
          combineAndEmitValue(newCode, phoneNumber);
        }
      }
      setCountryCodeInput("");
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digitsOnly = inputValue.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, maxDigits);
    combineAndEmitValue(countryCode, limitedDigits);
  };

  const filteredCountries = countries.filter(country => {
    const searchTerm = countryCodeInput.toLowerCase().replace(/[^\d\w]/g, "");
    if (!searchTerm) return true;
    return (
      country.phoneCountryCode.includes(searchTerm) ||
      country.countryName.toLowerCase().includes(searchTerm) ||
      country.countryCode.toLowerCase().includes(searchTerm)
    );
  });

  if (mode === "view" || mode === "table") {
    if (!value) {
      return (
        <div className={mode === "view" ? "space-y-2" : ""}>
          {mode === "view" && label && (
            <FormLabel className="text-muted-foreground">{label}</FormLabel>
          )}
          <span 
            className={cn(
              "text-muted-foreground",
              mode === "table" ? "text-sm" : "text-sm py-2 block"
            )}
            data-testid={testId}
          >
            -
          </span>
        </div>
      );
    }

    const formattedDisplay = `${countryCode} ${formatPhoneByPattern(phoneNumber, phonePattern)}`;
    const telLink = `tel:${countryCode}${phoneNumber}`;

    return (
      <div className={mode === "view" ? "space-y-2" : ""}>
        {mode === "view" && label && (
          <FormLabel className="text-muted-foreground">{label}</FormLabel>
        )}
        <a
          href={telLink}
          className={cn(
            "text-primary hover:underline inline-flex items-center gap-1",
            mode === "table" ? "text-sm" : "text-sm py-2"
          )}
          data-testid={testId}
        >
          <Phone className="h-3 w-3" />
          {formattedDisplay}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <FormLabel className="text-muted-foreground">{label}</FormLabel>
      )}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[140px] justify-between font-normal"
              disabled={disabled}
              data-testid={testId ? `${testId}-country` : undefined}
            >
              {selectedCountry ? (
                <span className="truncate">+{selectedCountry.phoneCountryCode}</span>
              ) : (
                <span className="text-muted-foreground">Code</span>
              )}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Type country code or name..."
                value={countryCodeInput}
                onValueChange={handleCountryCodeInputChange}
                onBlur={handleCountryCodeInputBlur}
              />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {filteredCountries.map((country) => (
                    <CommandItem
                      key={country.countryCode}
                      value={`${country.phoneCountryCode} ${country.countryName}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          countryCode === `+${country.phoneCountryCode}`
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      +{country.phoneCountryCode} ({country.countryName})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <FormControl>
          <Input
            ref={phoneInputRef}
            type="tel"
            value={formatPhoneByPattern(phoneNumber, phonePattern)}
            onChange={handlePhoneNumberChange}
            placeholder={placeholder}
            className={cn("flex-1", className)}
            disabled={disabled}
            data-testid={testId ? `${testId}-number` : undefined}
          />
        </FormControl>
      </div>
    </div>
  );
}
