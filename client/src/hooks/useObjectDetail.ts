/**
 * useObjectDetail.ts
 * 
 * PURPOSE:
 * This is a generic, object-independent hook for handling CRUD operations
 * on any business object (assets, accounts, quotes, etc.). It eliminates the
 * need for object-specific hooks like useAssetDetail.ts, useAccountDetail.ts, etc.
 * 
 * RESPONSIBILITIES:
 * 1. Fetches a single record by ID from the API
 * 2. Manages loading, error, and success states
 * 3. Provides create, update, and delete mutations
 * 4. Handles form initialization with field metadata
 * 5. Manages edit mode state
 * 
 * ROLE IN ARCHITECTURE:
 * This hook acts as a bridge between the API layer (/api/{objectCode}/{id}) and
 * the layout components ({object}-detail.detail_view_meta.tsx). The layout receives
 * ready-to-use data and mutation functions without knowing API details.
 * 
 * LINKS:
 * - API endpoints → Layout components
 * - Field metadata → Form default values
 * - Mutations → Cache invalidation
 * 
 * USAGE:
 * const { record, form, isEditing, ... } = useObjectDetail({
 *   objectCode: 'assets',
 *   id: 'abc-123'  // or 'new' for creating
 * });
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useObjectFieldTypes, FieldTypeMap } from "@/hooks/use-object-field-types";
import { buildDefaultFormValues, transformRecordToFormValues } from "@/lib/form-utils";
import { getSingularLabel, getPluralLabel } from "@/lib/pluralize";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for the useObjectDetail hook.
 * 
 * @param objectCode - The code identifying the object type (e.g., 'assets', 'accounts')
 * @param id - The record ID, or 'new' for creating a new record
 * @param schema - Optional Zod schema for form validation. If not provided,
 *                 a permissive schema is used that allows any fields.
 * @param labelSingular - Human-readable singular name (e.g., 'Asset'). Used in toast messages.
 * @param labelPlural - Human-readable plural name (e.g., 'Assets'). Used for navigation.
 */
export interface UseObjectDetailOptions {
  objectCode: string;
  id: string | undefined;
  schema?: z.ZodSchema<any>;
  labelSingular?: string;
  labelPlural?: string;
}

/**
 * Return type for the useObjectDetail hook.
 * Contains all the data and functions a layout needs to render and interact with a record.
 */
export interface UseObjectDetailReturn<T = Record<string, any>> {
  /** The fetched record data, or undefined if loading/not found */
  record: T | undefined;
  
  /** True while the record is being fetched from the API */
  isLoading: boolean;
  
  /** True if we're creating a new record (id === 'new') */
  isCreating: boolean;
  
  /** True if the form is in edit mode */
  isEditing: boolean;
  
  /** Function to toggle edit mode */
  setIsEditing: (editing: boolean) => void;
  
  /** React Hook Form instance, pre-configured with validation and defaults */
  form: UseFormReturn<any>;
  
  /** Mutation for creating new records (POST /api/{objectCode}) */
  createMutation: UseMutationResult<T, Error, any, unknown>;
  
  /** Mutation for updating existing records (PATCH /api/{objectCode}/{id}) */
  updateMutation: UseMutationResult<T, Error, Partial<any>, unknown>;
  
  /** Mutation for deleting records (DELETE /api/{objectCode}/{id}) */
  deleteMutation: UseMutationResult<void, Error, void, unknown>;
  
  /** Submit handler - automatically calls create or update based on mode */
  onSubmit: (data: any) => void;
  
  /** Cancel handler - resets form and exits edit mode, or navigates back if creating */
  handleCancel: () => void;
  
  /** Delete handler - calls delete mutation and navigates back */
  handleDelete: () => void;
  
  /** The object code passed to the hook */
  objectCode: string;
  
  /** The record ID (undefined if creating) */
  id: string | undefined;
  
  /** Field metadata map for the object type */
  fieldTypeMap: FieldTypeMap;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Note: We use getSingularLabel and getPluralLabel from @/lib/pluralize
// which properly handles irregular plurals like 'opportunities' -> 'Opportunity'

/**
 * Creates a permissive Zod schema that accepts any object.
 * Used when no specific schema is provided.
 */
function createPermissiveSchema(): z.ZodSchema<any> {
  return z.record(z.any());
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useObjectDetail<T = Record<string, any>>(
  options: UseObjectDetailOptions
): UseObjectDetailReturn<T> {
  const { 
    objectCode, 
    id, 
    schema,
    labelSingular = getSingularLabel(objectCode),
    labelPlural = getPluralLabel(objectCode)
  } = options;

  // ---------------------------------------------------------------------------
  // ROUTING & STATE
  // ---------------------------------------------------------------------------
  
  const [, setLocation] = useLocation();
  
  /** Determine if we're creating a new record based on the ID */
  const isCreating = id === "new";
  
  /** Edit mode state - starts true if creating, false if viewing existing */
  const [isEditing, setIsEditing] = useState(isCreating);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ---------------------------------------------------------------------------
  // FIELD METADATA
  // Fetches the field type definitions for this object from /api/object-fields/{objectCode}
  // This tells us what fields exist and their types (text, number, date, etc.)
  // ---------------------------------------------------------------------------
  
  const { data: fieldTypeMap = {} } = useObjectFieldTypes({ 
    objectCode,
    enabled: !!objectCode 
  });

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // Fetches the record from /api/{objectCode}/{id}
  // Only runs if we have an ID and are not creating a new record
  // ---------------------------------------------------------------------------
  
  const { data: record, isLoading } = useQuery<T>({
    queryKey: [`/api/${objectCode}`, id],
    enabled: !!id && !isCreating,
  });

  // ---------------------------------------------------------------------------
  // FORM INITIALIZATION
  // Uses refs to track initialization state and prevent re-initialization
  // on every render. This is important for performance and user experience.
  // ---------------------------------------------------------------------------
  
  /** Tracks whether the form has been initialized with data */
  const formInitializedRef = useRef(false);
  
  /** Tracks the last ID to detect when we navigate to a different record */
  const lastIdRef = useRef<string | undefined>(id);
  
  /** True when we have field metadata loaded */
  const hasFieldMetadata = Object.keys(fieldTypeMap).length > 0;

  /**
   * Build default form values from field metadata.
   * Each field type gets an appropriate default (empty string, null, false, etc.)
   */
  const defaultFormValues = useMemo(() => 
    buildDefaultFormValues(fieldTypeMap),
    [fieldTypeMap]
  );

  /**
   * Initialize the form with validation schema and defaults.
   * Uses the provided schema or falls back to a permissive schema.
   */
  const validationSchema = schema || createPermissiveSchema();
  
  const form = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultFormValues,
  });

  /**
   * Reset form initialization when navigating to a different record.
   * This ensures the form gets re-populated with the new record's data.
   */
  useEffect(() => {
    if (lastIdRef.current !== id) {
      formInitializedRef.current = false;
      lastIdRef.current = id;
    }
  }, [id]);

  /**
   * Initialize or reset the form when data becomes available.
   * - For new records: populate with default values from metadata
   * - For existing records: populate with the fetched record data
   */
  useEffect(() => {
    // Skip if already initialized
    if (formInitializedRef.current) return;
    
    if (isCreating && hasFieldMetadata) {
      // Creating: use default values
      form.reset(defaultFormValues);
      formInitializedRef.current = true;
    } else if (!isCreating && record && hasFieldMetadata) {
      // Editing existing: transform record to form values
      const formValues = transformRecordToFormValues(record as Record<string, any>, fieldTypeMap);
      form.reset(formValues);
      formInitializedRef.current = true;
    }
  }, [isCreating, hasFieldMetadata, record, fieldTypeMap, defaultFormValues, form]);

  /**
   * Reset edit mode when ID changes (e.g., after creating a new record)
   */
  useEffect(() => {
    setIsEditing(id === "new");
  }, [id]);

  // ---------------------------------------------------------------------------
  // MUTATIONS
  // These handle create, update, and delete operations with proper
  // cache invalidation and user feedback via toast notifications.
  // ---------------------------------------------------------------------------

  /**
   * CREATE MUTATION
   * POST /api/{objectCode}
   * Creates a new record and navigates to it on success.
   */
  const createMutation = useMutation<T, Error, any>({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/${objectCode}`, data);
      return await response.json();
    },
    onSuccess: (newRecord: any) => {
      // Invalidate list cache so the new record appears
      queryClient.invalidateQueries({ queryKey: [`/api/${objectCode}`] });
      
      toast({
        title: `${labelSingular} created successfully`,
      });
      
      setIsEditing(false);
      
      // Navigate to the newly created record
      setLocation(`/${objectCode}/${newRecord.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to create ${labelSingular.toLowerCase()}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * UPDATE MUTATION
   * PATCH /api/{objectCode}/{id}
   * Updates an existing record.
   */
  const updateMutation = useMutation<T, Error, Partial<any>>({
    mutationFn: async (data: Partial<any>) => {
      const response = await apiRequest("PATCH", `/api/${objectCode}/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate both list and detail caches
      queryClient.invalidateQueries({ queryKey: [`/api/${objectCode}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${objectCode}`, id] });
      
      toast({
        title: `${labelSingular} updated successfully`,
      });
      
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to update ${labelSingular.toLowerCase()}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * DELETE MUTATION
   * DELETE /api/{objectCode}/{id}
   * Deletes the record and navigates back to the list.
   */
  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/${objectCode}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${objectCode}`] });
      
      toast({
        title: `${labelSingular} deleted successfully`,
      });
      
      // Navigate back to list view
      setLocation(`/${objectCode}`);
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to delete ${labelSingular.toLowerCase()}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ---------------------------------------------------------------------------
  // ACTION HANDLERS
  // These wrap the mutations and provide a clean API for layouts.
  // ---------------------------------------------------------------------------

  /**
   * Submit handler - automatically calls the appropriate mutation
   * based on whether we're creating or updating.
   */
  const onSubmit = (data: any) => {
    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  /**
   * Cancel handler - exits edit mode and resets form, or navigates
   * back to list if we were creating a new record.
   */
  const handleCancel = () => {
    if (isCreating) {
      // Navigate back to list when canceling creation
      setLocation(`/${objectCode}`);
    } else {
      // Reset form to original values and exit edit mode
      setIsEditing(false);
      if (record) {
        const formValues = transformRecordToFormValues(
          record as Record<string, any>, 
          fieldTypeMap
        );
        form.reset(formValues);
      }
    }
  };

  /**
   * Delete handler - confirms with user then deletes the record.
   */
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete this ${labelSingular.toLowerCase()}?`)) {
      deleteMutation.mutate();
    }
  };

  // ---------------------------------------------------------------------------
  // RETURN VALUE
  // Everything the layout needs to render and interact with the record.
  // ---------------------------------------------------------------------------

  return {
    record,
    isLoading,
    isCreating,
    isEditing,
    setIsEditing,
    form,
    createMutation,
    updateMutation,
    deleteMutation,
    onSubmit,
    handleCancel,
    handleDelete,
    objectCode,
    id,
    fieldTypeMap,
  };
}
