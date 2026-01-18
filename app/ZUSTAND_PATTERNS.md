/**
 * ============================================================================
 * BEFORE & AFTER: Zustand Implementation Pattern
 * ============================================================================
 * 
 * This file shows the BEFORE (old way) and AFTER (new way) patterns
 * to help you understand the migration.
 * 
 */

// ============================================================================
// PATTERN 1: Loading Data on Screen Load
// ============================================================================

/**
 * ❌ BEFORE: Direct API calls in useEffect
 * Problem: Every time screen loads, API is called
 *          No caching, slow experience
 */
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import api from "@/lib/api";

function OldEventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []); // ← Runs every time component mounts

  return (
    <ScrollView>
      {events.map(event => <Text key={event.id}>{event.name}</Text>)}
    </ScrollView>
  );
}

/**
 * ✅ AFTER: Zustand store with caching
 * Benefit: First load calls API, subsequent loads use cache
 *          Much faster experience
 */
import { useEvents } from "@/hooks/useEvents";
import { PullToRefresh } from "@/components/pull-to-refresh";

function NewEventsList() {
  const { events, isLoading, isRefreshing, refresh } = useEvents();

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
    >
      {events.map(event => <Text key={event.id}>{event.name}</Text>)}
    </ScrollView>
  );
}

/*
 * KEY DIFFERENCES:
 * 1. No useEffect needed - hook handles it automatically
 * 2. Pull-to-refresh for manual refresh - user controls when to fetch
 * 3. Caching built-in - second load is instant
 * 4. Less boilerplate - fewer state variables
 */

// ============================================================================
// PATTERN 2: Pull-to-Refresh
// ============================================================================

/**
 * ❌ BEFORE: No refresh control, API called every mount
 */
function OldWithRefresh() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* No refresh control, user has no way to refresh */}
      {events.map(event => <Text key={event.id}>{event.name}</Text>)}
    </ScrollView>
  );
}

/**
 * ✅ AFTER: Built-in refresh control
 */
function NewWithRefresh() {
  const { events, isRefreshing, refresh } = useEvents();

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
    >
      {events.map(event => <Text key={event.id}>{event.name}</Text>)}
    </ScrollView>
  );
}

/*
 * KEY BENEFITS:
 * 1. User swipes down to refresh
 * 2. Force fresh API call with refresh()
 * 3. Loading indicator automatically shown
 * 4. Cache still used for initial load
 */

// ============================================================================
// PATTERN 3: Detail Page with Caching
// ============================================================================

/**
 * ❌ BEFORE: Always fetches specific event
 * Problem: Even if event was just viewed, it fetches again
 */
function OldEventDetail({ eventId }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Always calls API, no cache
        const data = await api.getEvent(eventId);
        setEvent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]); // ← Runs every time eventId changes

  return <Text>{event?.name}</Text>;
}

/**
 * ✅ AFTER: Uses Zustand cache
 * Benefit: Event cached after first view, instant on subsequent views
 */
import { useEventStore } from "@/lib/stores/eventStore";

function NewEventDetail({ eventId }) {
  const { eventDetails, fetchEventById } = useEventStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // fetchEventById checks cache first!
      await fetchEventById(eventId);
      if (mounted) setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [eventId]);

  const event = eventDetails[eventId];
  return <Text>{event?.name}</Text>;
}

/*
 * KEY IMPROVEMENTS:
 * 1. First view: API call + cache
 * 2. Second view of same event: Instant from cache
 * 3. Switch between events: Cache used if available
 * 4. User can pull-to-refresh if needed
 */

// ============================================================================
// PATTERN 4: Multiple Data Fetches (Home Screen)
// ============================================================================

/**
 * ❌ BEFORE: Multiple separate state, no caching
 */
function OldHomeScreen() {
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getEvents().then(data => {
        setEvents(data);
        setLoadingEvents(false);
      }),
      api.getCommunities().then(data => {
        setCommunities(data);
        setLoadingCommunities(false);
      }),
    ]);
  }, []); // ← Fetches again if component remounts

  return (
    <ScrollView>
      {events.map(e => <Text key={e.id}>{e.name}</Text>)}
      {communities.map(c => <Text key={c.id}>{c.name}</Text>)}
    </ScrollView>
  );
}

/**
 * ✅ AFTER: Zustand handles caching elegantly
 */
function NewHomeScreen() {
  const { events, isLoading: eventsLoading, isRefreshing: eventsRefreshing, refresh: refreshEvents } = useEvents();
  const { communities, isLoading: communitiesLoading, isRefreshing: communitiesRefreshing, refresh: refreshCommunities } = useCommunities();

  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      {events.map(e => <Text key={e.id}>{e.name}</Text>)}
      {communities.map(c => <Text key={c.id}>{c.name}</Text>)}
    </ScrollView>
  );
}

/*
 * KEY IMPROVEMENTS:
 * 1. Cleaner code - less state management
 * 2. Smarter caching - both use global cache
 * 3. Single refresh action for all data
 * 4. Instant when navigating back to home
 */

// ============================================================================
// PATTERN 5: Creating a New Store (Example: Notifications)
// ============================================================================

/**
 * STEP 1: Create the store
 */
// lib/stores/notificationStore.ts
import { create } from "zustand";

interface NotificationStoreState {
  notifications: any[];
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  isRefreshing: boolean;

  fetchNotifications: (force?: boolean) => Promise<void>;
  clear: () => void;
  setIsRefreshing: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  lastFetchTime: null,
  isRefreshing: false,

  fetchNotifications: async (force = false) => {
    const state = get();
    if (!force && state.notifications.length > 0 && state.lastFetchTime) {
      return; // Use cache
    }

    set({ isLoading: true });
    try {
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        set({
          notifications: data,
          lastFetchTime: Date.now(),
          error: null,
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  clear: () => {
    set({ notifications: [], lastFetchTime: null, error: null });
  },

  setIsRefreshing: (value: boolean) => {
    set({ isRefreshing: value });
  },
}));

/**
 * STEP 2: Create the custom hook
 */
// hooks/useNotifications.ts
import { useEffect } from "react";
import { useNotificationStore } from "@/lib/stores/notificationStore";

export const useNotifications = (autoFetch = true) => {
  const { notifications, isLoading, isRefreshing, error, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  const refresh = async () => {
    useNotificationStore.setState({ isRefreshing: true });
    try {
      await fetchNotifications(true);
    } finally {
      useNotificationStore.setState({ isRefreshing: false });
    }
  };

  return { notifications, isLoading, isRefreshing, error, refresh };
};

/**
 * STEP 3: Use in component
 */
function NotificationsScreen() {
  const { notifications, isRefreshing, refresh } = useNotifications();

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
    >
      {notifications.map(n => <Text key={n.id}>{n.message}</Text>)}
    </ScrollView>
  );
}

/*
 * PATTERN IS ALWAYS THE SAME:
 * 1. Create store with Zustand
 * 2. Create custom hook wrapper
 * 3. Use custom hook in components
 * 
 * This ensures consistency across your app!
 */

// ============================================================================
// SUMMARY TABLE
// ============================================================================

/*
 * ASPECT              | BEFORE (API Direct)        | AFTER (Zustand)
 * --------------------|----------------------------|--------------------
 * First Load Speed    | API call (slow)            | API call (same)
 * Subsequent Loads    | API call (slow)            | Instant cache (fast!)
 * Remount Same Screen | API call (slow)            | Instant cache (fast!)
 * Manual Refresh      | No way to refresh          | Pull-to-refresh (user controls)
 * Multiple Data       | Separate state, messy      | Clean, centralized
 * Detail Page Cache   | None, re-fetches always    | Cached after first view
 * Code Lines          | ~20-30 per fetch           | ~5-10 per fetch
 * Maintainability     | Low, duplicated logic      | High, single pattern
 * 
 */
