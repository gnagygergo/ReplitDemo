import { useQuery } from "@tanstack/react-query";

interface UseMetadataOptions {
  sourcePath: string;
  enabled?: boolean;
}

export function useMetadata<T = any>(options: UseMetadataOptions) {
  const { sourcePath, enabled = true } = options;

  return useQuery<T>({
    queryKey: ["/api/metadata", sourcePath],
    enabled: enabled && !!sourcePath,
  });
}
