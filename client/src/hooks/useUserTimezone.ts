import { useQuery } from "@tanstack/react-query";

export interface UserTimezoneData {
  timezone: string | null;
  isFromBrowser: boolean;
}

/**
 * Hook to get the user's preferred timezone.
 * Falls back to browser timezone if user hasn't set a preference.
 * 
 * @returns {timezone: string, isFromBrowser: boolean}
 */
export function useUserTimezone(): UserTimezoneData {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Get browser timezone as fallback
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (user?.timezone) {
    return {
      timezone: user.timezone,
      isFromBrowser: false,
    };
  }

  return {
    timezone: browserTimezone,
    isFromBrowser: true,
  };
}
