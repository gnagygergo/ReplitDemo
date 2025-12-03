import { createContext, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";

export interface ObjectMeta {
  apiCode: string;
  labelSingular: string;
  labelPlural: string;
  icon: string;
  iconSet: string;
  nameField?: string;
}

export interface LayoutContextType {
  objectCode: string;
  objectMeta: ObjectMeta | null;
  record: Record<string, unknown> | null;
  form: UseFormReturn<Record<string, unknown>>;
  isEditing: boolean;
  isCreating: boolean;
  isLoading: boolean;
  setIsEditing: (editing: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export interface LayoutProviderProps {
  children: React.ReactNode;
  value: LayoutContextType;
}

export function LayoutProvider({ children, value }: LayoutProviderProps) {
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayoutContext must be used within a LayoutProvider");
  }
  return context;
}

export function useLayoutContextOptional() {
  return useContext(LayoutContext);
}
