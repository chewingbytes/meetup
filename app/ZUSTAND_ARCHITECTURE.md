/**
 * ============================================================================
 * ZUSTAND ARCHITECTURE OVERVIEW
 * ============================================================================
 * 
 * VISUAL FLOW DIAGRAM:
 * 
 *                          ┌─────────────────────────────────────┐
 *                          │   React Component (Screen)           │
 *                          │                                      │
 *                          │  const { events, refresh } =         │
 *                          │    useEvents();                      │
 *                          └──────────────┬──────────────────────┘
 *                                         │
 *                                         ▼
 *                          ┌──────────────────────────────────┐
 *                          │   Custom Hook (useEvents)         │
 *                          │                                   │
 *                          │ • Auto-fetch on mount             │
 *                          │ • Returns: events, isRefreshing  │
 *                          │ • Provides: refresh() function   │
 *                          └──────────────┬────────────────────┘
 *                                         │
 *                                         ▼
 *                          ┌──────────────────────────────────┐
 *                          │  Zustand Store (eventStore)      │
 *                          │                                   │
 *                          │ • Stores: events[], lastFetch    │
 *                          │ • Methods: fetchEvents(force?)   │
 *                          │ • Smart: Caches data globally    │
 *                          └──────────────┬────────────────────┘
 *                                         │
 *                                         ▼
 *                    ┌────────────────────────────────────────┐
 *                    │      Check Cache                        │
 *                    │                                         │
 *                    │  if (force || !cached) → API Call      │
 *                    │  else → Return cached data             │
 *                    └────────────────────┬───────────────────┘
 *                                         │
 *                          ┌──────────────┴──────────────┐
 *                          ▼                             ▼
 *                   ┌─────────────┐          ┌────────────────────┐
 *                   │  API Fetch  │          │  Return Cache      │
 *                   │   (slow)    │          │  (instant!)        │
 *                   └──────┬──────┘          └─────────┬──────────┘
 *                          │                           │
 *                          └───────────┬───────────────┘
 *                                      ▼
 *                          ┌──────────────────────────┐
 *                          │  Update Store + UI       │
 *                          │  (Zustand re-renders)    │
 *                          └─────────────────────────┘
 * 
 * ============================================================================
 * KEY COMPONENTS EXPLAINED
 * ============================================================================
 * 
 * 1. REACT COMPONENT (Your Screen)
 *    └─ Consumes data from store
 *    └─ Renders UI
 *    └─ Calls refresh on user action
 * 
 * 2. CUSTOM HOOK (useEvents, useCommunities)
 *    └─ Bridges component ↔ store
 *    └─ Handles auto-fetch on mount
 *    └─ Provides clean API
 *    └─ Manages isRefreshing state
 * 
 * 3. ZUSTAND STORE (eventStore, communityStore)
 *    └─ Single source of truth for data
 *    └─ Manages cache lifecycle\n *    └─ Handles API calls\n *    └─ Persists across navigations\n * 
 * 4. PULL-TO-REFRESH UI (PullToRefresh component)
 *    └─ Visual feedback for user\n *    └─ Triggers manual refresh\n *    └─ Shows loading state\n * \n * ============================================================================\n * DATA FLOW EXAMPLE: User Views Home Screen\n * ============================================================================\n * \n * TIME 0: User opens app and navigates to Home\n * ────────────────────────────────────────────\n * 1. Component mounts\n * 2. useEvents() hook called\n * 3. useEffect in hook runs\n * 4. fetchEvents() called on store\n * 5. Store checks: \"Do we have events?\"\n *    → NO (cache empty)\n * 6. Store calls API: api.getEvents()\n * 7. API returns data: [event1, event2, ...]\n * 8. Store saves to cache: state.events = [...]\n * 9. Component receives update via Zustand\n * 10. Screen re-renders with data ✓\n * \n * Total time: ~1-2 seconds (API call time)\n * \n * TIME 5: User navigates to Explore, then back to Home\n * ──────────────────────────────────────────────────\n * 1. User navigates back to Home\n * 2. Component mounts (fresh instance)\n * 3. useEvents() hook called\n * 4. useEffect in hook runs\n * 5. fetchEvents() called on store\n * 6. Store checks: \"Do we have events?\"\n *    → YES (cache exists!)\n * 7. Store returns cached data instantly\n * 8. Component receives cached data via Zustand\n * 9. Screen re-renders with data ✓\n * \n * Total time: ~10ms (instant!)\n * \n * TIME 10: User pulls down to refresh\n * ──────────────────────────────────\n * 1. User drags screen down\n * 2. Pull-to-refresh gesture detected\n * 3. onRefresh callback triggered\n * 4. refresh() function called\n *    - Sets isRefreshing = true\n *    - Calls fetchEvents(force: true)\n * 5. Store ignores cache (force=true)\n * 6. Store calls API: api.getEvents()\n * 7. Spinner shown to user (isRefreshing=true)\n * 8. API returns fresh data: [event1, event2, ...]\n * 9. Store updates cache with fresh data\n * 10. Component receives fresh data\n * 11. Spinner hides (isRefreshing=false)\n * 12. Screen re-renders with fresh data ✓\n * \n * Total time: ~1-2 seconds (API call time)\n * UX: User sees spinner and understands data is updating\n * \n * ============================================================================\n * STATE MANAGEMENT COMPARISON\n * ============================================================================\n * \n * WITHOUT ZUSTAND (Old Way):\n * ─────────────────────────\n * HOME SCREEN\n *   ├─ events (local state)\n *   ├─ communities (local state)\n *   └─ Loading (local state)\n * \n * EXPLORE SCREEN\n *   ├─ events (local state) ← DUPLICATE DATA!\n *   ├─ communities (local state) ← DUPLICATE DATA!\n *   └─ Loading (local state)\n * \n * EVENT DETAIL SCREEN\n *   ├─ eventDetail (local state) ← DUPLICATE DATA!\n *   └─ Loading (local state)\n * \n * Problems:\n * • Data duplicated in memory\n * • Each screen calls API separately\n * • Inconsistent data across screens\n * • Complex state management\n * • Slow when navigating\n * \n * WITH ZUSTAND (New Way):\n * ──────────────────────\n * ┌─────────────────────────────┐\n * │   ZUSTAND GLOBAL STORE      │\n * │                             │\n * │ • events: [...]             │\n * │ • communities: [...]        │\n * │ • lastFetchTime: 1234567    │\n * │ • isLoading: false          │\n * └─────────────────────────────┘\n *             ▲ shared\n *             │ cache\n *             │\n *    ┌────────┼────────┬──────────┐\n *    │        │        │          │\n *    ▼        ▼        ▼          ▼\n * HOME    EXPLORE   EVENT      OTHER\n * SCREEN  SCREEN    DETAIL    SCREENS\n * \n * Benefits:\n * • Single source of truth\n * • Data shared across screens\n * • API called only once\n * • Consistent everywhere\n * • Fast navigation\n * • Less memory usage\n * \n * ============================================================================\n * CACHING LOGIC FLOWCHART\n * ============================================================================\n * \n * fetchEvents(force = false)\n *     │\n *     ├─ Is force = true?\n *     │  ├─ YES → Skip cache, go to API\n *     │  └─ NO → Check cache\n *     │\n *     ├─ Is cache empty?\n *     │  ├─ YES → Go to API\n *     │  └─ NO → Return cached data (INSTANT!)\n *     │\n *     ├─ Is lastFetchTime recent?\n *     │  ├─ YES → Return cached data (INSTANT!)\n *     │  └─ NO → Go to API\n *     │\n *     └─ Hit API\n *        ├─ Set isLoading = true\n *        ├─ Call api.getEvents()\n *        ├─ Update cache with new data\n *        ├─ Update lastFetchTime\n *        ├─ Set isLoading = false\n *        └─ Return fresh data\n * \n * ============================================================================\n * INTEGRATION WITH EXISTING CODE\n * ============================================================================\n * \n * Your existing API module (lib/api.ts) remains unchanged:\n * \n *   export const getEvents = () => request(\"/events\");\n *   export const getCommunities = () => request(\"/communities\");\n * \n * Zustand stores use these functions:\n * \n *   fetchEvents: async (force = false) => {\n *     try {\n *       const data = await api.getEvents(); ← Uses existing API\n *       set({ events: data });\n *     }\n *   }\n * \n * Components use custom hooks:\n * \n *   const { events } = useEvents(); ← Clean interface\n * \n * ==========================================================================\n * EXTENSIBILITY: Adding New Stores\n * ============================================================================\n * \n * The pattern scales easily:\n * \n * For Notifications:\n *   1. Create: lib/stores/notificationStore.ts\n *   2. Create: hooks/useNotifications.ts\n *   3. Use in: any component with:\n *      const { notifications, refresh } = useNotifications();\n * \n * For Search:\n *   1. Create: lib/stores/searchStore.ts\n *   2. Create: hooks/useSearch.ts\n *   3. Use in: search screen\n * \n * Pattern is identical for every new feature!\n * \n * ============================================================================\n * PERFORMANCE METRICS\n * ============================================================================\n * \n * WITHOUT ZUSTAND:\n * ├─ First screen load: 2s (API call)\n * ├─ Navigate away & back: 2s (API call again) ← SLOW\n * ├─ Go to detail: 1s (new API call)\n * ├─ Back to list: 2s (API call again) ← SLOW\n * └─ Total: 7 seconds\n * \n * WITH ZUSTAND:\n * ├─ First screen load: 2s (API call)\n * ├─ Navigate away & back: ~50ms (cache) ← INSTANT!\n * ├─ Go to detail: ~50ms (cache) ← INSTANT!\n * ├─ Back to list: ~50ms (cache) ← INSTANT!\n * ├─ Pull-to-refresh: 2s (forced API call, user expects wait)\n * └─ Total: ~2.15 seconds (vs 7 seconds!)\n * \n * Result: 3.3x faster app! 🚀\n * \n * ============================================================================\n * MEMORY & BANDWIDTH SAVINGS\n * ============================================================================\n * \n * WITHOUT ZUSTAND (3 screens, 100 events):\n * • Home screen: 100 events × ~1KB = 100KB\n * • Explore screen: 100 events × ~1KB = 100KB (DUPLICATE)\n * • Event detail: 1 event × ~1KB = 1KB\n * • Total memory: 201KB (WASTED DUPLICATION)\n * • API calls: 3 calls × 100KB = 300KB bandwidth\n * \n * WITH ZUSTAND (same scenario):\n * • Shared cache: 100 events × ~1KB = 100KB (ONCE!)\n * • Total memory: 100KB (50% SAVED)\n * • API calls: 1 call × 100KB = 100KB (66% SAVED)\n * \n * Savings increase with more screens and data!\n * \n * ============================================================================\n */
