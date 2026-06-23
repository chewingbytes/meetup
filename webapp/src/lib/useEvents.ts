"use client";

import { useCallback, useEffect, useState } from "react";
import { getEvents } from "./api";
import type { EventProps } from "./types";

/** Parse a coordinate, treating null/undefined/"" as missing (NOT 0 — Number(null)
 *  is 0, which would wrongly place a pin at the equator). */
function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return NaN;
  return Number(v);
}

/** Coerce coords to numbers — PostgREST returns numeric columns as strings,
 *  which would otherwise fail a typeof check and drop the pin. */
function coerce(e: EventProps): EventProps {
  return { ...e, location_lat: num(e.location_lat), location_lng: num(e.location_lng) };
}
function hasCoords(e: EventProps): boolean {
  return Number.isFinite(e.location_lat) && Number.isFinite(e.location_lng);
}

/** True once an event's day has ended. Used to hide it from the MAP only —
 *  the event, channel and chat are kept so joined users can still revisit it. */
export function isEventExpired(e: EventProps): boolean {
  const now = Date.now();
  if (e.end_at) return new Date(e.end_at).getTime() < now;
  if (e.startDate) {
    const d = new Date(e.startDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime() < now;
  }
  return false;
}

/**
 * Loads active events for the map. The backend returns up to 50 active events
 * ordered by start date — plenty for the beta, so we fetch once (no per-pan
 * bounds fetching needed) and refresh on demand after create/join.
 */
export function useEvents() {
  const [events, setEvents] = useState<EventProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getEvents();
      // Keep expired events in state (chat stays reachable via the joined rail);
      // the map filters them out separately.
      setEvents((data ?? []).map(coerce).filter(hasCoords));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Optimistically insert/replace a just-created event so its pin shows
   * immediately — independent of the server's order/limit (a fresh event can
   * fall outside the top-50-by-startDate window) or refetch timing.
   */
  const addEvent = useCallback((e: EventProps) => {
    const c = coerce(e);
    if (!hasCoords(c)) return;
    setEvents((prev) =>
      prev.some((x) => x.id === c.id) ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev],
    );
  }, []);

  return { events, isLoading, error, reload: load, addEvent, setEvents };
}
