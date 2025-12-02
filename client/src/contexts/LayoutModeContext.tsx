import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface FieldRegistration {
  fieldId: string;
  value: string | number | null | undefined;
  isEmpty: boolean;
}

interface LayoutModeContextType {
  registerField: (fieldId: string, value: string | number | null | undefined) => void;
  unregisterField: (fieldId: string) => void;
  updateFieldValue: (fieldId: string, value: string | number | null | undefined) => void;
  validateMandatoryFields: () => boolean;
  getFieldError: (fieldId: string) => string | null;
  clearAllErrors: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextType | null>(null);

export function LayoutModeProvider({ children }: { children: React.ReactNode }) {
  const fieldsRef = useRef<Map<string, FieldRegistration>>(new Map());
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  const isValueEmpty = (value: string | number | null | undefined): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  };

  const registerField = useCallback((fieldId: string, value: string | number | null | undefined) => {
    fieldsRef.current.set(fieldId, {
      fieldId,
      value,
      isEmpty: isValueEmpty(value),
    });
  }, []);

  const unregisterField = useCallback((fieldId: string) => {
    fieldsRef.current.delete(fieldId);
    setFieldErrors((prev) => {
      const next = new Map(prev);
      next.delete(fieldId);
      return next;
    });
  }, []);

  const updateFieldValue = useCallback((fieldId: string, value: string | number | null | undefined) => {
    const existing = fieldsRef.current.get(fieldId);
    const wasEmpty = existing?.isEmpty ?? true;
    const nowEmpty = isValueEmpty(value);
    
    if (existing) {
      existing.value = value;
      existing.isEmpty = nowEmpty;
    }
    
    // Only clear errors when value changes from empty to non-empty
    // This prevents clearing errors during re-renders with the same value
    if (wasEmpty && !nowEmpty) {
      setFieldErrors((prev) => {
        if (prev.has(fieldId)) {
          const next = new Map(prev);
          next.delete(fieldId);
          return next;
        }
        return prev;
      });
    }
  }, []);

  const validateMandatoryFields = useCallback((): boolean => {
    const errors = new Map<string, string>();
    let isValid = true;

    fieldsRef.current.forEach((field) => {
      if (field.isEmpty) {
        errors.set(field.fieldId, "This field is mandatory");
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  }, []);

  const getFieldError = useCallback((fieldId: string): string | null => {
    return fieldErrors.get(fieldId) || null;
  }, [fieldErrors]);

  const clearAllErrors = useCallback(() => {
    setFieldErrors(new Map());
  }, []);

  return (
    <LayoutModeContext.Provider
      value={{
        registerField,
        unregisterField,
        updateFieldValue,
        validateMandatoryFields,
        getFieldError,
        clearAllErrors,
      }}
    >
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode() {
  const context = useContext(LayoutModeContext);
  if (!context) {
    throw new Error("useLayoutMode must be used within a LayoutModeProvider");
  }
  return context;
}

export function useLayoutModeOptional() {
  return useContext(LayoutModeContext);
}

interface UseLayoutMandatoryFieldProps {
  fieldId: string;
  value: string | number | null | undefined;
  layoutMandatory?: string | boolean;
}

export function useLayoutMandatoryField({
  fieldId,
  value,
  layoutMandatory,
}: UseLayoutMandatoryFieldProps) {
  const context = useLayoutModeOptional();
  
  const isMandatory = 
    layoutMandatory === true || 
    layoutMandatory === "true" || 
    layoutMandatory === "True" || 
    layoutMandatory === "TRUE";

  useEffect(() => {
    if (!context || !isMandatory) return;

    context.registerField(fieldId, value);

    return () => {
      context.unregisterField(fieldId);
    };
  }, [context, fieldId, isMandatory]);

  useEffect(() => {
    if (!context || !isMandatory) return;
    context.updateFieldValue(fieldId, value);
  }, [context, fieldId, value, isMandatory]);

  const error = context && isMandatory ? context.getFieldError(fieldId) : null;

  return { error, isMandatory };
}
