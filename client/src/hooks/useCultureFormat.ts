import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { CultureCode } from "@shared/schema";

const DEFAULT_CULTURE_CODE = "en-US";
const MAX_PRECISION = 17;
const DEFAULT_DECIMAL_PLACES = 2;

export interface NumberFormatOptions {
  decimalPlaces?: number;
  format?: "number" | "percentage";
}

export function useCultureFormat() {
  const { user } = useAuth();
  
  const { data: cultureCodes = [], isLoading } = useQuery<CultureCode[]>({
    queryKey: ["/api/universal/culture-codes"],
  });

  const cultureCode = user?.preferredLanguage || DEFAULT_CULTURE_CODE;
  
  const culture = useMemo(() => {
    if (isLoading || cultureCodes.length === 0) return null;
    
    return cultureCodes.find(
      (c) => c.cultureCode === cultureCode
    ) || cultureCodes.find(
      (c) => c.cultureCode === DEFAULT_CULTURE_CODE
    ) || null;
  }, [cultureCodes, cultureCode, isLoading]);

  const thousandsSeparator = culture?.numberThousandsSeparator ?? ",";
  const decimalSeparator = culture?.numberDecimalSeparator ?? ".";

  const formatNumber = useCallback((
    value: string | number | null,
    options: NumberFormatOptions = {}
  ): string => {
    const { decimalPlaces = DEFAULT_DECIMAL_PLACES, format = "number" } = options;

    if (value === null || value === undefined || value === "") return "-";
    
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "-";

    const fixedNum = num.toFixed(decimalPlaces);
    const [integerPart, fractionalPart] = fixedNum.split(".");

    const formattedInteger = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      thousandsSeparator
    );

    let result: string;
    if (decimalPlaces === 0) {
      result = formattedInteger;
    } else {
      result = `${formattedInteger}${decimalSeparator}${fractionalPart}`;
    }

    if (format === "percentage") {
      result = `${result}%`;
    }

    return result;
  }, [thousandsSeparator, decimalSeparator]);

  const formatForEdit = useCallback((
    value: string | number | null,
    decimalPlaces: number = DEFAULT_DECIMAL_PLACES
  ): string => {
    if (value === null || value === undefined || value === "") return "";
    
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "";

    if (decimalPlaces === 0) {
      const integerPart = Math.round(num).toString();
      return integerPart;
    }

    const fixedNum = num.toFixed(decimalPlaces);
    const [integerPart, fractionalPart] = fixedNum.split(".");

    return `${integerPart}${decimalSeparator}${fractionalPart}`;
  }, [decimalSeparator]);

  const normalizeForStorage = useCallback((
    inputValue: string
  ): string => {
    if (inputValue === "" || inputValue === "-") {
      return inputValue;
    }

    let normalized = inputValue;
    if (decimalSeparator !== ".") {
      normalized = normalized.replace(decimalSeparator, ".");
    }
    
    return normalized;
  }, [decimalSeparator]);

  const validateNumberInput = useCallback((
    inputValue: string,
    decimalPlaces: number = 5
  ): { isValid: boolean; sanitizedValue: string } => {
    if (inputValue === "" || inputValue === "-") {
      return { isValid: true, sanitizedValue: inputValue };
    }

    const separatorPattern = decimalSeparator === "." ? "\\." : decimalSeparator;
    const numberPattern = new RegExp(`^-?\\d*${separatorPattern}?\\d*$`);
    if (!numberPattern.test(inputValue)) {
      return { isValid: false, sanitizedValue: inputValue };
    }

    const parts = inputValue.replace("-", "").split(decimalSeparator);
    const integerPart = parts[0] || "";
    const fractionalPart = parts[1] || "";

    const maxIntegerDigits = MAX_PRECISION - decimalPlaces;
    if (integerPart.length > maxIntegerDigits) {
      return { isValid: false, sanitizedValue: inputValue };
    }

    if (fractionalPart.length > decimalPlaces) {
      return { isValid: false, sanitizedValue: inputValue };
    }

    return { isValid: true, sanitizedValue: inputValue };
  }, [decimalSeparator]);

  const constrainNumberInput = useCallback((
    inputValue: string,
    decimalPlaces: number = 5
  ): string => {
    if (inputValue === "" || inputValue === "-") {
      return inputValue;
    }

    const isNegative = inputValue.startsWith("-");
    let cleanValue = inputValue.replace("-", "");

    const validChars = new RegExp(`[^\\d${decimalSeparator === "." ? "\\." : decimalSeparator}]`, "g");
    cleanValue = cleanValue.replace(validChars, "");

    const sepIndex = cleanValue.indexOf(decimalSeparator);
    if (sepIndex !== -1) {
      const beforeSep = cleanValue.substring(0, sepIndex);
      const afterSep = cleanValue.substring(sepIndex + 1).replace(new RegExp(`[${decimalSeparator === "." ? "\\." : decimalSeparator}]`, "g"), "");
      cleanValue = beforeSep + decimalSeparator + afterSep;
    }

    const parts = cleanValue.split(decimalSeparator);
    let integerPart = parts[0] || "";
    let fractionalPart = parts[1] || "";

    const maxIntegerDigits = MAX_PRECISION - decimalPlaces;
    if (integerPart.length > maxIntegerDigits) {
      integerPart = integerPart.substring(0, maxIntegerDigits);
    }

    if (fractionalPart.length > decimalPlaces) {
      fractionalPart = fractionalPart.substring(0, decimalPlaces);
    }

    let result = integerPart;
    if (cleanValue.includes(decimalSeparator) && decimalPlaces > 0) {
      result += decimalSeparator + fractionalPart;
    }

    if (isNegative && result !== "") {
      result = "-" + result;
    }

    return result;
  }, [decimalSeparator]);

  return {
    culture,
    cultureCode,
    isLoading,
    thousandsSeparator,
    decimalSeparator,
    formatNumber,
    formatForEdit,
    normalizeForStorage,
    validateNumberInput,
    constrainNumberInput,
    MAX_PRECISION,
  };
}
