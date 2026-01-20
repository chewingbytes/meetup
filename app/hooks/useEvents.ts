import { useEffect } from "react";
import { useEventStore } from "@/lib/stores/eventStore";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";

/**
 * CUSTOM HOOK: useEvents
 *
 * Automatically fetches events on first mount and provides store state.
 * Smart caching: only fetches if data is empty or cache expires.
 *
 * USAGE:
 * ```tsx
 * const { events, isLoading, refresh } = useEvents();
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
 * - events: Array of EventProps
 * - isLoading: boolean indicating if fetch is in progress
 * - isRefreshing: boolean indicating if user-initiated refresh is in progress
 * - error: Error message if fetch failed
 * - refresh: async function to manually refresh events (force=true)
 */
export const useEvents = (autoFetch = true) => {
  const { events, isLoading, isRefreshing, error, fetchEvents } =
    useEventStore();

  useEffect(() => {
    if (autoFetch) {
      // Fetch events on component mount (only if cache is empty)
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  const refresh = async () => {
    // Set refreshing state for UI feedback
    useEventStore.setState({ isRefreshing: true });
    try {
      await fetchEvents(true); // Force refresh
    } finally {
      useEventStore.setState({ isRefreshing: false });
    }
  };

  return {
    events,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};