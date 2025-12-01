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

    let result = fractionalPart 
      ? `${formattedInteger}${decimalSeparator}${fractionalPart}`
      : formattedInteger;

    if (format === "percentage") {
      result = `${result}%`;
    }

    return result;
  }, [thousandsSeparator, decimalSeparator]);

  const validateNumberInput = useCallback((
    inputValue: string,
    decimalPlaces: number = 5
  ): { isValid: boolean; sanitizedValue: string } => {
    if (inputValue === "" || inputValue === "-") {
      return { isValid: true, sanitizedValue: inputValue };
    }

    const numberPattern = /^-?\d*\.?\d*$/;
    if (!numberPattern.test(inputValue)) {
      return { isValid: false, sanitizedValue: inputValue };
    }

    const parts = inputValue.replace("-", "").split(".");
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
  }, []);

  const constrainNumberInput = useCallback((
    inputValue: string,
    decimalPlaces: number = 5
  ): string => {
    if (inputValue === "" || inputValue === "-") {
      return inputValue;
    }

    const isNegative = inputValue.startsWith("-");
    let cleanValue = inputValue.replace("-", "");

    cleanValue = cleanValue.replace(/[^\d.]/g, "");

    const dotIndex = cleanValue.indexOf(".");
    if (dotIndex !== -1) {
      const beforeDot = cleanValue.substring(0, dotIndex);
      const afterDot = cleanValue.substring(dotIndex + 1).replace(/\./g, "");
      cleanValue = beforeDot + "." + afterDot;
    }

    const parts = cleanValue.split(".");
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
    if (cleanValue.includes(".")) {
      result += "." + fractionalPart;
    }

    if (isNegative && result !== "") {
      result = "-" + result;
    }

    return result;
  }, []);

  return {
    culture,
    cultureCode,
    isLoading,
    thousandsSeparator,
    decimalSeparator,
    formatNumber,
    validateNumberInput,
    constrainNumberInput,
    MAX_PRECISION,
  };
}
