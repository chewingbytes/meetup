"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Map as LeafletMap } from "leaflet";
import { Plus, Crosshair, User, Check, X, MapPin, Loader2 } from "lucide-react";
import { useEvents, isEventExpired } from "@/lib/useEvents";
import { useRailChats } from "@/lib/useRailChats";
import { useIdentity } from "@/lib/webappUser";
import { useGlobalPresence } from "@/lib/usePresence";
import {
  getWebappJoinedEventIds,
  getWebappEvent,
  getMyActivities,
  createEvent,
  joinWebappEvent,
} from "@/lib/api";
import { getPending, clearPending, clearCreateDraft } from "@/lib/pending";
import { reverseGeocode } from "@/lib/geocode";
import { grad, authorGradient } from "@/lib/theme";
import type { EventProps } from "@/lib/types";
import { EventSheet } from "@/components/EventSheet";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { CreateActivitySheet } from "@/components/CreateActivitySheet";
import { JoinedRail } from "@/components/JoinedRail";
import { ChatPopup } from "@/components/ChatPopup";
import { JoinModal } from "@/components/JoinModal";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-canvas" />,
});

export default function Home() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { events, reload, addEvent } = useEvents();
  const { user, ready, session, saveInstagram, signOut } = useIdentity();
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Presence ("people online now") — counts everyone, incl. guests ──
  const [guestId, setGuestId] = useState<string | null>(null);
  useEffect(() => setGuestId(crypto.randomUUID()), []);
  const presenceIdentity = useMemo(() => {
    if (user) return { id: user.id, username: user.instagram };
    if (guestId) return { id: guestId, username: "guest" };
    return null;
  }, [user, guestId]);
  const onlineCount = useGlobalPresence(presenceIdentity);

  // ── My activities: organized + approved-joined — powers the rail (any date) ──
  // Kept independent of the map feed so past activities' chats stay reachable
  // and organizers always see all their events' chats.
  const [myActivities, setMyActivities] = useState<EventProps[]>([]);
  const loadMyActivities = useCallback(async (uid: string) => {
    const list = await getMyActivities(uid).catch(() => []);
    setMyActivities(list);
  }, []);

  // ── Joined (approved) event ids — for map pin highlighting ──
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const loadJoined = useCallback(async (uid: string) => {
    const ids = await getWebappJoinedEventIds(uid).catch(() => []);
    setJoinedIds(new Set(ids));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      loadJoined(user.id);
      loadMyActivities(user.id);
    } else {
      setJoinedIds(new Set());
      setMyActivities([]);
    }
  }, [user?.id, ready, loadJoined, loadMyActivities]);

  const handleJoinedChange = useCallback(
    (eventId: string, joined: boolean) => {
      setJoinedIds((prev) => {
        const next = new Set(prev);
        if (joined) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      if (user) loadMyActivities(user.id); // refresh the rail
    },
    [user, loadMyActivities],
  );

  // Map shows only activities whose day hasn't ended.
  const visibleEvents = useMemo(() => events.filter((e) => !isEventExpired(e)), [events]);

  // On first load, frame the map to the events so they're never off-screen
  // (e.g. a lone event east of the default center). Runs once.
  const didFitRef = useRef(false);
  useEffect(() => {
    if (didFitRef.current || !mapReady || !mapRef.current) return;
    const pts = visibleEvents
      .map((e) => [Number(e.location_lat), Number(e.location_lng)] as [number, number])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    if (pts.length === 0) return;
    didFitRef.current = true;
    if (pts.length === 1) {
      mapRef.current.setView(pts[0], 14);
    } else {
      mapRef.current.fitBounds(pts, { padding: [60, 60], maxZoom: 14 });
    }
  }, [mapReady, visibleEvents]);

  // ── Sheets / modals ──
  const [selectedEvent, setSelectedEvent] = useState<EventProps | null>(null);
  const [eventOpen, setEventOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [chatEvent, setChatEvent] = useState<EventProps | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [joinModalEvent, setJoinModalEvent] = useState<EventProps | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // ── Realtime rail: order chats by recent activity + unread badges ──
  const openChannelId = useMemo(() => {
    if (!chatOpen || !chatEvent) return null;
    return myActivities.find((e) => e.id === chatEvent.id)?.channel_id ?? null;
  }, [chatOpen, chatEvent, myActivities]);
  const { orderedEvents: railEvents, unreadByEvent } = useRailChats(
    myActivities,
    user?.id ?? null,
    openChannelId,
  );

  const openEvent = useCallback((e: EventProps) => {
    setSelectedEvent(e);
    console.log("EVENT:", e)
    setEventOpen(true);
  }, []);

  const openChat = useCallback((e: EventProps) => {
    setEventOpen(false);
    setChatEvent(e);
    setChatOpen(true);
  }, []);

  const requireAuthJoin = useCallback((e: EventProps) => {
    setEventOpen(false);
    setJoinModalEvent(e);
    setJoinModalOpen(true);
  }, []);

  // ── Resume the pending action after the Google OAuth redirect ──
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!ready || !session?.user || resumedRef.current) return;
    const pending = getPending();
    if (!pending) return;
    resumedRef.current = true;
    const uid = session.user.id;
    (async () => {
      try {
        await saveInstagram(pending.instagram);
        const act = pending.action;
        if (act.type === "create") {
          const created = await createEvent({ ...act.form, organizerId: uid });
          await joinWebappEvent(uid, created.id).catch(() => {});
          clearPending();
          clearCreateDraft();
          await reload();
          addEvent(created); // optimistic — guarantees the new pin renders
          await loadJoined(uid);
          await loadMyActivities(uid);
          const lat = Number(created.location_lat);
          const lng = Number(created.location_lng);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            mapRef.current?.flyTo([lat, lng], 15, { duration: 0.8 });
          }
          openEvent(created);
        } else if (act.type === "join") {
          await joinWebappEvent(uid, act.eventId).catch((e: any) => {
            if (e?.status !== 409) throw e;
          });
          clearPending();
          await loadJoined(uid);
          await loadMyActivities(uid);
          const detail = await getWebappEvent(act.eventId, uid).catch(() => null);
          if (detail) openEvent(detail);
        } else {
          clearPending();
        }
      } catch (e: any) {
        console.error("[resume] failed:", e);
        clearPending();
        // Instagram handle taken by another Google account — surface it and
        // sign back out so they can retry with a different handle/account.
        if (e?.status === 409 || e?.body?.code === "ig_taken") {
          setAuthError(
            e?.body?.message ||
              "That Instagram handle is already in use by another account. Try a different one.",
          );
          await signOut().catch(() => {});
        }
      }
    })();
  }, [ready, session?.user, saveInstagram, signOut, reload, addEvent, loadJoined, loadMyActivities, openEvent]);

  // ── Location for create (address search or center-crosshair pin) ──
  const [picked, setPicked] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const startPicking = useCallback(() => {
    setCreateOpen(false);
    setPlacing(true);
  }, []);
  const confirmPlacing = useCallback(() => {
    const c = mapRef.current?.getCenter();
    setPlacing(false);
    setCreateOpen(true);
    if (!c) return;
    const { lat, lng } = c;
    setPicked({ lat, lng });
    // Resolve the dropped pin to a readable address (async).
    reverseGeocode(lat, lng).then((address) =>
      setPicked((p) => (p && p.lat === lat && p.lng === lng ? { ...p, address } : p)),
    );
  }, []);
  const cancelPlacing = useCallback(() => {
    setPlacing(false);
    setCreateOpen(true);
  }, []);
  const setLocationFromSearch = useCallback(
    (loc: { lat: number; lng: number; address: string }) => {
      setPicked(loc);
      mapRef.current?.flyTo([loc.lat, loc.lng], 15, { duration: 0.8 });
    },
    [],
  );
  const clearLocation = useCallback(() => setPicked(null), []);

  const [locating, setLocating] = useState(false);
  const flyToMe = useCallback((zoom = 15) => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], zoom, { duration: 0.8 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const handleCreated = useCallback(
    async (created: EventProps) => {
      setCreateOpen(false);
      setPicked(null);
      await reload();
      addEvent(created); // optimistic — guarantees the new pin renders
      if (user) loadMyActivities(user.id); // surface the new event's chat in the rail
      const lat = Number(created.location_lat);
      const lng = Number(created.location_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapRef.current?.flyTo([lat, lng], 15, { duration: 0.8 });
        setTimeout(() => openEvent(created), 700);
      }
    },
    [reload, addEvent, openEvent, user, loadMyActivities],
  );

  const avatarGrad = authorGradient(user?.instagram ?? "guest");

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden">
      <div className="absolute inset-0">
        <MapView
          events={visibleEvents}
          joinedIds={joinedIds}
          onSelectEvent={openEvent}
          onMapReady={(m) => {
            mapRef.current = m;
            setMapReady(true);
          }}
        />
      </div>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2 shadow-clayCardSm backdrop-blur">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/transparentlogo.png" alt="Soonest" className="h-6 w-6 shrink-0" />
          <span className="font-heading text-lg font-extrabold tracking-tight text-accent">soonest</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/90 px-3 py-2 shadow-clayCardSm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accentGreen" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accentGreen" />
            </span>
            <span className="text-xs font-bold text-textPrimary">{onlineCount}</span>
            <span className="hidden text-xs font-medium text-textTertiary sm:inline">online</span>
          </div>

          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Your profile"
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full shadow-clayCardSm transition active:scale-95"
            style={{ background: user ? grad(avatarGrad) : "#fff" }}
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            ) : user ? (
              <span className="font-heading text-base font-extrabold text-white">
                {user.instagram.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={20} className="text-accent" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>

      {/* Auth error toast (e.g. Instagram handle already in use) */}
      {authError && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] flex justify-center p-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+4rem))]">
          <div className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-clayCard ring-1 ring-error/20">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error/10">
              <X size={13} className="text-error" strokeWidth={3} />
            </div>
            <p className="flex-1 text-sm font-semibold text-textPrimary">{authError}</p>
            <button
              onClick={() => setAuthError(null)}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 text-textTertiary transition hover:bg-canvas"
            >
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* My-activities rail (organized + joined) */}
      {!placing && railEvents.length > 0 && (
        <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+76px)] z-[500] flex justify-end">
          <JoinedRail
            events={railEvents}
            activeId={chatOpen ? chatEvent?.id : null}
            unread={unreadByEvent}
            onOpen={openChat}
          />
        </div>
      )}

      {/* FABs */}
      {!placing && (
        <div className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-[500] flex flex-col items-end gap-3">
          <button
            onClick={() => flyToMe()}
            aria-label="Find me"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-accent shadow-clayCard transition active:scale-95"
          >
            {locating ? <Loader2 size={18} className="spin" /> : <Crosshair size={20} strokeWidth={2.2} />}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-full py-3.5 pl-4 pr-5 font-bold text-white shadow-clayButton transition active:scale-95"
            style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
          >
            <Plus size={20} strokeWidth={2.8} /> Drop an activity
          </button>
        </div>
      )}

      {/* Center-crosshair location picker */}
      {placing && (
        <>
          <div className="pointer-events-none absolute inset-0 z-[600] flex items-center justify-center">
            <div className="-translate-y-3">
              <MapPin size={44} className="text-accent drop-shadow-lg" strokeWidth={2.5} fill="#EDE9FE" />
            </div>
          </div>
          <div className="absolute inset-x-0 top-0 z-[600] flex justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="rounded-2xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-textPrimary shadow-clayCard backdrop-blur">
              Move the map to place your activity
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[600] flex justify-center gap-3 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <button
              onClick={cancelPlacing}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-3.5 font-bold text-textSecondary shadow-clayCard transition active:scale-95"
            >
              <X size={18} strokeWidth={2.5} /> Cancel
            </button>
            <button
              onClick={confirmPlacing}
              className="flex items-center gap-2 rounded-full px-6 py-3.5 font-bold text-white shadow-clayButton transition active:scale-95"
              style={{ background: grad(["#34D399", "#10B981"]) }}
            >
              <Check size={18} strokeWidth={2.8} /> Confirm this spot
            </button>
          </div>
        </>
      )}

      {/* Event detail */}
      <EventSheet
        event={selectedEvent}
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        user={user}
        joined={selectedEvent ? joinedIds.has(selectedEvent.id) : false}
        onRequireAuthJoin={requireAuthJoin}
        onJoinedChange={handleJoinedChange}
        onOpenChat={openChat}
      />

      {/* Unauthenticated join — side-by-side modal */}
      <JoinModal
        event={joinModalEvent}
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      {/* Chat popup */}
      <ChatPopup event={chatEvent} open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Profile drawer */}
      <ProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} onlineCount={onlineCount} />

      {/* Create activity (anyone can fill; verify at the end to post) */}
      <CreateActivitySheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        picked={picked}
        onPickOnMap={startPicking}
        onSetLocation={setLocationFromSearch}
        onClearLocation={clearLocation}
        onCreated={handleCreated}
      />
    </main>
  );
}
