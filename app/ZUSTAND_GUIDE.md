/**
 * ============================================================================
 * ZUSTAND GLOBAL STATE MANAGEMENT - IMPLEMENTATION GUIDE
 * ============================================================================
 * 
 * This guide explains how to use the Zustand stores and add new ones for
 * additional features beyond events and communities.
 * 
 * 📁 FILE STRUCTURE:
 * lib/stores/
 *   ├── eventStore.ts          # Global events state
 *   └── communityStore.ts      # Global communities state
 * 
 * hooks/
 *   ├── useEvents.ts           # Custom hook for events
 *   └── useCommunities.ts      # Custom hook for communities
 * 
 * components/
 *   └── pull-to-refresh.tsx    # Reusable refresh UI component
 * 
 * ============================================================================
 * QUICK START: How to Use Existing Stores
 * ============================================================================
 * 
 * 1. IN A COMPONENT:
 * -------------------
 * 
 * // Import the custom hook (easiest way)
 * import { useEvents } from "@/hooks/useEvents";
 * 
 * export default function MyComponent() {
 *   const { events, isLoading, isRefreshing, error, refresh } = useEvents();
 * 
 *   return (
 *     <ScrollView 
 *       refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 *     >
 *       {events.map(event => <EventCard key={event.id} event={event} />)}
 *     </ScrollView>
 *   );
 * }
 * 
 * ============================================================================
 * HOW IT WORKS (Important to Understand!)
 * ============================================================================
 * 
 * 🔄 THE FLOW:
 * 
 * 1. FIRST MOUNT (Initial Load):
 *    - useEvents() hook mounts
 *    - fetchEvents() is called automatically
 *    - Zustand checks: "Do we have events already?" 
 *    - If NO → API call made, data cached in store
 *    - If YES → Return cached data (NO API CALL)
 * 
 * 2. USER PULLS TO REFRESH:
 *    - User drags down to trigger refresh
 *    - Call refresh() function
 *    - refresh() sets isRefreshing = true
 *    - Calls fetchEvents(true) with force = true
 *    - Forces API call regardless of cache
 *    - Updates store with fresh data
 *    - Sets isRefreshing = false when done
 * 
 * 3. SUBSEQUENT COMPONENT MOUNTS:
 *    - New component uses useEvents()
 *    - fetchEvents() called, but cache exists
 *    - Returns cached data instantly (NO API CALL)
 *    - Component receives events immediately
 * 
 * ✅ BENEFITS:
 * - Eliminates duplicate API calls
 * - Instant data for already-loaded components
 * - Consistent data across app
 * - User controls refresh timing
 * 
 * ============================================================================
 * DETAILED USAGE EXAMPLES
 * ============================================================================
 * 
 * EXAMPLE 1: Simple Component with Auto-Fetch
 * ============================================
 * 
 * import { useEvents } from "@/hooks/useEvents";
 * import { ScrollView, Text, View } from "react-native";
 * import { PullToRefresh } from "@/components/pull-to-refresh";
 * 
 * export default function EventsList() {
 *   // This automatically fetches events on first mount
 *   const { events, isLoading, isRefreshing, refresh } = useEvents();
 * 
 *   if (isLoading) return <Text>Loading...</Text>;
 * 
 *   return (
 *     <ScrollView
 *       refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 *     >
 *       {events.map(event => (
 *         <View key={event.id}>
 *           <Text>{event.name}</Text>
 *         </View>
 *       ))}
 *     </ScrollView>
 *   );
 * }
 * 
 * EXAMPLE 2: Disable Auto-Fetch, Manual Fetch Later
 * =================================================
 * 
 * import { useEvents } from "@/hooks/useEvents";
 * 
 * export default function MyComponent() {
 *   // Set autoFetch to false to prevent automatic fetch
 *   const { events, refresh } = useEvents(false);
 * 
 *   // Manually fetch when you need
 *   const handleLoadMore = async () => {
 *     await refresh();
 *   };
 * 
 *   return <Button onPress={handleLoadMore} title="Load Events" />;
 * }
 * 
 * EXAMPLE 3: Direct Store Access (Advanced)
 * ==========================================
 * 
 * import { useEventStore } from "@/lib/stores/eventStore";
 * 
 * export default function MyComponent() {
 *   // Access store directly (useful for complex scenarios)
 *   const { events, fetchEvents } = useEventStore();
 * 
 *   const customLoad = async () => {
 *     // Force refresh even if cache exists
 *     await fetchEvents(true);
 *   };
 * 
 *   return <Button onPress={customLoad} />;
 * }
 * 
 * EXAMPLE 4: Accessing Cached Event Details
 * ==========================================
 * 
 * import { useEventStore } from "@/lib/stores/eventStore";
 * 
 * export default function EventDetail({ eventId }) {
 *   const { eventDetails, fetchEventById } = useEventStore();
 * 
 *   useEffect(() => {
 *     // Fetches from cache if available, otherwise hits API
 *     fetchEventById(eventId);
 *   }, [eventId]);
 * 
 *   const event = eventDetails[eventId];
 *   return <Text>{event?.name}</Text>;
 * }
 * 
 * ============================================================================
 * STATE PROPERTIES EXPLAINED
 * ============================================================================
 * 
 * FROM useEvents() OR useCommunities():
 * 
 * - events / communities (array)
 *   The actual data from the API
 * 
 * - isLoading (boolean)
 *   True while API call is in progress
 *   Use this for initial loading spinner
 * 
 * - isRefreshing (boolean)
 *   True specifically during user-initiated refresh
 *   Use this for RefreshControl's "refreshing" prop
 * 
 * - error (string | null)
 *   Error message if fetch failed
 *   Use this to show error messages to user
 * 
 * - refresh (function)
 *   Async function to manually refresh data
 *   Called by pull-to-refresh gesture
 *   Always forces fresh API call
 * 
 * ============================================================================
 * STORE PROPERTIES (Advanced - Direct Store Access)
 * ============================================================================
 * 
 * When using useEventStore() directly:
 * 
 * - eventDetails (object)
 *   Cache for individual event details
 *   Structure: { [eventId]: EventData, ... }
 * 
 * - lastFetchTime (number | null)
 *   Unix timestamp of last successful fetch
 *   Used to determine if cache should be used
 * 
 * - fetchEvents(force?: boolean)
 *   force = false: Return cache if available
 *   force = true: Always fetch fresh data
 * 
 * - fetchEventById(id, force?: boolean)
 *   Fetch single event by ID
 *   Returns EventData or null
 * 
 * - setEvents(array)
 *   Manually set events (useful after mutations)
 *   Automatically updates lastFetchTime
 * 
 * - setEventDetails(id, data)
 *   Manually set individual event details
 * 
 * - clear()
 *   Completely clear all cached data
 *   Use when user logs out
 * 
 * ============================================================================
 * CREATING A NEW STORE (e.g., for Notifications)
 * ============================================================================
 * 
 * STEP 1: Create Store File
 * 
 * // lib/stores/notificationStore.ts
 * import { create } from "zustand";
 * import api from "@/lib/api";
 * 
 * interface NotificationStoreState {
 *   notifications: any[];
 *   isLoading: boolean;
 *   error: string | null;
 *   lastFetchTime: number | null;
 *   isRefreshing: boolean;
 * 
 *   fetchNotifications: (force?: boolean) => Promise<void>;
 *   markAsRead: (id: string) => Promise<void>;
 *   clear: () => void;
 *   setIsRefreshing: (value: boolean) => void;
 * }
 * 
 * export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
 *   notifications: [],
 *   isLoading: false,
 *   error: null,
 *   lastFetchTime: null,
 *   isRefreshing: false,
 * 
 *   fetchNotifications: async (force = false) => {
 *     const state = get();
 *     if (!force && state.notifications.length > 0 && state.lastFetchTime) {
 *       return;
 *     }
 *     set({ isLoading: true });
 *     try {
 *       const data = await api.getNotifications();
 *       if (Array.isArray(data)) {
 *         set({
 *           notifications: data,
 *           lastFetchTime: Date.now(),
 *           error: null,
 *         });
 *       }
 *     } catch (err: any) {
 *       set({ error: err.message });
 *     } finally {
 *       set({ isLoading: false });
 *     }
 *   },
 * 
 *   markAsRead: async (id: string) => {
 *     try {
 *       await api.markNotificationRead(id);
 *       // Update local cache
 *       set((state) => ({
 *         notifications: state.notifications.map((n) =>
 *           n.id === id ? { ...n, read: true } : n
 *         ),
 *       }));
 *     } catch (err) {
 *       console.error("Failed to mark notification as read:", err);
 *     }
 *   },
 * 
 *   clear: () => {
 *     set({
 *       notifications: [],
 *       lastFetchTime: null,
 *       error: null,
 *     });
 *   },
 * 
 *   setIsRefreshing: (value: boolean) => {
 *     set({ isRefreshing: value });
 *   },
 * }));
 * 
 * STEP 2: Create Custom Hook
 * 
 * // hooks/useNotifications.ts
 * import { useEffect } from "react";
 * import { useNotificationStore } from "@/lib/stores/notificationStore";
 * 
 * export const useNotifications = (autoFetch = true) => {
 *   const {
 *     notifications,
 *     isLoading,
 *     isRefreshing,
 *     error,
 *     fetchNotifications,
 *   } = useNotificationStore();
 * 
 *   useEffect(() => {
 *     if (autoFetch) {
 *       fetchNotifications();
 *     }
 *   }, [autoFetch, fetchNotifications]);
 * 
 *   const refresh = async () => {
 *     useNotificationStore.setState({ isRefreshing: true });
 *     try {
 *       await fetchNotifications(true);
 *     } finally {
 *       useNotificationStore.setState({ isRefreshing: false });
 *     }
 *   };
 * 
 *   return {
 *     notifications,
 *     isLoading,
 *     isRefreshing,
 *     error,
 *     refresh,
 *   };
 * };
 * 
 * STEP 3: Use in Components
 * 
 * import { useNotifications } from "@/hooks/useNotifications";
 * 
 * export default function NotificationsScreen() {
 *   const { notifications, isRefreshing, refresh } = useNotifications();
 * 
 *   return (
 *     <ScrollView
 *       refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 *     >
 *       {notifications.map(notif => <NotificationCard key={notif.id} notif={notif} />)}
 *     </ScrollView>
 *   );
 * }
 * 
 * ============================================================================
 * BEST PRACTICES
 * ============================================================================
 * 
 * 1. ✅ USE THE CUSTOM HOOK (useEvents, useCommunities)
 *    - Cleaner syntax
 *    - Auto-handles refresh logic
 *    - Easy to understand
 * 
 * 2. ✅ ALWAYS USE WITH PULL-TO-REFRESH
 *    - Gives users control over data freshness
 *    - Natural for mobile apps
 * 
 * 3. ✅ HANDLE LOADING STATES
 *    - Show skeleton/spinner during isLoading
 *    - Different UX for initial load vs refresh
 * 
 * 4. ✅ CHECK FOR ERRORS
 *    - Display error message to user
 *    - Provide retry button/refresh option
 * 
 * 5. ✅ CLEAR ON LOGOUT
 *    - Call store.clear() when user logs out
 *    - Prevents data leaks between users
 * 
 * 6. ❌ AVOID: Calling API directly in components
 *    - Always use the store for caching benefit
 * 
 * 7. ❌ AVOID: Multiple fetches in useEffect
 *    - Store handles deduplication
 *    - Can call fetchEvents() without dependency array worries
 * 
 * 8. ❌ AVOID: Modifying store state directly
 *    - Use provided methods (fetchEvents, setEvents, etc)
 *    - Keeps logic in one place
 * 
 * ============================================================================
 * TROUBLESHOOTING
 * ============================================================================
 * 
 * Q: "Data is stale, I need fresh data"
 * A: Call refresh() function from the hook
 *    const { refresh } = useEvents();
 *    await refresh(); // Forces fresh API call
 * 
 * Q: "Why is it making duplicate API calls?"
 * A: You might be calling fetchEvents() directly
 *    Use useEvents() hook instead, or pass autoFetch=false
 *    if you don't want automatic fetching
 * 
 * Q: "How do I know when data was last fetched?"
 * A: Access lastFetchTime from the store directly:
 *    const { lastFetchTime } = useEventStore();
 * 
 * Q: "Can I update cached data without API call?"
 * A: Yes! Use setEvents() or setEventDetails():
 *    const { setEvents } = useEventStore();
 *    setEvents([...updatedEvents]);
 * 
 * Q: "How do I clear everything when user logs out?"
 * A: const { clear } = useEventStore();
 *    clear();
 * 
 * ============================================================================
 * KEY TAKEAWAYS
 * ============================================================================
 * 
 * 1. Zustand stores cache data globally
 * 2. First load: API call → cache → show data
 * 3. Subsequent loads: Instant from cache (no API call)
 * 4. Pull-to-refresh: Force new API call
 * 5. Use custom hooks (useEvents, useCommunities) for simplicity
 * 6. Add new stores following the same pattern
 * 7. Users control refresh timing
 * 
 * ============================================================================
 */
