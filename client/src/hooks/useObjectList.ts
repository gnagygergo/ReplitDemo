/**
 * useObjectList.ts
 * 
 * PURPOSE:
 * This is a generic, object-independent hook for handling list/table views
 * of any business object (assets, accounts, quotes, etc.). It eliminates the
 * need for repetitive data-fetching logic in each table view component.
 * 
 * RESPONSIBILITIES:
 * 1. Fetches a list of records from the API with search, sorting, and pagination
 * 2. Manages loading and error states
 * 3. Provides a delete mutation for removing records
 * 4. Handles sort state and toggle logic
 * 
 * ROLE IN ARCHITECTURE:
 * This hook acts as a bridge between the API layer (/api/{objectCode}) and
 * the table view components ({object}.table_view_meta.tsx). The table view
 * receives ready-to-use data and handlers without knowing API details.
 * 
 * LINKS:
 * - API endpoints → Table view components
 * - Search/sort state → Query parameters
 * - Delete mutation → Cache invalidation
 * 
 * USAGE:
 * const { records, isLoading, searchTerm, setSearchTerm, ... } = useObjectList({
 *   objectCode: 'assets',
 *   defaultSortBy: 'serialNumber'
 * });
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSingularLabel } from "@/lib/pluralize";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration options for the useObjectList hook.
 * 
 * @param objectCode - The code identifying the object type (e.g., 'assets', 'accounts')
 * @param defaultSortBy - The default field to sort by (e.g., 'serialNumber', 'name')
 * @param defaultSortOrder - The default sort direction ('asc' or 'desc')
 * @param labelSingular - Human-readable singular name (e.g., 'Asset'). Used in toast messages.
 * @param labelPlural - Human-readable plural name (e.g., 'Assets'). Used in UI.
 */
export interface UseObjectListOptions {
  objectCode: string;
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  labelSingular?: string;
  labelPlural?: string;
}

/**
 * Return type for the useObjectList hook.
 * Contains all the data and functions a table view needs to display and interact with records.
 */
export interface UseObjectListReturn<T = Record<string, any>> {
  /** The fetched list of records */
  records: T[];
  
  /** True while records are being fetched from the API */
  isLoading: boolean;
  
  /** Error if the fetch failed */
  error: Error | null;
  
  /** Current search term */
  searchTerm: string;
  
  /** Function to update the search term */
  setSearchTerm: (term: string) => void;
  
  /** Current sort field */
  sortBy: string;
  
  /** Current sort direction */
  sortOrder: "asc" | "desc";
  
  /** Function to toggle sort on a column (switches direction if same column, resets if different) */
  handleSort: (column: string) => void;
  
  /** Mutation for deleting records */
  deleteMutation: ReturnType<typeof useMutation<void, Error, string>>;
  
  /** Handler for deleting a record (shows confirmation dialog) */
  handleDelete: (record: T, displayName: string) => void;
  
  /** The object code passed to the hook */
  objectCode: string;
  
  /** Refetch function to manually refresh the data */
  refetch: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Note: We use getSingularLabel from @/lib/pluralize
// which properly handles irregular plurals like 'opportunities' -> 'Opportunity'

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useObjectList<T extends { id: string } = Record<string, any> & { id: string }>(
  options: UseObjectListOptions
): UseObjectListReturn<T> {
  const {
    objectCode,
    defaultSortBy = "name",
    defaultSortOrder = "asc",
    labelSingular = getSingularLabel(objectCode),
  } = options;

  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // These states control filtering and sorting of the list.
  // ---------------------------------------------------------------------------

  /** Search term for filtering records */
  const [searchTerm, setSearchTerm] = useState("");
  
  /** Current field to sort by */
  const [sortBy, setSortBy] = useState<string>(defaultSortBy);
  
  /** Current sort direction */
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(defaultSortOrder);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // Fetches the list of records from /api/{objectCode} with query parameters
  // for search, sorting, and any future pagination.
  // ---------------------------------------------------------------------------

  /**
   * Build query parameters for the API request.
   * Includes sort field, sort order, and optional search term.
   */
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams({ 
      sortBy, 
      sortOrder 
    });
    
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    
    return params.toString();
  }, [sortBy, sortOrder, searchTerm]);

  /**
   * Main data query.
   * The queryKey includes all parameters so React Query knows when to refetch.
   */
  const { 
    data: records = [], 
    isLoading,
    error,
    refetch
  } = useQuery<T[]>({
    queryKey: [`/api/${objectCode}`, sortBy, sortOrder, searchTerm],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const res = await fetch(`/api/${objectCode}?${queryString}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch ${objectCode}`);
      }
      
      return res.json();
    },
  });

  // ---------------------------------------------------------------------------
  // SORTING LOGIC
  // Handles toggling sort direction when clicking on the same column,
  // or resetting to ascending when clicking on a different column.
  // ---------------------------------------------------------------------------

  /**
   * Toggle sort on a column.
   * - If clicking the same column: toggle between asc and desc
   * - If clicking a different column: sort that column ascending
   */
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      // Same column: toggle direction
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Different column: reset to ascending
      setSortBy(column);
      setSortOrder("asc");
    }
  }, [sortBy]);

  // ---------------------------------------------------------------------------
  // DELETE MUTATION
  // Handles deleting records with cache invalidation and user feedback.
  // ---------------------------------------------------------------------------

  /**
   * DELETE MUTATION
   * DELETE /api/{objectCode}/{id}
   * Deletes a record and invalidates the list cache.
   */
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/${objectCode}/${id}`);
    },
    onSuccess: () => {
      // Invalidate list cache so the deleted record disappears
      queryClient.invalidateQueries({ queryKey: [`/api/${objectCode}`] });
      
      toast({
        title: `${labelSingular} deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to delete ${labelSingular.toLowerCase()}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Delete handler with confirmation dialog.
   * @param record - The record to delete
   * @param displayName - A human-readable name to show in the confirmation dialog
   */
  const handleDelete = useCallback((record: T, displayName: string) => {
    if (confirm(`Are you sure you want to delete "${displayName}"?`)) {
      deleteMutation.mutate(record.id);
    }
  }, [deleteMutation]);

  // ---------------------------------------------------------------------------
  // RETURN VALUE
  // Everything the table view needs to display and interact with records.
  // ---------------------------------------------------------------------------

  return {
    records,
    isLoading,
    error: error as Error | null,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    handleSort,
    deleteMutation,
    handleDelete,
    objectCode,
    refetch,
  };
}

// ============================================================================
// UTILITY HOOK: useSortIcon
// A small helper hook for rendering sort direction icons in table headers.
// ============================================================================

/**
 * Hook to get the appropriate sort icon for a column.
 * Returns 'asc', 'desc', or null based on current sort state.
 * 
 * USAGE:
 * const getSortDirection = useSortDirection(sortBy, sortOrder);
 * const direction = getSortDirection('name'); // Returns 'asc', 'desc', or null
 */
export function useSortDirection(sortBy: string, sortOrder: "asc" | "desc") {
  return useCallback((column: string): "asc" | "desc" | null => {
    if (sortBy !== column) return null;
    return sortOrder;
  }, [sortBy, sortOrder]);
}
