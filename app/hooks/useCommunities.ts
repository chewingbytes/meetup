import { useEffect } from "react";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { useAuth } from "@/lib/authContext";

/**
 * CUSTOM HOOK: useCommunities
 * 
 * Automatically fetches communities on first mount and provides store state.
 * Smart caching: only fetches if data is empty or cache expires.
 * 
 * USAGE:
 * ```tsx
 * const { communities, isLoading, refresh } = useCommunities();
 * // Or fetch only user's communities:
 * const { communities, isLoading, refresh } = useCommunities(true, true);
 * 
 * // To manually refresh:
 * const handlePullToRefresh = async () => {
 *   await refresh();
 * };
 * ```
 * 
 * PARAMETERS:
 * - autoFetch (default: true): Automatically fetch on mount
 * - myCommunitiesOnly (default: true): Fetch only user's joined communities
 * 
 * RETURNS:
 * - communities: Array of CommunityProps
 * - isLoading: boolean indicating if fetch is in progress
 * - isRefreshing: boolean indicating if user-initiated refresh is in progress
 * - error: Error message if fetch failed
 * - refresh: async function to manually refresh communities (force=true)
 */
export const useCommunities = (autoFetch = true, myCommunitiesOnly = true) => {
  const {
    communities,
    isLoading,
    isRefreshing,
    error,
    fetchCommunities,
  } = useCommunityStore();
  const { user } = useAuth();

  useEffect(() => {
    if (autoFetch && user) {
      // Fetch communities on component mount (only if cache is empty)
      const userId = myCommunitiesOnly ? user.id : undefined;
      fetchCommunities(false, userId);
    }
  }, [autoFetch, myCommunitiesOnly, user, fetchCommunities]);

  const refresh = async () => {
    if (!user) return;
    // Set refreshing state for UI feedback
    useCommunityStore.setState({ isRefreshing: true });
    try {
      const userId = myCommunitiesOnly ? user.id : undefined;
      await fetchCommunities(true, userId); // Force refresh
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
