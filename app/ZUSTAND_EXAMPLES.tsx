/**
 * ============================================================================
 * ZUSTAND IMPLEMENTATION - WORKING EXAMPLES
 * ============================================================================
 * 
 * Copy & paste these examples into your screens to implement Zustand!
 * All examples are ready-to-use with your current setup.
 * 
 */

// ============================================================================
// EXAMPLE 1: Home Screen with Events & Communities
// ============================================================================

/**
 * File: app/index.tsx (or any home-like screen)
 * Shows: Multiple data sources with unified refresh
 */

import { ScrollView, Text, View } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import { useCommunities } from "@/hooks/useCommunities";
import { PullToRefresh } from "@/components/pull-to-refresh";
import EventCard from "@/components/event-card";
import CommunityCard from "@/components/community-card";

export default function HomeScreen() {
  // Get events and communities from Zustand stores
  const {
    events,
    isLoading: eventsLoading,
    isRefreshing: eventsRefreshing,
    refresh: refreshEvents,
    error: eventsError,
  } = useEvents();

  const {
    communities,
    isLoading: communitiesLoading,
    isRefreshing: communitiesRefreshing,
    refresh: refreshCommunities,
    error: communitiesError,
  } = useCommunities();

  // Combined loading/refreshing state
  const isLoading = eventsLoading || communitiesLoading;
  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  // Unified refresh handler
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  // Show errors if any
  if (eventsError) return <Text>Error: {eventsError}</Text>;
  if (communitiesError) return <Text>Error: {communitiesError}</Text>;

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      {/* Events Section */}
      <View>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          Events
        </Text>
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </View>

      {/* Communities Section */}
      <View>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          Communities
        </Text>
        {communities.map(community => (
          <CommunityCard key={community.id} community={community} />
        ))}
      </View>
    </ScrollView>
  );
}

// ============================================================================
// EXAMPLE 2: Events List Screen
// ============================================================================

/**
 * File: app/explore/index.tsx
 * Shows: Displaying cached events data
 */

import { FlatList, Text } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import { PullToRefresh } from "@/components/pull-to-refresh";
import EventCard from "@/components/event-card";

export default function ExploreScreen() {
  const { events, isLoading, isRefreshing, refresh, error } = useEvents();

  if (isLoading && events.length === 0) {
    return <Text>Loading events...</Text>;
  }

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => <EventCard event={item} />}
      keyExtractor={item => item.id}
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
      ListEmptyComponent={<Text>No events found</Text>}
      ListErrorComponent={error && <Text>Error: {error}</Text>}
    />
  );
}

// ============================================================================
// EXAMPLE 3: Detail Page with Zustand Cache
// ============================================================================

/**
 * File: app/events/[id].tsx
 * Shows: Fetching and caching individual items
 */

import { ScrollView, Text } from "react-native";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useEventStore } from "@/lib/stores/eventStore";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const { eventDetails, fetchEventById } = useEventStore();
  const [loading, setLoading] = useState(!eventDetails[id as string]);

  // Fetch event on mount (uses cache if available)
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const load = async () => {
      await fetchEventById(id as string);
      if (mounted) setLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [id, fetchEventById]);

  const event = eventDetails[id as string];

  if (loading) return <NeoLoader />;
  if (!event) return <Text>Event not found</Text>;

  return (
    <ScrollView>
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
        {event.name}
      </Text>
      <Text style={{ color: "#aaa" }}>{event.location_text}</Text>
      <Text style={{ color: "#fff" }}>{event.description_md}</Text>
    </ScrollView>
  );
}

// ============================================================================
// EXAMPLE 4: Disable Auto-Fetch (Manual Load)
// ============================================================================

/**
 * File: Any screen where you want manual control
 * Shows: Using hook without auto-fetch
 */

import { Button, FlatList, Text, View } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import EventCard from "@/components/event-card";

export default function ManualLoadScreen() {
  // Pass false to prevent auto-fetch
  const { events, isLoading, refresh } = useEvents(false);

  return (
    <View style={{ flex: 1 }}>
      <Button title={isLoading ? "Loading..." : "Load Events"} onPress={refresh} />

      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard event={item} />}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>No events loaded. Tap Load to fetch.</Text>}
      />
    </View>
  );
}

// ============================================================================
// EXAMPLE 5: Direct Store Access (Advanced)
// ============================================================================

/**
 * File: Any screen with complex state management needs
 * Shows: Using store directly instead of hook
 */

import { useEffect } from "react";
import { Text, View } from "react-native";
import { useEventStore } from "@/lib/stores/eventStore";

export default function AdvancedScreen() {
  const {
    events,
    isLoading,
    error,
    lastFetchTime,
    fetchEvents,
    setEvents,
    clear,
  } = useEventStore();

  useEffect(() => {
    // Fetch events
    fetchEvents();
  }, [fetchEvents]);

  const handleUpdateEvents = () => {
    // Update cache after local mutation
    const updatedEvents = events.map(e =>
      e.id === "123" ? { ...e, name: "Updated Name" } : e
    );
    setEvents(updatedEvents);
  };

  const handleClear = () => {
    clear();
  };

  return (
    <View>
      <Text>Events: {events.length}</Text>
      <Text>Last Fetch: {lastFetchTime ? new Date(lastFetchTime).toLocaleString() : "Never"}</Text>
      {error && <Text>Error: {error}</Text>}

      <Button title="Update Event" onPress={handleUpdateEvents} />
      <Button title="Clear Cache" onPress={handleClear} />
    </View>
  );
}

// ============================================================================
// EXAMPLE 6: Creating and Using a New Store (Notifications)
// ============================================================================

/**
 * STEP 1: Create the store
 * File: lib/stores/notificationStore.ts
 */

import { create } from "zustand";

interface NotificationStoreState {
  notifications: any[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastFetchTime: number | null;

  fetchNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => void;
  clear: () => void;
  setIsRefreshing: (value: boolean) => void;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetchTime: null,

  fetchNotifications: async (force = false) => {
    const state = get();
    if (!force && state.notifications.length > 0 && state.lastFetchTime) {
      return; // Use cache
    }

    set({ isLoading: true });
    try {
      // const data = await api.getNotifications();
      // For demo:
      const data = [];
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

  markAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
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
 * File: hooks/useNotifications.ts
 */

import { useEffect } from "react";

export const useNotifications = (autoFetch = true) => {
  const {
    notifications,
    isLoading,
    isRefreshing,
    error,
    fetchNotifications,
  } = useNotificationStore();

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
 * STEP 3: Use in your component
 * File: app/notifications/index.tsx (or similar)
 */

export default function NotificationsScreen() {
  const { notifications, isRefreshing, refresh } = useNotifications();

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
    >
      {notifications.map(notif => (
        <View key={notif.id}>
          <Text>{notif.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// EXAMPLE 7: Combined Operations (Multiple Actions)
// ============================================================================

/**
 * File: Any screen needing complex data handling
 * Shows: Fetching, filtering, and updating
 */

import { useState } from "react";
import { Button, ScrollView, Text } from "react-native";
import { useEvents } from "@/hooks/useEvents";
import { useEventStore } from "@/lib/stores/eventStore";
import { PullToRefresh } from "@/components/pull-to-refresh";

export default function ComplexScreen() {
  const { events, isRefreshing, refresh } = useEvents();
  const { setEvents } = useEventStore();
  const [filter, setFilter] = useState("all");

  const filteredEvents = events.filter(event => {
    if (filter === "paid") return event.is_paid;
    if (filter === "free") return !event.is_paid;
    return true;
  });

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
  };

  return (
    <ScrollView
      refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
    >
      <Button title="Show All" onPress={() => setFilter("all")} />
      <Button title="Show Paid" onPress={() => setFilter("paid")} />
      <Button title="Show Free" onPress={() => setFilter("free")} />

      {filteredEvents.map(event => (
        <View key={event.id}>
          <Text>{event.name}</Text>
          <Button title="Delete" onPress={() => handleDeleteEvent(event.id)} />
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================================================
// EXAMPLE 8: Error Handling Best Practices
// ============================================================================

/**
 * Shows: Proper error handling patterns
 */

import { ScrollView, Text, View } from "react-native";
import { useEvents } from "@/hooks/useEvents";

export default function ErrorHandlingScreen() {
  const { events, isLoading, error, refresh } = useEvents();

  if (isLoading && events.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading events...</Text>
      </View>
    );
  }

  if (error && events.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "red" }}>Error: {error}</Text>
        <Button title="Try Again" onPress={refresh} />
      </View>
    );
  }

  return (
    <ScrollView>
      {error && (
        <View style={{ backgroundColor: "#333", padding: 10, marginBottom: 10 }}>
          <Text style={{ color: "orange" }}>⚠️ {error}</Text>
          <Button title="Retry" onPress={refresh} />
        </View>
      )}

      {events.map(event => (
        <View key={event.id}>
          <Text>{event.name}</Text>
        </View>
      ))}

      {events.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No events available
        </Text>
      )}
    </ScrollView>
  );
}

// ============================================================================
// CHEAT SHEET: Common Patterns
// ============================================================================

/*
 * PATTERN 1: Simple Load & Display
 * ---------------------------------
 * const { data, refresh, isRefreshing } = useYourData();
 * <ScrollView refreshControl={<PullToRefresh ... />}>
 *   {data.map(item => <Card key={item.id} item={item} />)}
 * </ScrollView>
 * 
 * PATTERN 2: With Error Handling
 * --------------------------------
 * const { data, error, refresh, isRefreshing } = useYourData();
 * {error && <ErrorBanner message={error} onRetry={refresh} />}
 * 
 * PATTERN 3: Manual Fetch
 * -------------------------
 * const { data, refresh } = useYourData(false); // autoFetch=false
 * <Button title="Load" onPress={refresh} />
 * 
 * PATTERN 4: Multiple Sources
 * ----------------------------
 * const { refresh: r1 } = useData1();
 * const { refresh: r2 } = useData2();
 * const handleRefresh = () => Promise.all([r1(), r2()]);
 * 
 * PATTERN 5: Detail Page
 * ----------------------
 * const { details, fetch } = useStore();
 * useEffect(() => fetch(id), [id]);
 * const item = details[id];
 */
