"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X, Search, Shield, Ban, RotateCcw, Pencil, Trash2, Users as UsersIcon,
  Flag, Loader2, Check, AlertTriangle, Save, ChevronLeft, Mail,
} from "lucide-react";
import { Sheet } from "./Sheet";
import { grad, authorGradient } from "@/lib/theme";
import {
  adminSearchUsers, adminUpdateUser, adminBanUser, adminUnbanUser,
  adminSearchEvents, adminUpdateEvent, adminDeleteEvent,
  adminEventMembers, adminRemoveMember, adminListReports, adminBroadcast,
  type AdminUser, type AdminMember, type AdminReport,
} from "@/lib/api";
import type { EventProps } from "@/lib/types";

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  /** Called after an event is edited/deleted so the map can refresh its pins. */
  onEventsChanged?: () => void;
}

type Tab = "users" | "events" | "reports";

const PURPLE: readonly [string, string] = ["#A78BFA", "#7C3AED"];

export function AdminPanel({ open, onClose, onEventsChanged }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>("users");
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3200);
    return () => clearTimeout(t);
  }, [flash]);

  const ok = useCallback((text: string) => setFlash({ kind: "ok", text }), []);
  const err = useCallback((e: any) => setFlash({ kind: "err", text: e?.body?.message || e?.message || "Something went wrong" }), []);

  const [broadcasting, setBroadcasting] = useState(false);
  const sendBroadcast = async () => {
    if (!window.confirm("Send the launch email?\n\nTest mode: it only goes to your own inbox for now (not the real waitlist).")) return;
    setBroadcasting(true);
    try {
      const r = await adminBroadcast();
      ok(
        r.test_mode
          ? `Test email sent to your inbox · ${r.waitlist_count} on the waitlist`
          : `Sent to ${r.sent} of ${r.waitlist_count} waitlist emails`,
      );
    } catch (e) {
      err(e);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} variant="right" widthClass="w-[94vw] max-w-[460px]" zClass="z-[1100]">
      <div className="flex h-full flex-col bg-white shadow-clayHero">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: grad(PURPLE) }}>
              <Shield size={16} strokeWidth={2.6} className="text-white" />
            </span>
            <h2 className="font-heading text-xl font-extrabold text-textPrimary">Admin</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-textSecondary transition hover:bg-accentMuted"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5">
          {([
            ["users", "Users", UsersIcon],
            ["events", "Events", Flag],
            ["reports", "Reports", AlertTriangle],
          ] as [Tab, string, typeof UsersIcon][]).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                tab === key ? "text-white shadow-clayButton" : "bg-canvas text-textSecondary hover:bg-accentMuted"
              }`}
              style={tab === key ? { background: grad(PURPLE) } : undefined}
            >
              <Icon size={13} strokeWidth={2.6} /> {label}
            </button>
          ))}
        </div>

        {/* Broadcast */}
        <button
          onClick={sendBroadcast}
          disabled={broadcasting}
          className="mx-5 mt-3 flex items-center justify-center gap-2 rounded-xl border border-accent/20 bg-accentMuted/50 py-2.5 text-xs font-bold text-accent transition hover:bg-accentMuted disabled:opacity-60"
        >
          {broadcasting ? <Loader2 size={13} className="spin" /> : <Mail size={13} strokeWidth={2.6} />}
          Email the waitlist (test → your inbox)
        </button>

        {/* Flash */}
        {flash && (
          <div
            className={`mx-5 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
              flash.kind === "ok" ? "bg-greenMuted text-accentGreen" : "bg-red-50 text-error"
            }`}
          >
            {flash.kind === "ok" ? <Check size={13} strokeWidth={3} /> : <AlertTriangle size={13} strokeWidth={2.6} />}
            {flash.text}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4">
          {tab === "users" && <UsersTab active={open && tab === "users"} onOk={ok} onErr={err} />}
          {tab === "events" && (
            <EventsTab active={open && tab === "events"} onOk={ok} onErr={err} onEventsChanged={onEventsChanged} />
          )}
          {tab === "reports" && <ReportsTab active={open && tab === "reports"} onErr={err} />}
        </div>
      </div>
    </Sheet>
  );
}

// ── Shared bits ───────────────────────────────────────────────────────────────

function Avatar({ url, seed, size = 40 }: { url: string | null; seed: string; size?: number }) {
  const g = authorGradient(seed || "?");
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: grad(g) }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        <span className="font-heading font-extrabold text-white" style={{ fontSize: size * 0.4 }}>
          {(seed || "?").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function SearchBar({
  value, onChange, onSubmit, placeholder, busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  busy: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-2xl border border-black/5 bg-canvas px-3 focus-within:border-accentLight focus-within:bg-white">
      <Search size={15} className="text-textTertiary" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className="w-full bg-transparent py-2.5 text-sm text-textPrimary outline-none"
      />
      {busy && <Loader2 size={15} className="spin text-textTertiary" />}
    </div>
  );
}

const Spinner = () => (
  <div className="flex justify-center py-10">
    <Loader2 size={22} className="spin text-accent" />
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="py-10 text-center text-sm text-textTertiary">{text}</p>
);

// ── Users tab ─────────────────────────────────────────────────────────────────

function UsersTab({ active, onOk, onErr }: { active: boolean; onOk: (t: string) => void; onErr: (e: any) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editHandle, setEditHandle] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminSearchUsers(q));
    } catch (e) {
      onErr(e);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [q, onErr]);

  useEffect(() => {
    if (active && !loaded) search();
  }, [active, loaded, search]);

  const saveHandle = async (u: AdminUser) => {
    const h = editHandle.trim().replace(/^@/, "");
    if (h.length < 2) return;
    setBusyId(u.id);
    try {
      const updated = await adminUpdateUser(u.id, { instagram: h });
      setRows((p) => p.map((r) => (r.id === u.id ? updated : r)));
      setEditId(null);
      onOk(`Handle updated to @${updated.instagram}`);
    } catch (e) {
      onErr(e);
    } finally {
      setBusyId(null);
    }
  };

  const toggleBan = async (u: AdminUser) => {
    if (u.banned) {
      setBusyId(u.id);
      try {
        await adminUnbanUser(u.id);
        setRows((p) => p.map((r) => (r.id === u.id ? { ...r, banned: false, ban_reason: null, banned_at: null } : r)));
        onOk(`@${u.instagram} unbanned`);
      } catch (e) {
        onErr(e);
      } finally {
        setBusyId(null);
      }
      return;
    }
    const reason = window.prompt(`Ban @${u.instagram}? They'll be removed from every activity and blocked from joining/hosting.\n\nOptional reason:`, "");
    if (reason === null) return; // cancelled
    setBusyId(u.id);
    try {
      await adminBanUser(u.id, reason || undefined);
      setRows((p) => p.map((r) => (r.id === u.id ? { ...r, banned: true, ban_reason: reason || null, banned_at: new Date().toISOString() } : r)));
      onOk(`@${u.instagram} banned`);
    } catch (e) {
      onErr(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <SearchBar value={q} onChange={setQ} onSubmit={search} placeholder="Search by Instagram handle…" busy={loading} />
      {loading && rows.length === 0 ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty text={loaded ? "No users found." : ""} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((u) => (
            <li key={u.id} className="rounded-2xl bg-canvas p-3 shadow-clayCardSm">
              <div className="flex items-center gap-3">
                <Avatar url={u.avatar_url} seed={u.instagram} />
                <div className="min-w-0 flex-1">
                  {editId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-textTertiary">@</span>
                      <input
                        value={editHandle}
                        onChange={(e) => setEditHandle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveHandle(u)}
                        autoFocus
                        className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-textPrimary outline-none focus:border-accentLight"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-heading text-sm font-extrabold text-textPrimary">@{u.instagram}</span>
                      {u.banned && (
                        <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-error">BANNED</span>
                      )}
                    </div>
                  )}
                  {u.email && <p className="truncate text-[11px] text-textTertiary">{u.email}</p>}
                  {u.banned && u.ban_reason && <p className="truncate text-[11px] text-error/80">Reason: {u.ban_reason}</p>}
                </div>
                {busyId === u.id && <Loader2 size={15} className="spin text-textTertiary" />}
              </div>

              <div className="mt-2.5 flex gap-2">
                {editId === u.id ? (
                  <>
                    <button
                      onClick={() => saveHandle(u)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold text-white"
                      style={{ background: grad(PURPLE) }}
                    >
                      <Save size={12} strokeWidth={2.6} /> Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex-1 rounded-xl bg-white py-1.5 text-xs font-bold text-textSecondary shadow-clayCardSm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditId(u.id); setEditHandle(u.instagram); }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-1.5 text-xs font-bold text-textSecondary shadow-clayCardSm transition hover:text-accent"
                    >
                      <Pencil size={12} strokeWidth={2.6} /> Edit handle
                    </button>
                    <button
                      onClick={() => toggleBan(u)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-1.5 text-xs font-bold shadow-clayCardSm transition ${
                        u.banned ? "bg-greenMuted text-accentGreen" : "bg-red-50 text-error"
                      }`}
                    >
                      {u.banned ? <><RotateCcw size={12} strokeWidth={2.6} /> Unban</> : <><Ban size={12} strokeWidth={2.6} /> Ban</>}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ── Events tab ────────────────────────────────────────────────────────────────

function EventsTab({
  active, onOk, onErr, onEventsChanged,
}: {
  active: boolean;
  onOk: (t: string) => void;
  onErr: (e: any) => void;
  onEventsChanged?: () => void;
}) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<EventProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<EventProps | null>(null);
  const [membersFor, setMembersFor] = useState<EventProps | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await adminSearchEvents(q));
    } catch (e) {
      onErr(e);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [q, onErr]);

  useEffect(() => {
    if (active && !loaded) search();
  }, [active, loaded, search]);

  const del = async (ev: EventProps) => {
    if (!window.confirm(`Delete "${ev.name}"? This removes the pin, its chat and all memberships. This can't be undone.`)) return;
    setBusyId(ev.id);
    try {
      await adminDeleteEvent(ev.id);
      setRows((p) => p.filter((r) => r.id !== ev.id));
      onOk("Activity deleted");
      onEventsChanged?.();
    } catch (e) {
      onErr(e);
    } finally {
      setBusyId(null);
    }
  };

  if (editing) {
    return (
      <EventEditor
        event={editing}
        onBack={() => setEditing(null)}
        onSaved={(updated) => {
          setRows((p) => p.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
          setEditing(null);
          onOk("Activity updated");
          onEventsChanged?.();
        }}
        onErr={onErr}
      />
    );
  }
  if (membersFor) {
    return <MembersView event={membersFor} onBack={() => setMembersFor(null)} onOk={onOk} onErr={onErr} />;
  }

  return (
    <>
      <SearchBar value={q} onChange={setQ} onSubmit={search} placeholder="Search activities by name…" busy={loading} />
      {loading && rows.length === 0 ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty text={loaded ? "No activities found." : ""} />
      ) : (
        <ul className="space-y-2.5">
          {rows.map((ev) => (
            <li key={ev.id} className="rounded-2xl bg-canvas p-3 shadow-clayCardSm">
              <div className="flex items-center gap-3">
                <Avatar url={ev.organizer_photo_url ?? ev.organizer_avatar_url ?? null} seed={ev.organizer_username ?? ev.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-extrabold text-textPrimary">{ev.name}</p>
                  <p className="truncate text-[11px] text-textTertiary">
                    {ev.organizer_username ? `@${ev.organizer_username}` : "Unknown host"}
                    {" · "}
                    {ev.going_count ?? 0} going
                    {ev.visibility === "private" ? " · private" : ""}
                  </p>
                  {ev.startDate && <p className="truncate text-[11px] text-textTertiary">{ev.startDate}</p>}
                </div>
                {busyId === ev.id && <Loader2 size={15} className="spin text-textTertiary" />}
              </div>

              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => setEditing(ev)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-1.5 text-xs font-bold text-textSecondary shadow-clayCardSm transition hover:text-accent"
                >
                  <Pencil size={12} strokeWidth={2.6} /> Edit
                </button>
                <button
                  onClick={() => setMembersFor(ev)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white py-1.5 text-xs font-bold text-textSecondary shadow-clayCardSm transition hover:text-accent"
                >
                  <UsersIcon size={12} strokeWidth={2.6} /> People
                </button>
                <button
                  onClick={() => del(ev)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-50 py-1.5 text-xs font-bold text-error shadow-clayCardSm"
                >
                  <Trash2 size={12} strokeWidth={2.6} /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm font-bold text-textSecondary transition hover:text-accent">
      <ChevronLeft size={16} strokeWidth={2.6} /> {title}
    </button>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-textTertiary">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-textPrimary outline-none focus:border-accentLight";

function EventEditor({
  event, onBack, onSaved, onErr,
}: {
  event: EventProps;
  onBack: () => void;
  onSaved: (e: EventProps) => void;
  onErr: (e: any) => void;
}) {
  const [name, setName] = useState(event.name ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [locationText, setLocationText] = useState(event.location_text ?? "");
  const [category, setCategory] = useState(event.category ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(event.visibility === "private" ? "private" : "public");
  const [requireApproval, setRequireApproval] = useState(!!event.require_approval);
  const [capacity, setCapacity] = useState(event.capacity != null ? String(event.capacity) : "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminUpdateEvent(event.id, {
        name,
        description: description || null,
        location_text: locationText || null,
        category: category || null,
        visibility,
        require_approval: requireApproval,
        capacity: capacity.trim() === "" ? null : Number(capacity),
      });
      onSaved(updated);
    } catch (e) {
      onErr(e);
      setSaving(false);
    }
  };

  return (
    <div>
      <BackHeader title="Back to activities" onBack={onBack} />
      <div className="space-y-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="Location text">
          <input value={locationText} onChange={(e) => setLocationText(e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Capacity">
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              placeholder="∞"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Visibility">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className={inputCls}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-textSecondary">
          <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="h-4 w-4 accent-accent" />
          Require approval to join
        </label>

        <button
          onClick={save}
          disabled={saving || name.trim().length < 3}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white shadow-clayButton transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: grad(PURPLE) }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} strokeWidth={2.6} />} Save changes
        </button>
      </div>
    </div>
  );
}

function MembersView({
  event, onBack, onOk, onErr,
}: {
  event: EventProps;
  onBack: () => void;
  onOk: (t: string) => void;
  onErr: (e: any) => void;
}) {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await adminEventMembers(event.id));
    } catch (e) {
      onErr(e);
    } finally {
      setLoading(false);
    }
  }, [event.id, onErr]);

  useEffect(() => { load(); }, [load]);

  const remove = async (m: AdminMember) => {
    if (!window.confirm(`Remove @${m.instagram ?? "this person"} from "${event.name}"?`)) return;
    setBusyId(m.id);
    try {
      await adminRemoveMember(event.id, { user_id: m.id, source: m.source });
      setMembers((p) => p.filter((x) => x.id !== m.id));
      onOk("Removed from activity");
    } catch (e) {
      onErr(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <BackHeader title="Back to activities" onBack={onBack} />
      <p className="mb-3 truncate font-heading text-sm font-extrabold text-textPrimary">{event.name}</p>
      {loading ? (
        <Spinner />
      ) : members.length === 0 ? (
        <Empty text="No one has joined yet." />
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={`${m.source}:${m.id}`} className="flex items-center gap-3 rounded-2xl bg-canvas p-2.5 shadow-clayCardSm">
              <Avatar url={m.avatar_url} seed={m.instagram ?? m.id} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-textPrimary">{m.instagram ? `@${m.instagram}` : "Unknown"}</p>
                <p className="text-[11px] text-textTertiary">
                  {m.source === "app" ? "App user" : "Web user"}
                  {m.status === "pending" ? " · pending" : ""}
                </p>
              </div>
              {busyId === m.id ? (
                <Loader2 size={15} className="spin text-textTertiary" />
              ) : (
                <button
                  onClick={() => remove(m)}
                  className="rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-bold text-error transition active:scale-95"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────

function ReportsTab({ active, onErr }: { active: boolean; onErr: (e: any) => void }) {
  const [rows, setRows] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!active || loaded) return;
    setLoading(true);
    adminListReports()
      .then(setRows)
      .catch(onErr)
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [active, loaded, onErr]);

  if (loading) return <Spinner />;
  if (rows.length === 0) return <Empty text={loaded ? "No reports filed." : ""} />;

  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="rounded-2xl bg-canvas p-3 shadow-clayCardSm">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-textPrimary">
              {r.reporter_instagram ? `@${r.reporter_instagram}` : "Someone"}
              <span className="font-normal text-textTertiary"> reported </span>
              {r.reportee_instagram ? `@${r.reportee_instagram}` : "a user"}
            </span>
            <span className="shrink-0 text-[10px] text-textTertiary">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          {r.event_name && <p className="mb-1 text-[11px] text-textTertiary">Activity: {r.event_name}</p>}
          <p className="rounded-lg bg-white p-2 text-xs leading-relaxed text-textSecondary">{r.reason}</p>
        </li>
      ))}
    </ul>
  );
}
