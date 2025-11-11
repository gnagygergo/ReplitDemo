import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format as formatDate } from "date-fns";
import { useAuth } from "./useAuth";
import type { CultureCode } from "@shared/schema";

const DEFAULT_CULTURE_CODE = "en-US";

export function useDateTimeFormat() {
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

  const formatDateValue = useMemo(() => {
    return (date: Date | null, fieldType: "Date" | "Time" | "DateTime"): string => {
      if (!date) return "-";
      
      const localDate = new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        0,
        0
      );
      
      if (!culture) return formatDate(localDate, "MM-dd-yyyy HH:mm");
      
      try {
        switch (fieldType) {
          case "Date":
            return formatDate(localDate, convertToDateFnsFormat(culture.dateFormat));
          case "Time":
            return formatDate(localDate, convertToDateFnsFormat(culture.timeFormat));
          case "DateTime":
            return formatDate(localDate, convertToDateFnsFormat(culture.dateTimeFormat));
          default:
            return "-";
        }
      } catch (error) {
        console.error("Error formatting date:", error);
        return "-";
      }
    };
  }, [culture]);

  return {
    culture,
    cultureCode,
    isLoading,
    dateFormat: culture?.dateFormat || "MM-dd-yyyy",
    timeFormat: culture?.timeFormat || "HH:mm",
    dateTimeFormat: culture?.dateTimeFormat || "MM-dd-yyyy HH:mm",
    defaultTimePresentation: culture?.defaultTimePresentation || "12h",
    formatDateValue,
  };
}

function convertToDateFnsFormat(xmlFormat: string): string {
  let result = xmlFormat;
  
  result = result.replace(/yyyy/g, "yyyy");
  result = result.replace(/yy/g, "yy");
  
  result = result.replace(/MMMM/g, "MMMM");
  result = result.replace(/MMM/g, "MMM");
  result = result.replace(/MM/g, "MM");
  result = result.replace(/M(?!M)/g, "M");
  
  result = result.replace(/dddd/g, "EEEE");
  result = result.replace(/ddd/g, "EEE");
  result = result.replace(/dd/g, "dd");
  result = result.replace(/d(?!d)/g, "d");
  
  result = result.replace(/HH/g, "HH");
  result = result.replace(/H(?!H)/g, "H");
  result = result.replace(/hh/g, "hh");
  result = result.replace(/h(?!h)/g, "h");
  
  result = result.replace(/mm/g, "mm");
  result = result.replace(/m(?!m)/g, "m");
  
  result = result.replace(/ss/g, "ss");
  result = result.replace(/s(?!s)/g, "s");
  
  result = result.replace(/tt/g, "aa");
  result = result.replace(/t(?!t)/g, "a");
  
  return result;
}
