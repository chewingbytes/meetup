/**
 * ============================================================================
 * ZUSTAND IMPLEMENTATION CHECKLIST & QUICK REFERENCE
 * ============================================================================
 * 
 * ✅ ALREADY IMPLEMENTED:
 * 
 * 1. Core Stores Created:
 *    ✓ lib/stores/eventStore.ts      - Events state management
 *    ✓ lib/stores/communityStore.ts  - Communities state management
 * 
 * 2. Custom Hooks Created:
 *    ✓ hooks/useEvents.ts            - Easy event hook with auto-fetch
 *    ✓ hooks/useCommunities.ts       - Easy community hook with auto-fetch
 * 
 * 3. UI Components Created:
 *    ✓ components/pull-to-refresh.tsx - Reusable refresh component
 * 
 * 4. Screen Migrations Done:
 *    ✓ app/index.tsx                 - Home screen now uses Zustand + pull-to-refresh
 *    ✓ app/events/[id].tsx           - Event detail page uses Zustand
 *    ✓ app/community/[id].tsx        - Community detail page uses Zustand
 * 
 * ============================================================================
 * NEXT STEPS: Migrate Remaining Screens
 * ============================================================================
 * 
 * Screen                          | Status    | What to Do
 * --------------------------------|-----------|----------------------------------
 * app/explore/index.tsx           | TODO      | Replace sample events with Zustand
 * app/categories/[id].tsx         | TODO      | Add store for categories if needed
 * app/events/ (list)              | TODO      | Use Zustand events cache
 * app/communities/ (list)         | TODO      | Use Zustand communities cache
 * Other screens with API calls    | TODO      | Review and migrate similar to above
 * 
 * ============================================================================
 * HOW TO MIGRATE A NEW SCREEN (Step-by-Step)
 * ============================================================================
 * 
 * STEP 1: Identify the data being fetched
 * ----------------------------------------
 * Example: Screen fetches events with: api.getEvents()
 * 
 * STEP 2: Check if store exists
 * ----------------------------------------
 * - Events → useEventStore exists ✓
 * - Communities → useCommunityStore exists ✓
 * - Something else → Need to create store (see guide)
 * 
 * STEP 3: Import the custom hook
 * ----------------------------------------
 * import { useEvents } from "@/hooks/useEvents";
 * // OR
 * import { useCommunities } from "@/hooks/useCommunities";
 * 
 * STEP 4: Replace state variables
 * ----------------------------------------
 * BEFORE:
 *   const [events, setEvents] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState(null);
 * 
 * AFTER:
 *   const { events, isLoading, isRefreshing, error, refresh } = useEvents();
 * 
 * STEP 5: Remove useEffect that calls API
 * ----------------------------------------
 * DELETE this:
 *   useEffect(() => {
 *     loadEvents();
 *   }, []);
 * 
 * The hook handles this automatically!
 * 
 * STEP 6: Add pull-to-refresh
 * ----------------------------------------
 * import { PullToRefresh } from "@/components/pull-to-refresh";
 * 
 * <ScrollView
 *   refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 * >
 *   {/* content */}
 * </ScrollView>
 * 
 * STEP 7: Test
 * ----------------------------------------
 * 1. Load screen → Should show data instantly if cached
 * 2. Pull to refresh → Should show loader and fetch fresh data
 * 3. Navigate away and back → Should show cached data instantly
 * 
 * ============================================================================
 * FILE IMPORTS QUICK REFERENCE
 * ============================================================================
 * 
 * For Events:
 * -----------
 * // Use this in components:
 * import { useEvents } from "@/hooks/useEvents";
 * 
 * // Use this if you need direct store access:
 * import { useEventStore } from "@/lib/stores/eventStore";
 * 
 * For Communities:
 * ----------------
 * // Use this in components:
 * import { useCommunities } from "@/hooks/useCommunities";
 * 
 * // Use this if you need direct store access:
 * import { useCommunityStore } from "@/lib/stores/communityStore";
 * 
 * For Pull-to-Refresh UI:
 * -----------------------
 * import { PullToRefresh } from "@/components/pull-to-refresh";
 * // OR
 * import { createRefreshControl } from "@/components/pull-to-refresh";
 * 
 * ============================================================================
 * COMMON PATTERNS YOU'LL USE
 * ============================================================================
 * 
 * PATTERN 1: Load and Display with Refresh
 * ------------------------------------------
 * const { events, isRefreshing, refresh } = useEvents();
 * 
 * return (
 *   <ScrollView
 *     refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 *   >
 *     {events.map(e => <EventCard key={e.id} event={e} />)}
 *   </ScrollView>
 * );
 * 
 * PATTERN 2: Load Specific Item
 * ------------------------------
 * const { eventDetails, fetchEventById } = useEventStore();
 * 
 * useEffect(() => {
 *   fetchEventById(eventId);
 * }, [eventId]);
 * 
 * const event = eventDetails[eventId];
 * return <Text>{event?.name}</Text>;
 * 
 * PATTERN 3: No Auto-Fetch
 * -------------------------
 * const { events, refresh } = useEvents(false);
 * 
 * return (
 *   <Button onPress={refresh} title="Load Events" />
 * );
 * 
 * PATTERN 4: Multiple Data Sources with Unified Refresh
 * -------------------------------------------------------
 * const { events, isRefreshing: evRefresh, refresh: refEvents } = useEvents();
 * const { communities, isRefreshing: comRefresh, refresh: refCom } = useCommunities();
 * 
 * const handleRefresh = async () => {
 *   await Promise.all([refEvents(), refCom()]);
 * };
 * 
 * return (
 *   <ScrollView
 *     refreshControl={<PullToRefresh 
 *       isRefreshing={evRefresh || comRefresh} 
 *       onRefresh={handleRefresh} 
 *     />}
 *   >
 *     {/* content */}
 *   </ScrollView>
 * );
 * 
 * ============================================================================
 * DEBUGGING TIPS
 * ============================================================================
 * 
 * 1. Check if data is cached:
 *    const { events, lastFetchTime } = useEventStore();
 *    console.log("Events count:", events.length);
 *    console.log("Last fetch:", lastFetchTime ? new Date(lastFetchTime) : "Never");
 * 
 * 2. Force refresh for testing:
 *    const { refresh } = useEvents();
 *    await refresh(); // Always fetches fresh
 * 
 * 3. Clear all cache:
 *    const { clear } = useEventStore();
 *    clear(); // Clears everything
 * 
 * 4. Check store state directly:
 *    const store = useEventStore.getState();
 *    console.log("Full state:", store);
 * 
 * ============================================================================
 * PERFORMANCE NOTES
 * ============================================================================
 * 
 * ✓ First screen load: Normal speed (API call needed)
 * ✓ Subsequent navigations: INSTANT (cache used)
 * ✓ Pull-to-refresh: Controlled by user
 * ✓ Multiple screens: Shared cache (no duplicate APIs)
 * ✓ Memory: Minimal (only what's fetched)
 * 
 * Result: Much faster app, better UX, less server load!
 * 
 * ============================================================================
 * TROUBLESHOOTING SCENARIOS
 * ============================================================================
 * 
 * SCENARIO 1: \"Data not updating when I manually refresh\"
 * Solution: Make sure you're calling refresh(), not just closing and reopening
 * 
 * SCENARIO 2: \"Old data still showing after update\"
 * Solution: Call setEvents() to update cache after mutation
 *   const { setEvents, events } = useEventStore();
 *   setEvents([...events.filter(e => e.id !== deletedId)]);
 * 
 * SCENARIO 3: \"Data from another user showing\"
 * Solution: Call clear() on logout
 *   useEventStore().clear();
 *   useCommunityStore().clear();
 * 
 * SCENARIO 4: \"Two screens showing different data\"
 * Solution: Both should use same store, so shouldn't happen
 *   Check you're using same store name
 * 
 * ============================================================================
 * COMPLETE MIGRATION TEMPLATE
 * ============================================================================
 * 
 * BEFORE (Without Zustand):
 * -------------------------
 * import { useEffect, useState } from "react";
 * import { ScrollView } from "react-native";
 * import api from "@/lib/api";
 * 
 * export default function MyScreen() {
 *   const [data, setData] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     api.getData().then(d => {
 *       setData(d);
 *       setLoading(false);
 *     });
 *   }, []);
 * 
 *   return (
 *     <ScrollView>
 *       {data.map(item => <Text key={item.id}>{item.name}</Text>)}
 *     </ScrollView>
 *   );
 * }
 * 
 * AFTER (With Zustand):
 * ---------------------
 * import { useData } from "@/hooks/useData"; // Create this hook
 * import { PullToRefresh } from "@/components/pull-to-refresh";
 * import { ScrollView } from "react-native";
 * 
 * export default function MyScreen() {
 *   const { data, isRefreshing, refresh } = useData();
 * 
 *   return (
 *     <ScrollView
 *       refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />}
 *     >
 *       {data.map(item => <Text key={item.id}>{item.name}</Text>)}
 *     </ScrollView>
 *   );
 * }
 * 
 * ==========================================================================
 * NEXT STORE TO CREATE (Recommendations)
 * ==========================================================================\n * \n * 1. NOTIFICATIONS STORE\n *    - Fetch notifications for inbox\n *    - Mark as read\n *    - Track unread count\n * \n * 2. PROFILE STORE\n *    - Cache user profile data\n *    - Handle profile updates\n * \n * 3. SEARCH RESULTS STORE\n *    - Cache search queries\n *    - Pagination support\n * \n * 4. FAVORITES STORE\n *    - Track liked events/communities\n *    - Quick toggle on/off\n * \n * ============================================================================\n */
