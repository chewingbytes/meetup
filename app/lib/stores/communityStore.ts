import { create } from "zustand";
import api from "@/lib/api";
import { CommunityProps } from "@/utils/types";

interface CommunityStoreState {
  // State
  communities: CommunityProps[];
  communityDetails: { [key: string]: CommunityProps };
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isRefreshing: boolean;

  // Actions
  fetchCommunities: (force?: boolean) => Promise<void>;
  fetchCommunityById: (id: string, force?: boolean) => Promise<CommunityProps | null>;
  setCommunities: (communities: CommunityProps[]) => void;
  setCommunityDetails: (id: string, community: CommunityProps) => void;
  clear: () => void;
  setIsRefreshing: (value: boolean) => void;
}

/**
 * ZUSTAND COMMUNITY STORE
 * 
 * Manages all community data globally to prevent duplicate API calls
 * 
 * USAGE:
 * - Use the `useCommunityStore()` hook in your component
 * - Call `fetchCommunities()` to load all communities (only fetches if cache is empty or forced)
 * - Call `fetchCommunityById(id)` to load specific community details
 * - Call `setIsRefreshing(true)` before manual refresh, then call `fetchCommunities(true)`
 * 
 * EXAMPLE:
 * ```tsx
 * const { communities, isLoading, fetchCommunities, setIsRefreshing } = useCommunityStore();
 * 
 * useEffect(() => {
 *   fetchCommunities(); // Only fetches first time or if cache is empty
 * }, []);
 * 
 * const handleRefresh = async () => {
 *   setIsRefreshing(true);
 *   await fetchCommunities(true); // Force refresh
 *   setIsRefreshing(false);
 * };
 * ```
 */
export const useCommunityStore = create<CommunityStoreState>((set, get) => ({
  // Initial state
  communities: [],
  communityDetails: {},
  isLoading: false,
  error: null,
  lastFetchTime: null,
  isRefreshing: false,

  // Fetch all communities
  fetchCommunities: async (force = false) => {
    const state = get();
    
    // If we already have communities and it's not a forced refresh, don't fetch
    if (!force && state.communities.length > 0 && state.lastFetchTime) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await api.getCommunities();
      if (Array.isArray(data)) {
        set({
          communities: data,
          lastFetchTime: Date.now(),
          error: null,
        });
      }
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch communities",
      });
      console.error("❌ Community fetch error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch individual community by ID
  fetchCommunityById: async (id: string, force = false) => {
    const state = get();
    
    // Return cached version if available and not forced
    if (!force && state.communityDetails[id]) {
      return state.communityDetails[id];
    }

    try {
      const data = await api.getCommunity(id);
      set((state) => ({
        communityDetails: {
          ...state.communityDetails,
          [id]: data,
        },
      }));
      return data;
    } catch (err: any) {
      console.error("❌ Community detail fetch error:", err);
      return null;
    }
  },

  // Manually set communities (useful for updates)
  setCommunities: (communities: CommunityProps[]) => {
    set({
      communities,
      lastFetchTime: Date.now(),
    });
  },

  // Manually set individual community details
  setCommunityDetails: (id: string, community: CommunityProps) => {
    set((state) => ({
      communityDetails: {
        ...state.communityDetails,
        [id]: community,
      },
    }));
  },

  // Clear all community data
  clear: () => {
    set({
      communities: [],
      communityDetails: {},
      lastFetchTime: null,
      error: null,
    });
  },

  // Set refreshing state (for UI feedback)
  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value });
  },
}));
