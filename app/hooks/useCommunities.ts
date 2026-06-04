import { usersCommunities } from "@/data/communities";
import { useAuth } from "@/lib/authContext";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { CommunityProps } from "@/utils/types";
import { useEffect } from "react";

const USE_MOCK_DATA = false;

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
    allCommunities,
    isLoading,
    isRefreshing,
    error,
    fetchCommunities,
    setCommunities,
  } = useCommunityStore();
  const { user } = useAuth();

  const mapSampleCommunities = (): CommunityProps[] => {
    return usersCommunities.map((c, idx) => ({
      ...c,
      created_at:
        (c as any).created_at ||
        (c as any).dateCreated ||
        new Date().toISOString(),
      updated_at: new Date().toISOString(),
      privacy_mode: (c as any).privacy_mode ?? (c as any).privacyMode ?? false,
      profile_image:
        (c as any).profile_image ?? (c as any).profileImage ?? null,
      owner_id: idx === 0 && user?.id ? user.id : (c as any).owner_id || null,
    })) as CommunityProps[];
  };

  useEffect(() => {
    if (!autoFetch) return;
    if (USE_MOCK_DATA) {
      setCommunities(mapSampleCommunities());
      return;
    }
    if (user?.id) {
      const userId = myCommunitiesOnly ? user.id : undefined;
      fetchCommunities(false, userId);
    }
    // Use user?.id (stable primitive) instead of `user` (object reference that
    // changes on every auth tick) to prevent re-fetching after data arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, myCommunitiesOnly, user?.id]);

  const refresh = async () => {
    if (!user && !USE_MOCK_DATA) return;
    useCommunityStore.setState({ isRefreshing: true });
    try {
      if (USE_MOCK_DATA) {
        setCommunities(mapSampleCommunities());
      } else {
        const userId = myCommunitiesOnly ? user!.id : undefined;
        await fetchCommunities(true, userId);
      }
    } finally {
      useCommunityStore.setState({ isRefreshing: false });
    }
  };

  return {
    communities: myCommunitiesOnly ? communities : allCommunities,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};
