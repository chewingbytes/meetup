import { create } from "zustand";
import api from "@/lib/api";
import { EventProps } from "@/utils/types";
import { sampleEvents } from "@/data/event";

const USE_MOCK_DATA = false;

const parseTimeToHours = (time: string) => {
  const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return { hours: 18, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
};

const mapSampleEvents = (): EventProps[] => {
  return sampleEvents.map((ev, idx) => {
    const parsed = Date.parse(`${ev.date} ${ev.time}`);
    const start = new Date(Number.isNaN(parsed) ? Date.now() : parsed);
    if (Number.isNaN(parsed)) {
      const { hours, minutes } = parseTimeToHours(ev.time);
      start.setDate(start.getDate() + idx + 1);
      start.setHours(hours, minutes, 0, 0);
    }
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const communityId = `c${(idx % 8) + 1}`;
    return {
      id: ev.id,
      name: ev.title,
      description: ev.description,
      startDate: start.toISOString(),
      startTime: start.toISOString(),
      startAnytime: false,
      end_at: end.toISOString(),
      location_text: ev.location,
      cover_image: ev.image,
      is_paid: false,
      price: null,
      visibility: "public",
      capacity: 40,
      community_id: communityId,
      organizer_id: null,
      created_at: start.toISOString(),
      updated_at: start.toISOString(),
    } as EventProps;
  });
};

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
  fetchEventsByBounds: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => Promise<void>;
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
      if (USE_MOCK_DATA) {
        const data = mapSampleEvents();
        set({
          events: data,
          lastFetchTime: Date.now(),
          error: null,
        });
      } else {
        const data = await api.getEvents();
        if (Array.isArray(data)) {
          set({
            events: data,
            lastFetchTime: Date.now(),
            error: null,
          });
        }
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

  // Fetch events within a lat/lng bounding box (used by the map)
  // Intentionally does NOT set isLoading — this is a silent background refresh
  // so the full-screen overlay doesn't flash on every region change.
  // Merges by ID so existing object references are preserved: React key
  // reconciliation skips remounting markers whose event object didn't change,
  // preventing native view create/destroy cycles on every pan.
  fetchEventsByBounds: async (bounds) => {
    console.log(`[STORE] fetch start | lat=[${bounds.minLat.toFixed(4)},${bounds.maxLat.toFixed(4)}] lng=[${bounds.minLng.toFixed(4)},${bounds.maxLng.toFixed(4)}] existing=${get().events.length}`);
    const t0 = Date.now();
    try {
      const data = await api.getEvents(bounds);
      const fetchMs = Date.now() - t0;
      console.log(`[STORE] server replied in ${fetchMs}ms | isArray=${Array.isArray(data)} count=${Array.isArray(data) ? data.length : "N/A"}`);
      if (Array.isArray(data)) {
        const existing = get().events;
        const existingById = new Map(existing.map((e) => [e.id, e]));

        // ACCUMULATE + STABLE REFS:
        // Only append genuinely new events. Never replace existing object references
        // with fresh server objects — even identical data creates a new JS object,
        // which breaks React.memo's shallow prop comparison and causes every
        // EventMarker to re-render on every fetch.
        const added = data.filter((e) => !existingById.has(e.id));
        // Cap: when the store grows past 1000, keep the 1000 most recently added.
        // At ~2-3KB per event object this is ~2-3MB of JS memory — acceptable.
        // Raising from 300 prevents evicting events the user already visited when
        // they pan back to a prior region.
        const appended = added.length > 0 ? [...existing, ...added] : existing;
        const merged = appended.length > 1000 ? appended.slice(appended.length - 1000) : appended;

        const hasChanges = added.length > 0;

        console.log(
          `[STORE] done in ${fetchMs}ms | returned=${data.length} existing=${existing.length} merged=${merged.length} hasChanges=${hasChanges}`,
        );
        if (hasChanges) {
          set({ events: merged, lastFetchTime: Date.now(), error: null });
          console.log(`[STORE] store updated → ${merged.length} events`);
        } else {
          console.log("[STORE] store skipped — no changes");
        }
      }
    } catch (err: any) {
      console.error(`[STORE] fetchEventsByBounds error after ${Date.now() - t0}ms:`, err);
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
      if (USE_MOCK_DATA) {
        const data = mapSampleEvents().find((ev) => ev.id === id) || null;
        if (data) {
          set((state) => ({
            eventDetails: {
              ...state.eventDetails,
              [id]: data,
            },
          }));
        }
        return data;
      }
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
