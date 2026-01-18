import { create } from "zustand";
import api from "@/lib/api";
import { EventProps } from "@/utils/types";

interface EventStoreState {
  // State
  events: EventProps[];
  eventDetails: { [key: string]: EventProps };
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isRefreshing: boolean;

  // Actions
  fetchEvents: (force?: boolean) => Promise<void>;
  fetchEventById: (id: string, force?: boolean) => Promise<EventProps | null>;
  setEvents: (events: EventProps[]) => void;
  setEventDetails: (id: string, event: EventProps) => void;
  clear: () => void;
  setIsRefreshing: (value: boolean) => void;
}

/**
 * ZUSTAND EVENT STORE
 * 
 * Manages all event data globally to prevent duplicate API calls
 * 
 * USAGE:
 * - Use the `useEventStore()` hook in your component
 * - Call `fetchEvents()` to load all events (only fetches if cache is empty or forced)
 * - Call `fetchEventById(id)` to load specific event details
 * - Call `setIsRefreshing(true)` before manual refresh, then call `fetchEvents(true)`
 * 
 * EXAMPLE:
 * ```tsx
 * const { events, isLoading, fetchEvents, setIsRefreshing } = useEventStore();
 * 
 * useEffect(() => {
 *   fetchEvents(); // Only fetches first time or if cache is empty
 * }, []);
 * 
 * const handleRefresh = async () => {
 *   setIsRefreshing(true);
 *   await fetchEvents(true); // Force refresh
 *   setIsRefreshing(false);
 * };
 * ```
 */
export const useEventStore = create<EventStoreState>((set, get) => ({
  // Initial state
  events: [],
  eventDetails: {},
  isLoading: false,
  error: null,
  lastFetchTime: null,
  isRefreshing: false,

  // Fetch all events
  fetchEvents: async (force = false) => {
    const state = get();
    
    // If we already have events and it's not a forced refresh, don't fetch
    if (!force && state.events.length > 0 && state.lastFetchTime) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const data = await api.getEvents();
      if (Array.isArray(data)) {
        set({
          events: data,
          lastFetchTime: Date.now(),
          error: null,
        });
      }
    } catch (err: any) {
      set({
        error: err.message || "Failed to fetch events",
      });
      console.error("❌ Event fetch error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch individual event by ID
  fetchEventById: async (id: string, force = false) => {
    const state = get();
    
    // Return cached version if available and not forced
    if (!force && state.eventDetails[id]) {
      return state.eventDetails[id];
    }

    try {
      const data = await api.getEvent(id);
      set((state) => ({
        eventDetails: {
          ...state.eventDetails,
          [id]: data,
        },
      }));
      return data;
    } catch (err: any) {
      console.error("❌ Event detail fetch error:", err);
      return null;
    }
  },

  // Manually set events (useful for updates)
  setEvents: (events: EventProps[]) => {
    set({
      events,
      lastFetchTime: Date.now(),
    });
  },

  // Manually set individual event details
  setEventDetails: (id: string, event: EventProps) => {
    set((state) => ({
      eventDetails: {
        ...state.eventDetails,
        [id]: event,
      },
    }));
  },

  // Clear all event data
  clear: () => {
    set({
      events: [],
      eventDetails: {},
      lastFetchTime: null,
      error: null,
    });
  },

  // Set refreshing state (for UI feedback)
  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value });
  },
}));
