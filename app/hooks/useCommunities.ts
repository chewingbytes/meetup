import { useEffect } from "react";
import { useCommunityStore } from "@/lib/stores/communityStore";

/**
 * CUSTOM HOOK: useCommunities
 * 
 * Automatically fetches communities on first mount and provides store state.
 * Smart caching: only fetches if data is empty or cache expires.
 * 
 * USAGE:
 * ```tsx
 * const { communities, isLoading, refresh } = useCommunities();
 * 
 * // To manually refresh:
 * const handlePullToRefresh = async () => {
 *   await refresh();
 * };
 * ```
 * 
 * PARAMETERS:
 * - autoFetch (default: true): Automatically fetch on mount
 * 
 * RETURNS:
 * - communities: Array of CommunityProps
 * - isLoading: boolean indicating if fetch is in progress
 * - isRefreshing: boolean indicating if user-initiated refresh is in progress
 * - error: Error message if fetch failed
 * - refresh: async function to manually refresh communities (force=true)
 */
export const useCommunities = (autoFetch = true) => {
  const {
    communities,
    isLoading,
    isRefreshing,
    error,
    fetchCommunities,
  } = useCommunityStore();

  useEffect(() => {
    if (autoFetch) {
      // Fetch communities on component mount (only if cache is empty)
      fetchCommunities();
    }
  }, [autoFetch, fetchCommunities]);

  const refresh = async () => {
    // Set refreshing state for UI feedback
    useCommunityStore.setState({ isRefreshing: true });
    try {
      await fetchCommunities(true); // Force refresh
    } finally {
      useCommunityStore.setState({ isRefreshing: false });
    }
  };

  return {
    communities,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};
