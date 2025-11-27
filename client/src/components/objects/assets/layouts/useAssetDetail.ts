import { useState, useEffect, useMemo, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AssetWithDetails,
  type InsertAsset,
  insertAssetSchema,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useObjectFieldTypes } from "@/hooks/use-object-field-types";
import { buildDefaultFormValues, transformRecordToFormValues } from "@/lib/form-utils";

export interface UseAssetDetailReturn {
  asset: AssetWithDetails | undefined;
  isLoading: boolean;
  isCreating: boolean;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  form: UseFormReturn<InsertAsset>;
  createMutation: UseMutationResult<AssetWithDetails, Error, InsertAsset, unknown>;
  updateMutation: UseMutationResult<AssetWithDetails, Error, Partial<InsertAsset>, unknown>;
  onSubmit: (data: InsertAsset) => void;
  handleCancel: () => void;
  params: { id?: string } | null;
}

export function useAssetDetail(): UseAssetDetailReturn {
  const [match, params] = useRoute("/assets/:id");
  const [, setLocation] = useLocation();
  const isCreating = params?.id === "new";
  const [isEditing, setIsEditing] = useState(isCreating);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: fieldTypeMap = {} } = useObjectFieldTypes({ objectCode: "assets" });

  const { data: asset, isLoading } = useQuery<AssetWithDetails>(
    {
      queryKey: ["/api/assets", params?.id],
      enabled: !!params?.id && !isCreating,
    },
  );

  const formInitializedRef = useRef(false);
  const lastAssetIdRef = useRef<string | undefined>(params?.id);
  
  const hasFieldMetadata = Object.keys(fieldTypeMap).length > 0;

  const defaultFormValues = useMemo(() => 
    buildDefaultFormValues(fieldTypeMap) as InsertAsset,
    [fieldTypeMap]
  );

  const form = useForm<InsertAsset>({
    resolver: zodResolver(insertAssetSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (lastAssetIdRef.current !== params?.id) {
      formInitializedRef.current = false;
      lastAssetIdRef.current = params?.id;
    }
  }, [params?.id]);

  useEffect(() => {
    if (formInitializedRef.current) return;
    
    if (isCreating && hasFieldMetadata) {
      form.reset(defaultFormValues);
      formInitializedRef.current = true;
    } else if (!isCreating && asset && hasFieldMetadata) {
      const formValues = transformRecordToFormValues(asset, fieldTypeMap) as InsertAsset;
      form.reset(formValues);
      formInitializedRef.current = true;
    }
  }, [isCreating, hasFieldMetadata, asset, fieldTypeMap, defaultFormValues, form]);

  const createMutation = useMutation<AssetWithDetails, Error, InsertAsset>({
    mutationFn: async (data: InsertAsset) => {
      const response = await apiRequest("POST", "/api/assets", data);
      return await response.json();
    },
    onSuccess: (newAsset: AssetWithDetails) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({
        title: "Asset created successfully",
      });
      setIsEditing(false);
      setLocation(`/assets/${newAsset.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation<AssetWithDetails, Error, Partial<InsertAsset>>({
    mutationFn: async (data: Partial<InsertAsset>) => {
      const response = await apiRequest(
        "PATCH",
        `/api/assets/${params?.id}`,
        data,
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assets", params?.id] });
      toast({
        title: "Asset updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAsset) => {
    if (isCreating) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      setLocation("/assets");
    } else {
      setIsEditing(false);
      if (asset) {
        const formValues = transformRecordToFormValues(asset, fieldTypeMap) as InsertAsset;
        form.reset(formValues);
      }
    }
  };

  return {
    asset,
    isLoading,
    isCreating,
    isEditing,
    setIsEditing,
    form,
    createMutation,
    updateMutation,
    onSubmit,
    handleCancel,
    params,
  };
}
