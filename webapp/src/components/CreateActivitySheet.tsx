"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, MapPin, Loader2, Search, AlertTriangle, ChevronLeft } from "lucide-react";
import { Sheet } from "./Sheet";
import { AuthSteps } from "./AuthSteps";
import { grad } from "@/lib/theme";
import { createEvent, joinWebappEvent } from "@/lib/api";
import { moderateActivityText } from "@/lib/moderation";
import { useIdentity } from "@/lib/webappUser";
import { saveCreateDraft, readCreateDraft, clearCreateDraft } from "@/lib/pending";
import { searchAddress, type AddressSuggestion } from "@/lib/geocode";
import type { EventProps } from "@/lib/types";

interface PickedLocation {
  lat: number;
  lng: number;
  address?: string;
}

interface CreateActivitySheetProps {
  open: boolean;
  onClose: () => void;
  picked: PickedLocation | null;
  onPickOnMap: () => void;
  onSetLocation: (loc: { lat: number; lng: number; address: string }) => void;
  onClearLocation: () => void;
  onCreated: (event: EventProps) => void;
}

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function CreateActivitySheet({
  open,
  onClose,
  picked,
  onPickOnMap,
  onSetLocation,
  onClearLocation,
  onCreated,
}: CreateActivitySheetProps) {
  const { user } = useIdentity();

  // The selectable window: today → +7 days (8 options).
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);
  const dayStrs = useMemo(() => days.map(toDateStr), [days]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dateStr, setDateStr] = useState(() => toDateStr(new Date()));
  const [anytime, setAnytime] = useState(true);
  const [time, setTime] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState<Record<string, any> | null>(null);

  // Address search
  const [addrQuery, setAddrQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const addrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft (survives reloads / OAuth round-trip).
  useEffect(() => {
    const d = readCreateDraft();
    if (!d) return;
    setName(d.name ?? "");
    setDescription(d.description ?? "");
    setAnytime(d.anytime ?? true);
    setTime(d.time ?? "");
    setRequireApproval(d.requireApproval ?? false);
    // Only restore the date if it's still inside the valid window.
    if (d.dateStr && dayStrs.includes(d.dateStr)) setDateStr(d.dateStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveCreateDraft({ name, description, dateStr, anytime, time, requireApproval });
  }, [name, description, dateStr, anytime, time, requireApproval]);

  const handleAddrChange = (text: string) => {
    setAddrQuery(text);
    if (addrTimer.current) clearTimeout(addrTimer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    addrTimer.current = setTimeout(async () => {
      setSearching(true);
      const r = await searchAddress(text);
      setSuggestions(r);
      setSearching(false);
    }, 400);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    onSetLocation({ lat: s.lat, lng: s.lng, address: s.shortName || s.displayName });
    setAddrQuery("");
    setSuggestions([]);
  };

  // Wipe every field back to defaults so the next "Drop an activity" starts blank.
  const resetForm = () => {
    setName("");
    setDescription("");
    setDateStr(toDateStr(new Date()));
    setAnytime(true);
    setTime("");
    setRequireApproval(false);
    setError(null);
    setAuthForm(null);
    setAddrQuery("");
    setSuggestions([]);
    onClearLocation();
    clearCreateDraft();
  };

  const resetAndClose = () => {
    setAuthForm(null);
    onClose();
  };

  const buildPayload = async (): Promise<Record<string, any> | null> => {
    setError(null);
    if (name.trim().length < 3) {
      setError("Give your activity a name (3+ characters).");
      return null;
    }
    if (!picked) {
      setError("Set a location for your activity.");
      return null;
    }
    const moderation = await moderateActivityText(`${name} ${description}`);
    if (!moderation.ok) {
      setError(moderation.reason ?? "This content can't be posted.");
      return null;
    }

    const startDate = new Date(`${dateStr}T00:00:00`);
    let startTime: string | null = null;
    if (!anytime && time) {
      const [h, m] = time.split(":").map(Number);
      const t = new Date(startDate);
      t.setHours(h || 0, m || 0, 0, 0);
      startTime = t.toISOString();
    }
    const end = new Date(startDate);
    end.setHours(23, 59, 0, 0);

    return {
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate.toISOString(),
      startTime,
      startAnytime: anytime,
      end_at: end.toISOString(),
      location_lat: picked.lat,
      location_lng: picked.lng,
      location_text: picked.address ?? "",
      require_approval: requireApproval,
      is_paid: false,
      price: 0,
      visibility: requireApproval ? "private" : "public",
      capacity: null,
    };
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      if (!payload) return;
      if (user) {
        const created = await createEvent({ ...payload, organizerId: user.id });
        await joinWebappEvent(user.id, created.id).catch(() => {});
        resetForm();
        onCreated(created);
      } else {
        setAuthForm(payload);
      }
    } catch (err: any) {
      setError(err?.message || "Could not create activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const locationLabel = picked
    ? picked.address ?? `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`
    : null;

  return (
    <Sheet open={open} onClose={resetAndClose} variant="responsive">
      <div className="relative max-h-[88vh] overflow-y-auto no-scrollbar rounded-t-[28px] bg-white px-6 pb-8 pt-5 shadow-clayHero md:max-h-[calc(100vh-2rem)] md:rounded-[28px]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-black/10 md:hidden" />
        <button
          onClick={resetAndClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
        >
          <X size={15} strokeWidth={2.5} />
        </button>

        {authForm ? (
          <>
            <button
              onClick={() => setAuthForm(null)}
              className="mb-2 flex items-center gap-1 text-sm font-semibold text-textTertiary transition hover:text-textSecondary"
            >
              <ChevronLeft size={16} strokeWidth={2.5} /> Back to edit
            </button>
            <h2 className="font-heading text-2xl font-extrabold text-textPrimary">Almost live</h2>
            <p className="mt-1 mb-5 text-sm text-textSecondary">
              Verify to post <span className="font-semibold text-accent">{name.trim()}</span> — keeps
              the map spam-free.
            </p>
            <AuthSteps action={{ type: "create", form: authForm }} />
          </>
        ) : (
          <>
            <h2 className="font-heading text-2xl font-extrabold text-textPrimary">Drop an activity</h2>
            <p className="mt-1 text-sm text-textSecondary">
              {user ? (
                <>
                  Hosting as <span className="font-semibold text-accent">@{user.instagram}</span>
                </>
              ) : (
                "Fill it in now — verify at the end to post."
              )}
            </p>

            <form onSubmit={handleContinue} className="mt-5 space-y-5">
              {/* Name */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-textTertiary">
                  What do you want to do?
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunset run at the bay"
                  maxLength={80}
                  className="w-full rounded-2xl border border-black/5 bg-canvas px-4 py-3 text-textPrimary outline-none transition focus:border-accentLight focus:bg-white"
                />
              </label>

              {/* Location */}
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-textTertiary">
                  Where
                </span>
                {picked ? (
                  <div className="flex items-center justify-between gap-2 rounded-2xl bg-greenMuted px-4 py-3">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-accentGreen">
                      <MapPin size={16} strokeWidth={2.5} className="shrink-0" />
                      <span className="truncate">{locationLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={onClearLocation}
                      className="shrink-0 text-sm font-bold text-accent underline-offset-2 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="flex items-center rounded-2xl border border-black/5 bg-canvas px-4 transition focus-within:border-accentLight focus-within:bg-white">
                        <Search size={16} className="shrink-0 text-textTertiary" strokeWidth={2.5} />
                        <input
                          value={addrQuery}
                          onChange={(e) => handleAddrChange(e.target.value)}
                          placeholder="Type a place or address…"
                          className="w-full bg-transparent py-3 pl-2 text-textPrimary outline-none"
                        />
                        {searching && <Loader2 size={16} className="spin shrink-0 text-textTertiary" />}
                      </div>
                      {suggestions.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-clayCard">
                          {suggestions.map((s, i) => (
                            <li key={i}>
                              <button
                                type="button"
                                onClick={() => selectSuggestion(s)}
                                className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition hover:bg-canvas"
                              >
                                <MapPin
                                  size={15}
                                  className="mt-0.5 shrink-0 text-accent"
                                  strokeWidth={2.5}
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-textPrimary">
                                    {s.shortName}
                                  </span>
                                  <span className="block truncate text-xs text-textTertiary">
                                    {s.displayName}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onPickOnMap}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-black/5 bg-canvas py-3 text-sm font-bold text-textSecondary transition hover:border-accentLight"
                    >
                      <MapPin size={16} strokeWidth={2.5} /> Or pick on the map
                    </button>
                  </div>
                )}
              </div>

              {/* When — today through +7 days */}
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-textTertiary">
                  When
                </span>
                <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
                  {days.map((d, i) => {
                    const ds = dayStrs[i];
                    const active = ds === dateStr;
                    const label = i === 0 ? "Today" : i === 1 ? "Tom" : d.toLocaleDateString(undefined, { weekday: "short" });
                    return (
                      <button
                        type="button"
                        key={ds}
                        onClick={() => setDateStr(ds)}
                        className={`flex w-14 shrink-0 flex-col items-center rounded-2xl border-2 py-2 transition ${
                          active
                            ? "border-transparent text-white shadow-clayButton"
                            : "border-black/5 bg-canvas text-textSecondary"
                        }`}
                        style={active ? { background: grad(["#A78BFA", "#7C3AED"]) } : undefined}
                      >
                        <span className="text-[11px] font-bold uppercase">{label}</span>
                        <span className="text-lg font-extrabold leading-none">{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {!anytime && (
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-32 rounded-2xl border border-black/5 bg-canvas px-4 py-3 text-textPrimary outline-none transition focus:border-accentLight focus:bg-white"
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm text-textSecondary">
                    <input
                      type="checkbox"
                      checked={anytime}
                      onChange={(e) => setAnytime(e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                    Any time during the day
                  </label>
                </div>
              </div>

              {/* Description */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-textTertiary">
                  Details <span className="font-normal normal-case text-textTertiary">(optional)</span>
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything people should know…"
                  rows={3}
                  maxLength={500}
                  className="w-full resize-none rounded-2xl border border-black/5 bg-canvas px-4 py-3 text-textPrimary outline-none transition focus:border-accentLight focus:bg-white"
                />
              </label>

              {/* Approval toggle */}
              <button
                type="button"
                onClick={() => setRequireApproval((v) => !v)}
                className="flex w-full items-center justify-between rounded-2xl border border-black/5 bg-canvas px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-bold text-textPrimary">
                    Require host approval to join
                  </span>
                  <span className="block text-xs text-textTertiary">
                    You approve each person before they&apos;re in.
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    requireApproval ? "bg-accent" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      requireApproval ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm font-medium text-error">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={2.5} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-clayButton transition active:scale-[0.98] disabled:opacity-70"
                style={{ background: grad(["#A78BFA", "#7C3AED"]) }}
              >
                {submitting ? <Loader2 size={18} className="spin" /> : null}
                {submitting ? "Checking…" : user ? "Post activity" : "Continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </Sheet>
  );
}
