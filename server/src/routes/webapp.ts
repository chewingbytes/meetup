import express from "express";
import { supabase } from "../../db/supabaseClient.js";
import { requireUser, requireAdmin } from "../middleware/auth.ts";

/**
 * Webapp routes — Google-anchored, IG-handle identities for the beta web app.
 *
 * Identity model: a webapp user's `id` IS their Supabase auth (Google) user id,
 * and their sole display identity is `instagram`. This ties participation to a
 * verified account (anti-spam) while keeping webapp users in their own tables
 * (webapp_users + webapp_event_members) — no FK conflicts with the native app.
 *
 * Approval flow: events with `require_approval = true` put new joiners in
 * `status = 'pending'`; the organizer accepts/rejects via the dashboard.
 *
 * See webapp/SETUP.md for the SQL.
 */
const router = express.Router();

// ── Avatar caching (fixes Google's 429 hotlink throttling) ───────────────────
// Browsers loading lh3.googleusercontent.com directly from many pins get rate
// limited (HTTP 429). We download the Google avatar once and re-host it in our
// own Supabase Storage bucket (R2-backed "soonest" bucket), then serve that
// stable public URL everywhere. Avatars live under the `avatars/` prefix.
const AVATAR_BUCKET = "soonest";
const AVATAR_PREFIX = "avatars";
let bucketReady = false;
// Last storage error seen — surfaced by GET /webapp/debug/storage for diagnosis.
let lastAvatarError: string | null = null;

/** Make sure the logical Supabase Storage bucket exists. We don't latch the
 *  "ready" flag on failure, so a transient/config error is retried next call. */
async function ensureAvatarBucket(): Promise<boolean> {
  if (bucketReady) return true;
  // createBucket is idempotent enough for us: it errors if the bucket already
  // exists, which is success for our purposes.
  const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, {
    public: true,
  });
  if (error && !/exist/i.test(error.message)) {
    lastAvatarError = `createBucket: ${error.message}`;
    console.warn("[webapp] createBucket failed:", error.message);
    return false;
  }
  bucketReady = true;
  return true;
}

function isGoogleAvatar(url: unknown): url is string {
  return typeof url === "string" && /googleusercontent\.com/.test(url);
}

/** A "public" activity (per the vote-to-kick rules): anyone can join freely —
 *  not marked private AND the organizer doesn't approve joiners. Private OR
 *  approval-gated events are organizer-moderated instead. */
function isPublicEvent(ev: { visibility?: string | null; require_approval?: boolean | null } | null): boolean {
  return !!ev && (ev.visibility ?? "public") !== "private" && !ev.require_approval;
}

/** Whether a user may read/post in a channel: they must be the organizer of the
 *  channel's event or an approved member of it. Gates the chat endpoints so a
 *  signed-in user can't read or post into activities they haven't joined. */
async function canAccessChannel(userId: string, channelId: string): Promise<boolean> {
  if (!userId || !channelId) return false;
  const { data: chan } = await supabase
    .from("channels")
    .select("event_id")
    .eq("id", channelId)
    .maybeSingle();
  const eventId = chan?.event_id;
  if (!eventId) return false;
  const { data: ev } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();
  if (ev?.organizer_id === userId) return true;
  const { data: mem } = await supabase
    .from("webapp_event_members")
    .select("status")
    .eq("event_id", eventId)
    .eq("webapp_user_id", userId)
    .maybeSingle();
  return mem?.status === "approved";
}

// ── Premium (launch-waitlist) lookup ─────────────────────────────────────────
// "Premium" = an account's verified email is on soonest_waitlist (early access +
// 3-months-free perk). The waitlist is small and rarely changes, so we cache the
// lowercased email set in memory briefly instead of re-reading it on every batch.
let waitlistCache: { emails: Set<string>; at: number } | null = null;
const WAITLIST_TTL_MS = 5 * 60 * 1000;

async function loadWaitlistEmails(): Promise<Set<string>> {
  if (waitlistCache && Date.now() - waitlistCache.at < WAITLIST_TTL_MS) {
    return waitlistCache.emails;
  }
  const { data, error } = await supabase.from("soonest_waitlist").select("email");
  if (error) throw error;
  const emails = new Set(
    (data || [])
      .map((r: any) => String(r.email ?? "").trim().toLowerCase())
      .filter(Boolean),
  );
  waitlistCache = { emails, at: Date.now() };
  return emails;
}

/** Whether a single email is on the launch waitlist (case-insensitive). */
async function isWaitlisted(email: string | null | undefined): Promise<boolean> {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return false;
  const waitlist = await loadWaitlistEmails();
  return waitlist.has(e);
}

/** Given webapp_users ids (= Supabase auth uids), return the subset that are
 *  premium. Resolves each account's email via the Auth admin API, then matches
 *  the waitlist. Fail-open: any lookup error just leaves that id non-premium. */
async function premiumIdsFor(ids: string[]): Promise<Set<string>> {
  const premium = new Set<string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return premium;
  try {
    const waitlist = await loadWaitlistEmails();
    if (waitlist.size === 0) return premium;
    await Promise.all(
      unique.map(async (id) => {
        try {
          const { data } = await supabase.auth.admin.getUserById(id);
          const email = data?.user?.email?.trim().toLowerCase();
          if (email && waitlist.has(email)) premium.add(id);
        } catch {
          /* ignore individual lookup failures — fail-open to non-premium */
        }
      }),
    );
  } catch {
    /* waitlist unavailable — treat everyone as non-premium */
  }
  return premium;
}

/** Browser-facing public URL for a stored avatar. Prefers AVATAR_PUBLIC_BASE (so
 *  we can serve over the public HTTPS domain even when SUPABASE_URL is an
 *  internal http://IP), falling back to supabase-js's getPublicUrl. */
function publicAvatarUrl(path: string): string | null {
  const base = process.env.AVATAR_PUBLIC_BASE?.replace(/\/$/, "");
  if (base) return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/** Rewrite a stored Supabase Storage URL onto the public HTTPS base so browsers
 *  never receive an insecure http://IP URL (mixed content). Applied at read time
 *  so older rows self-heal. Non-storage URLs (Google, native app) and the
 *  no-base case pass through untouched. */
function normalizeStoredAvatar<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const base = process.env.AVATAR_PUBLIC_BASE?.replace(/\/$/, "");
  if (!base) return url;
  const idx = url.indexOf("/storage/v1/object/");
  if (idx === -1) return url;
  return (base + url.slice(idx)) as T;
}

/** Download a remote avatar and re-host it in our public bucket. Returns the
 *  hosted public URL, or null on failure (caller falls back to the source). */
async function cacheAvatar(uid: string, sourceUrl: string): Promise<string | null> {
  try {
    if (!(await ensureAvatarBucket())) return null;
    const resp = await fetch(sourceUrl);
    if (!resp.ok) {
      lastAvatarError = `fetch avatar: HTTP ${resp.status}`;
      console.warn("[webapp] avatar fetch failed:", resp.status);
      return null;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const path = `${AVATAR_PREFIX}/${uid}.${ext}`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, buf, { contentType, upsert: true });
    if (error) {
      lastAvatarError = `upload: ${error.message}`;
      console.warn("[webapp] avatar upload failed:", error.message);
      return null;
    }
    lastAvatarError = null;
    const url = publicAvatarUrl(path);
    // Cache-bust so a re-uploaded avatar isn't served stale from the CDN.
    return url ? `${url}?v=${Date.now()}` : null;
  } catch (e: any) {
    lastAvatarError = `exception: ${e?.message || String(e)}`;
    console.warn("[webapp] cacheAvatar failed:", e?.message);
    return null;
  }
}

/** Attach organizer display fields, resolving from BOTH native profiles and
 *  webapp_users (so webapp-hosted events get an organizer avatar too). */
async function enrichEvents(events: any[]): Promise<any[]> {
  const organizerIds = [...new Set(events.map((e) => e.organizer_id).filter(Boolean))] as string[];
  if (organizerIds.length === 0) {
    return events.map((e) => ({
      ...e,
      organizer_username: null,
      organizer_avatar_url: null,
      organizer_photo_url: null,
    }));
  }
  const [{ data: profiles }, { data: webUsers }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url, photo_urls").in("id", organizerIds),
    supabase.from("webapp_users").select("id, instagram, avatar_url").in("id", organizerIds),
  ]);
  const map: Record<string, { username: string | null; avatar_url: string | null; photo_url: string | null }> = {};
  for (const p of profiles || [])
    map[p.id] = {
      username: p.username ?? null,
      avatar_url: p.avatar_url ?? null,
      photo_url: p.photo_urls?.[0] ?? p.avatar_url ?? null,
    };
  // Webapp identities fill in (or override empty) profile fields — a webapp host
  // may have an auth/profiles row with no username, so the IG handle is the name.
  for (const w of webUsers || []) {
    const cur = map[w.id];
    map[w.id] = {
      username: cur?.username ?? w.instagram ?? null,
      avatar_url: cur?.avatar_url ?? w.avatar_url ?? null,
      photo_url: cur?.photo_url ?? w.avatar_url ?? null,
    };
  }
  return events.map((e) => {
    const o = map[e.organizer_id];
    return {
      ...e,
      organizer_username: o?.username ?? null,
      organizer_avatar_url: normalizeStoredAvatar(o?.avatar_url ?? null),
      organizer_photo_url: normalizeStoredAvatar(o?.photo_url ?? null),
    };
  });
}

/** Attach `going_count` (approved attendees: native user_events + webapp approved
 *  members) to each event — powers the count badge on the map pins. Batched into
 *  two `in(...)` queries so the whole feed costs the same regardless of size. */
async function attachGoingCounts(events: any[]): Promise<any[]> {
  const ids = events.map((e) => e.id).filter(Boolean);
  if (ids.length === 0) return events;
  const [{ data: ue }, { data: mem }] = await Promise.all([
    supabase.from("user_events").select("event_id").in("event_id", ids),
    supabase
      .from("webapp_event_members")
      .select("event_id")
      .in("event_id", ids)
      .eq("status", "approved"),
  ]);
  const counts: Record<string, number> = {};
  for (const r of ue || []) counts[r.event_id] = (counts[r.event_id] || 0) + 1;
  for (const r of mem || []) counts[r.event_id] = (counts[r.event_id] || 0) + 1;
  return events.map((e) => ({ ...e, going_count: counts[e.id] || 0 }));
}

// ── Map feed: upcoming activities (excludes ended days; new events always in) ──
// GET /api/webapp/events
router.get("/events", async (req, res) => {
  try {
    const nowIso = new Date().toISOString();
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .gte("end_at", nowIso) // only activities whose day hasn't ended
      .order("startDate", { ascending: true })
      .limit(200);
    if (error) throw error;
    res.json(await attachGoingCounts(await enrichEvents(events || [])));
  } catch (err: any) {
    console.error("[webapp] map events error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch events" });
  }
});

// ── My activities: organized + approved-joined (any date — powers the rail) ───
// GET /api/webapp/my-activities?webapp_user_id=...
router.get("/my-activities", requireUser, async (req: any, res) => {
  try {
    const uid = req.userId as string;

    const [{ data: organized }, { data: memberships }] = await Promise.all([
      supabase.from("events").select("id").eq("organizer_id", uid),
      supabase
        .from("webapp_event_members")
        .select("event_id")
        .eq("webapp_user_id", uid)
        .eq("status", "approved"),
    ]);

    const ids = [
      ...new Set([
        ...(organized || []).map((e: any) => e.id),
        ...(memberships || []).map((m: any) => m.event_id),
      ]),
    ];
    if (ids.length === 0) return res.json([]);

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .in("id", ids)
      .order("startDate", { ascending: false });
    if (error) throw error;

    const enriched = await enrichEvents(events || []);
    res.json(await attachChannels(enriched));
  } catch (err: any) {
    console.error("[webapp] my-activities error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch activities" });
  }
});

/** Attach each event's chat channel id + its latest message timestamp — lets the
 *  rail order chats by recent activity and compute unread badges. */
async function attachChannels(events: any[]): Promise<any[]> {
  const eventIds = events.map((e) => e.id);
  if (eventIds.length === 0) return events;

  const { data: channels } = await supabase
    .from("channels")
    .select("id, event_id")
    .in("event_id", eventIds);
  const chanByEvent: Record<string, string> = {};
  const chanIds: string[] = [];
  for (const c of channels || []) {
    chanByEvent[c.event_id] = c.id;
    chanIds.push(c.id);
  }

  const lastByChan: Record<string, string> = {};
  if (chanIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("channel_id, created_at")
      .in("channel_id", chanIds)
      .order("created_at", { ascending: false })
      .limit(1000);
    for (const m of msgs || []) {
      if (!lastByChan[m.channel_id]) lastByChan[m.channel_id] = m.created_at;
    }
  }

  return events.map((e) => {
    const channel_id = chanByEvent[e.id] ?? null;
    return {
      ...e,
      channel_id,
      last_message_at: channel_id ? lastByChan[channel_id] ?? null : null,
    };
  });
}

// ── Rail unread counts: messages per channel since the caller last read ───────
// POST /api/webapp/rail-unread { webapp_user_id, reads: { [channel_id]: iso|null } }
// → { [channel_id]: { unread: number, last_message_at: string|null } }
router.post("/rail-unread", requireUser, async (req: any, res) => {
  try {
    const webapp_user_id = req.userId as string;
    const { reads } = req.body ?? {};
    if (!reads || typeof reads !== "object") return res.json({});
    const entries = Object.entries(reads) as [string, string | null][];

    const out: Record<string, { unread: number; last_message_at: string | null }> = {};
    await Promise.all(
      entries.map(async ([channelId, since]) => {
        // Unread = messages after the caller's last-read mark, excluding their own.
        let countQ = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId);
        if (since) countQ = countQ.gt("created_at", since);
        if (webapp_user_id) countQ = countQ.neq("user_id", webapp_user_id);
        const { count } = await countQ;

        // Latest message timestamp (for ordering the rail).
        const { data: latest } = await supabase
          .from("messages")
          .select("created_at")
          .eq("channel_id", channelId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        out[channelId] = {
          unread: count ?? 0,
          last_message_at: latest?.created_at ?? null,
        };
      }),
    );
    res.json(out);
  } catch (err: any) {
    console.error("[webapp] rail-unread error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch unread counts" });
  }
});

// ── Upsert / fetch the webapp profile ────────────────────────────────────────
// POST /api/webapp/users { id, instagram }
router.post("/users", requireUser, async (req: any, res) => {
  try {
    const id = req.userId as string;
    const { instagram, avatar_url } = req.body ?? {};
    if (!instagram?.trim()) {
      return res.status(400).json({ message: "instagram is required" });
    }
    const handle = String(instagram).trim().replace(/^@/, "");

    // Existing profile for this Google account (if any).
    const { data: existing } = await supabase
      .from("webapp_users")
      .select("id, instagram, avatar_url")
      .eq("id", id)
      .maybeSingle();

    // The Instagram handle is IMMUTABLE once set. A returning account keeps its
    // original handle and we disregard any newly-entered one — users can't change
    // their handle. Uniqueness is only enforced when first claiming a handle.
    const hasHandle = !!existing?.instagram?.trim();
    const effectiveHandle = hasHandle ? existing!.instagram : handle;

    if (!hasHandle) {
      // First-time claim: reject a handle already owned by a different account.
      const { data: clashRows } = await supabase
        .from("webapp_users")
        .select("id")
        .ilike("instagram", effectiveHandle)
        .limit(2);
      const clash = (clashRows || []).find((r: any) => r.id !== id);
      if (clash) {
        return res.status(409).json({
          message: `Instagram @${effectiveHandle} is already in use by another account.`,
          code: "ig_taken",
        });
      }
    }

    const payload: Record<string, any> = {
      id,
      instagram: effectiveHandle,
      updated_at: new Date().toISOString(),
    };
    // Only touch avatar_url when provided, so we never wipe an existing one.
    if (avatar_url !== undefined) {
      let finalAvatar = avatar_url;
      if (isGoogleAvatar(avatar_url)) {
        // Reuse a previously cached (non-Google) avatar instead of re-downloading.
        if (existing?.avatar_url && !isGoogleAvatar(existing.avatar_url)) {
          finalAvatar = existing.avatar_url;
        } else {
          finalAvatar = (await cacheAvatar(id, avatar_url)) ?? avatar_url;
        }
      }
      payload.avatar_url = finalAvatar;
    }

    const { data, error } = await supabase
      .from("webapp_users")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();
    if (error) throw error;
    res.status(200).json({ ...data, avatar_url: normalizeStoredAvatar(data.avatar_url) });
  } catch (err: any) {
    // Unique-constraint backstop (handles a race past the check above).
    if (err?.code === "23505") {
      return res.status(409).json({
        message: "That Instagram handle is already in use by another account.",
        code: "ig_taken",
      });
    }
    console.error("[webapp] upsert user error:", err);
    res.status(500).json({ message: err.message || "Failed to save user" });
  }
});

// GET /api/webapp/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("webapp_users")
      .select("id, instagram, avatar_url, created_at")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json({ ...data, avatar_url: normalizeStoredAvatar(data.avatar_url) });
  } catch (err: any) {
    console.error("[webapp] get user error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch user" });
  }
});

// Optional shared-secret guard for the debug routes. If ADMIN_TOKEN is set in
// the server env, callers must pass ?token=… (or x-admin-token header); if it's
// unset we allow it (dev convenience) but warn so it isn't left open forever.
function debugAllowed(req: any): boolean {
  const expected = process.env.ADMIN_TOKEN;
  // Fail closed: if no secret is configured, the debug routes (which leak storage
  // config and can trigger bulk avatar re-hosting) stay locked rather than open.
  if (!expected) {
    console.warn("[webapp] debug route blocked — ADMIN_TOKEN is not set");
    return false;
  }
  const got = req.query?.token || req.headers?.["x-admin-token"];
  return typeof got === "string" && got.length > 0 && got === expected;
}

// ── Batch avatar lookup (powers chat message avatars) ────────────────────────
// POST /api/webapp/avatars { ids: string[] } → { [id]: { instagram, avatar_url } }
router.post("/avatars", async (req, res) => {
  try {
    const raw = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const ids = [...new Set(raw.filter((x: any) => typeof x === "string" && x))] as string[];
    if (ids.length === 0) return res.json({});

    const [{ data: profiles }, { data: webUsers }] = await Promise.all([
      supabase.from("profiles").select("id, username, avatar_url").in("id", ids),
      supabase.from("webapp_users").select("id, instagram, avatar_url").in("id", ids),
    ]);

    // Only webapp (Google-anchored) identities can be waitlist/premium members.
    const premiumSet = await premiumIdsFor((webUsers || []).map((w: any) => w.id));

    const out: Record<string, { instagram: string | null; avatar_url: string | null; premium: boolean }> = {};
    for (const p of profiles || [])
      out[p.id] = { instagram: p.username ?? null, avatar_url: normalizeStoredAvatar(p.avatar_url ?? null), premium: false };
    // Webapp identities win over native profiles for the same id.
    for (const w of webUsers || [])
      out[w.id] = { instagram: w.instagram ?? null, avatar_url: normalizeStoredAvatar(w.avatar_url ?? null), premium: premiumSet.has(w.id) };

    res.json(out);
  } catch (err: any) {
    console.error("[webapp] avatars error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch avatars" });
  }
});

// ── Storage diagnostics: tells you EXACTLY why avatar uploads fail ────────────
// GET /api/webapp/debug/storage[?token=…]
router.get("/debug/storage", async (req, res) => {
  if (!debugAllowed(req)) return res.status(403).json({ message: "forbidden" });
  const report: Record<string, any> = {
    bucket: AVATAR_BUCKET,
    prefix: AVATAR_PREFIX,
    supabase_url: process.env.SUPABASE_URL ?? null,
    lastAvatarError,
  };
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    report.listBuckets = listErr
      ? { error: listErr.message }
      : (buckets || []).map((b: any) => ({ name: b.name, public: b.public }));

    const { error: createErr } = await supabase.storage.createBucket(AVATAR_BUCKET, { public: true });
    report.ensureBucket = createErr ? createErr.message : "created";

    // Live round-trip via supabase-js — unwrap the (often opaque) error so we see
    // the underlying S3/R2 cause instead of a bare "Error".
    const testPath = `${AVATAR_PREFIX}/_diagnostic.txt`;
    const { error: upErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(testPath, Buffer.from(`ok ${new Date().toISOString()}`), {
        contentType: "text/plain",
        upsert: true,
      });
    report.uploadTest = upErr
      ? {
          name: (upErr as any).name,
          message: upErr.message,
          status: (upErr as any).status,
          statusCode: (upErr as any).statusCode,
          originalError: (upErr as any).originalError
            ? String((upErr as any).originalError)
            : undefined,
        }
      : "ok";

    // Raw REST upload — bypasses supabase-js error mangling so we capture the
    // storage container's actual HTTP status + response body (the real reason).
    try {
      const base = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
      const rawRes = await fetch(
        `${base}/storage/v1/object/${AVATAR_BUCKET}/${AVATAR_PREFIX}/_diagnostic_raw.txt`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.SUPABASE_ROLE_KEY}`,
            "Content-Type": "text/plain",
            "x-upsert": "true",
          },
          body: `raw ok ${new Date().toISOString()}`,
        },
      );
      report.rawUpload = { status: rawRes.status, body: await rawRes.text() };
    } catch (e: any) {
      report.rawUpload = { fetchError: e?.message || String(e) };
    }

    const { data: pub } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(testPath);
    report.publicUrl = pub?.publicUrl ?? null;

    const { data: objs, error: lsErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(AVATAR_PREFIX, { limit: 20 });
    report.objects = lsErr ? { error: lsErr.message } : (objs || []).map((o: any) => o.name);

    res.json(report);
  } catch (e: any) {
    report.exception = e?.message || String(e);
    res.status(500).json(report);
  }
});

// ── Bulk-migrate existing Google avatar URLs into the bucket (run once after
//    storage works). POST /api/webapp/debug/rehost-avatars[?token=…]
router.post("/debug/rehost-avatars", async (req, res) => {
  if (!debugAllowed(req)) return res.status(403).json({ message: "forbidden" });
  try {
    const { data: rows, error } = await supabase
      .from("webapp_users")
      .select("id, avatar_url")
      .limit(1000);
    if (error) throw error;

    const targets = (rows || []).filter((r: any) => isGoogleAvatar(r.avatar_url));
    let migrated = 0;
    const failures: { id: string; reason: string | null }[] = [];

    for (const r of targets) {
      const hosted = await cacheAvatar(r.id, r.avatar_url);
      if (hosted) {
        await supabase.from("webapp_users").update({ avatar_url: hosted }).eq("id", r.id);
        migrated++;
      } else {
        failures.push({ id: r.id, reason: lastAvatarError });
      }
    }

    res.json({ candidates: targets.length, migrated, failures });
  } catch (err: any) {
    console.error("[webapp] rehost-avatars error:", err);
    res.status(500).json({ message: err.message || "Failed to re-host avatars" });
  }
});

// ── Chat: list / send (service-role; messages RLS blocks the anon role) ───────
router.get("/messages", requireUser, async (req: any, res) => {
  try {
    const channel_id = req.query.channel_id as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    if (!channel_id) return res.status(400).json({ message: "channel_id is required" });
    if (!(await canAccessChannel(req.userId, channel_id))) {
      return res.status(403).json({ message: "You're not a member of this activity." });
    }
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("channel_id", channel_id)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error("[webapp] list messages error:", err);
    res.status(500).json({ message: err.message || "Failed to load messages" });
  }
});

router.post("/messages", requireUser, async (req: any, res) => {
  try {
    const user_id = req.userId as string;
    const { channel_id, text } = req.body ?? {};
    if (!channel_id || !text?.trim()) {
      return res.status(400).json({ message: "channel_id and text are required" });
    }
    if (!(await canAccessChannel(user_id, channel_id))) {
      return res.status(403).json({ message: "You're not a member of this activity." });
    }
    // Both the sender id and display name are derived server-side (id from the
    // verified token, name from that account's saved handle), so neither can be
    // spoofed. Bound the text so one request can't write an oversized row.
    const cleanText = String(text).trim().slice(0, 2000);
    const { data: prof } = await supabase
      .from("webapp_users")
      .select("instagram")
      .eq("id", user_id)
      .maybeSingle();
    const cleanName = String(prof?.instagram || "guest").trim().slice(0, 60) || "guest";
    const { data, error } = await supabase
      .from("messages")
      .insert({
        channel_id,
        user_id,
        username: cleanName,
        text: cleanText,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    console.error("[webapp] send message error:", err);
    res.status(500).json({ message: err.message || "Failed to send message" });
  }
});

// ── Join an event (status depends on the event's approval setting) ───────────
// POST /api/webapp/events/join { webapp_user_id, event_id }
router.post("/events/join", requireUser, async (req: any, res) => {
  try {
    const webapp_user_id = req.userId as string;
    const { event_id } = req.body ?? {};
    if (!event_id) {
      return res.status(400).json({ message: "event_id is required" });
    }

    // Banned accounts can't join any activity (banhammer).
    const { data: me } = await supabase
      .from("webapp_users")
      .select("banned")
      .eq("id", webapp_user_id)
      .maybeSingle();
    if (me?.banned) {
      return res.status(403).json({
        message: "Your account is banned from joining activities.",
        code: "banned",
      });
    }

    const { data: existing } = await supabase
      .from("webapp_event_members")
      .select("id, status")
      .eq("webapp_user_id", webapp_user_id)
      .eq("event_id", event_id)
      .maybeSingle();
    // Removed (voted/kicked-out) members can't rejoin.
    if (existing?.status === "kicked") {
      return res.status(403).json({
        message: "You were removed from this activity and can't rejoin.",
        code: "kicked",
      });
    }
    if (existing) return res.status(409).json({ message: "Already joined", status: existing.status });

    // Organizer auto-approves; otherwise gate on require_approval.
    const { data: ev } = await supabase
      .from("events")
      .select("organizer_id, require_approval")
      .eq("id", event_id)
      .single();
    const isOrganizer = ev?.organizer_id === webapp_user_id;
    const status = !isOrganizer && ev?.require_approval ? "pending" : "approved";

    const { error } = await supabase.from("webapp_event_members").insert({
      webapp_user_id,
      event_id,
      status,
      joined_at: new Date().toISOString(),
    });
    if (error) throw error;
    res.status(201).json({ success: true, status });
  } catch (err: any) {
    console.error("[webapp] join error:", err);
    res.status(500).json({ message: err.message || "Failed to join" });
  }
});

// POST /api/webapp/events/leave { webapp_user_id, event_id }
router.post("/events/leave", requireUser, async (req: any, res) => {
  try {
    const webapp_user_id = req.userId as string;
    const { event_id } = req.body ?? {};
    if (!event_id) {
      return res.status(400).json({ message: "event_id is required" });
    }
    const { error } = await supabase
      .from("webapp_event_members")
      .delete()
      .eq("webapp_user_id", webapp_user_id)
      .eq("event_id", event_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[webapp] leave error:", err);
    res.status(500).json({ message: err.message || "Failed to leave" });
  }
});

// GET /api/webapp/events/joined?webapp_user_id=...  (approved only)
router.get("/events/joined", requireUser, async (req: any, res) => {
  try {
    const webapp_user_id = req.userId as string;
    const { data, error } = await supabase
      .from("webapp_event_members")
      .select("event_id")
      .eq("webapp_user_id", webapp_user_id)
      .eq("status", "approved");
    if (error) throw error;
    res.json((data || []).map((r: any) => r.event_id));
  } catch (err: any) {
    console.error("[webapp] joined error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch joined events" });
  }
});

// ── Organizer dashboard: list pending requests ───────────────────────────────
// GET /api/webapp/events/:id/requests?host_id=...
router.get("/events/:id/requests", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const host_id = req.userId as string;

    const { data: ev } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();
    if (!ev || ev.organizer_id !== host_id) {
      return res.status(403).json({ message: "Not the organizer of this event" });
    }

    const { data: rows, error } = await supabase
      .from("webapp_event_members")
      .select("webapp_user_id, joined_at")
      .eq("event_id", event_id)
      .eq("status", "pending")
      .order("joined_at", { ascending: true });
    if (error) throw error;

    const ids = (rows || []).map((r: any) => r.webapp_user_id);
    let userMap: Record<string, { instagram: string; avatar_url: string | null }> = {};
    if (ids.length > 0) {
      const { data: users } = await supabase
        .from("webapp_users")
        .select("id, instagram, avatar_url")
        .in("id", ids);
      for (const u of users || []) userMap[u.id] = { instagram: u.instagram, avatar_url: u.avatar_url ?? null };
    }

    res.json(
      (rows || []).map((r: any) => ({
        webapp_user_id: r.webapp_user_id,
        instagram: userMap[r.webapp_user_id]?.instagram ?? null,
        avatar_url: normalizeStoredAvatar(userMap[r.webapp_user_id]?.avatar_url ?? null),
        joined_at: r.joined_at,
      })),
    );
  } catch (err: any) {
    console.error("[webapp] requests error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch requests" });
  }
});

// POST /api/webapp/events/:id/requests/respond { host_id, webapp_user_id, action }
router.post("/events/:id/requests/respond", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const host_id = req.userId as string;
    const { webapp_user_id, action } = req.body ?? {};
    if (!webapp_user_id || !action) {
      return res.status(400).json({ message: "webapp_user_id and action are required" });
    }

    const { data: ev } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();
    if (!ev || ev.organizer_id !== host_id) {
      return res.status(403).json({ message: "Not the organizer of this event" });
    }

    if (action === "accept") {
      const { error } = await supabase
        .from("webapp_event_members")
        .update({ status: "approved" })
        .eq("event_id", event_id)
        .eq("webapp_user_id", webapp_user_id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("webapp_event_members")
        .delete()
        .eq("event_id", event_id)
        .eq("webapp_user_id", webapp_user_id);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[webapp] respond error:", err);
    res.status(500).json({ message: err.message || "Failed to respond" });
  }
});

// ── Resolve an event's chat channel id ───────────────────────────────────────
router.get("/events/:id/channel", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("channels")
      .select("id")
      .eq("event_id", req.params.id)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ channel_id: data?.id ?? null });
  } catch (err: any) {
    console.error("[webapp] channel error:", err);
    res.status(500).json({ message: err.message || "Failed to resolve channel" });
  }
});

// ── Event detail: merged approved roster + the caller's own status ───────────
// GET /api/webapp/events/:id?webapp_user_id=...
router.get("/events/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const webapp_user_id = req.query.webapp_user_id as string | undefined;

    const { data: ev, error } = await supabase.from("events").select("*").eq("id", id).single();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (!ev) return res.status(404).json({ message: "Not found" });

    const participants: any[] = [];

    // Native app participants (user_events → profiles)
    const { data: ueRows } = await supabase
      .from("user_events")
      .select("user_id")
      .eq("event_id", id);
    const appUserIds = (ueRows || []).map((r: any) => r.user_id);
    if (appUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, avatar_url, main_interest, instagram_handle")
        .in("id", appUserIds);
      for (const p of profiles || []) {
        participants.push({
          id: p.id,
          instagram: p.instagram_handle ?? null,
          avatar_url: normalizeStoredAvatar(p.avatar_url ?? null),
          main_interest: p.main_interest ?? null,
          source: "app",
          status: "approved",
        });
      }
    }

    // Webapp participants (approved only) + the caller's own status
    let myStatus: string | null = null;
    try {
      const { data: memRows } = await supabase
        .from("webapp_event_members")
        .select("webapp_user_id, status")
        .eq("event_id", id);
      const approvedIds = (memRows || [])
        .filter((m: any) => m.status === "approved")
        .map((m: any) => m.webapp_user_id);
      if (webapp_user_id) {
        const mine = (memRows || []).find((m: any) => m.webapp_user_id === webapp_user_id);
        myStatus = mine?.status ?? null;
      }
      if (approvedIds.length > 0) {
        const { data: webUsers } = await supabase
          .from("webapp_users")
          .select("id, instagram, avatar_url")
          .in("id", approvedIds);
        const premiumSet = await premiumIdsFor((webUsers || []).map((w: any) => w.id));
        for (const w of webUsers || []) {
          participants.push({
            id: w.id,
            instagram: w.instagram ?? null,
            avatar_url: normalizeStoredAvatar(w.avatar_url ?? null),
            main_interest: null,
            source: "webapp",
            status: "approved",
            premium: premiumSet.has(w.id),
          });
        }
      }
    } catch (e) {
      console.warn("[webapp] webapp participants unavailable:", e);
    }

    // Public activities expose vote-to-kick tallies so the roster can show
    // progress + whether the caller has already voted out each member.
    const is_public = isPublicEvent(ev);
    const kick_votes: Record<string, number> = {};
    const my_kick_votes: string[] = [];
    if (is_public) {
      const { data: ballots } = await supabase
        .from("webapp_kick_votes")
        .select("voter_id, target_id")
        .eq("event_id", id);
      const voters: Record<string, Set<string>> = {};
      for (const b of ballots || []) {
        (voters[b.target_id] ??= new Set()).add(b.voter_id);
        if (webapp_user_id && b.voter_id === webapp_user_id) my_kick_votes.push(b.target_id);
      }
      for (const t of Object.keys(voters)) kick_votes[t] = voters[t].size;
    }

    res.json({ ...ev, participants, my_status: myStatus, is_public, kick_votes, my_kick_votes });
  } catch (err: any) {
    console.error("[webapp] event detail error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch event" });
  }
});

// ── Report a user ─────────────────────────────────────────────────────────────
// POST /api/webapp/events/:id/report { reporter_id, reportee_id, reason }
// (use :id = "none" to file a report not tied to a specific event)
router.post("/events/:id/report", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id === "none" ? null : req.params.id;
    const reporter_id = req.userId as string;
    const { reportee_id, reason } = req.body ?? {};
    if (!reportee_id || !reason?.trim()) {
      return res.status(400).json({ message: "reportee_id and reason are required" });
    }
    if (reporter_id === reportee_id) {
      return res.status(400).json({ message: "You can't report yourself" });
    }
    const { error } = await supabase.from("reports").insert({
      event_id,
      reporter_id,
      reportee_id,
      reason: String(reason).trim().slice(0, 1000),
    });
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error("[webapp] report error:", err);
    res.status(500).json({ message: err.message || "Failed to submit report" });
  }
});

// ── Report an activity ────────────────────────────────────────────────────────
// POST /api/webapp/events/:id/report-activity { reason }
// Reporting an event itself (not a person). Filed against the organizer — the
// party responsible for the activity — with event_id for context, so it reuses
// the reports table with no schema change.
router.post("/events/:id/report-activity", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const reporter_id = req.userId as string;
    const { reason } = req.body ?? {};
    if (!reason?.trim()) {
      return res.status(400).json({ message: "A reason is required" });
    }
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();
    if (evErr && (evErr as any).code !== "PGRST116") throw evErr;
    if (!ev) return res.status(404).json({ message: "Activity not found" });
    const { error } = await supabase.from("reports").insert({
      event_id,
      reporter_id,
      // Organizer is the responsible party; fall back to the reporter only to
      // satisfy the NOT NULL column for the (practically impossible) orphan event.
      reportee_id: ev.organizer_id ?? reporter_id,
      reason: `Activity report — ${String(reason).trim().slice(0, 1000)}`,
    });
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error("[webapp] report activity error:", err);
    res.status(500).json({ message: err.message || "Failed to submit report" });
  }
});

// ── Vote to kick (public activities only; majority of approved members wins) ───
// POST /api/webapp/events/:id/kick-vote { voter_id, target_id }
router.post("/events/:id/kick-vote", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const voter_id = req.userId as string;
    const { target_id } = req.body ?? {};
    if (!target_id) {
      return res.status(400).json({ message: "target_id is required" });
    }
    if (voter_id === target_id) {
      return res.status(400).json({ message: "You can't vote to kick yourself" });
    }

    const { data: ev } = await supabase
      .from("events")
      .select("organizer_id, require_approval, visibility")
      .eq("id", event_id)
      .single();
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (!isPublicEvent(ev)) {
      return res.status(403).json({ message: "Vote-to-kick is only available for public activities." });
    }
    if (ev.organizer_id === target_id) {
      return res.status(403).json({ message: "The organizer can't be voted out." });
    }

    // Voter and target must both be approved members of this activity.
    const { data: members } = await supabase
      .from("webapp_event_members")
      .select("webapp_user_id")
      .eq("event_id", event_id)
      .eq("status", "approved");
    const approved = new Set((members || []).map((m: any) => m.webapp_user_id));
    if (!approved.has(voter_id)) return res.status(403).json({ message: "Only members can vote." });
    if (!approved.has(target_id)) return res.status(404).json({ message: "That person isn't a member." });

    // Record the ballot — unique(event, voter, target) makes this idempotent.
    const { error: voteErr } = await supabase
      .from("webapp_kick_votes")
      .insert({ event_id, voter_id, target_id });
    if (voteErr && (voteErr as any).code !== "23505") throw voteErr;

    // Tally distinct voters against the target; majority = > 50% of members.
    const { data: ballots } = await supabase
      .from("webapp_kick_votes")
      .select("voter_id")
      .eq("event_id", event_id)
      .eq("target_id", target_id);
    const votes = new Set((ballots || []).map((b: any) => b.voter_id)).size;
    const participants = approved.size;
    const kicked = votes > participants / 2;

    if (kicked) {
      await supabase
        .from("webapp_event_members")
        .update({ status: "kicked" })
        .eq("event_id", event_id)
        .eq("webapp_user_id", target_id);
      // The member is gone — clear their ballots so a re-add would start fresh.
      await supabase
        .from("webapp_kick_votes")
        .delete()
        .eq("event_id", event_id)
        .eq("target_id", target_id);
    }

    res.json({ votes, participants, kicked });
  } catch (err: any) {
    console.error("[webapp] kick-vote error:", err);
    res.status(500).json({ message: err.message || "Failed to record vote" });
  }
});

// ── Organizer removes a participant (private / approval-gated activities) ──────
// POST /api/webapp/events/:id/remove { host_id, webapp_user_id }
router.post("/events/:id/remove", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const host_id = req.userId as string;
    const { webapp_user_id } = req.body ?? {};
    if (!webapp_user_id) {
      return res.status(400).json({ message: "webapp_user_id is required" });
    }
    const { data: ev } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();
    if (!ev) return res.status(404).json({ message: "Event not found" });
    if (ev.organizer_id !== host_id) {
      return res.status(403).json({ message: "Only the organizer can remove participants." });
    }
    if (webapp_user_id === host_id) {
      return res.status(400).json({ message: "You can't remove yourself." });
    }
    const { error } = await supabase
      .from("webapp_event_members")
      .update({ status: "kicked" })
      .eq("event_id", event_id)
      .eq("webapp_user_id", webapp_user_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[webapp] remove participant error:", err);
    res.status(500).json({ message: err.message || "Failed to remove participant" });
  }
});

// ── Organizer deletes their own activity (removes the map pin + related rows) ──
router.delete("/events/:id", requireUser, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const host_id = req.userId as string;

    // Only the organizer may delete.
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();
    if (evErr || !ev) return res.status(404).json({ message: "Event not found" });
    if (ev.organizer_id !== host_id) {
      return res.status(403).json({ message: "Only the organizer can delete this activity." });
    }

    // Clear related rows first — the webapp tables aren't ON DELETE CASCADE.
    await supabase.from("webapp_event_members").delete().eq("event_id", event_id);
    await supabase.from("channels").delete().eq("event_id", event_id);
    await supabase.from("user_events").delete().eq("event_id", event_id);

    const { error: delErr } = await supabase.from("events").delete().eq("id", event_id);
    if (delErr) throw delErr;

    res.json({ success: true });
  } catch (err: any) {
    console.error("[webapp] delete event error:", err);
    res.status(500).json({ message: err.message || "Failed to delete activity" });
  }
});

// ── Premium check: is this Google account on the launch waitlist? ──
// Early waitlist members get the Soonest+ early-access badge + 3-months-free
// perk. The waitlist stores only emails, so we match on the verified Google
// email, case-insensitively.
router.get("/waitlist-status", requireUser, async (req: any, res) => {
  try {
    // Use the verified token email — never a client-supplied address (prevents
    // probing whether arbitrary emails are on the waitlist).
    const premium = await isWaitlisted(req.userEmail);
    res.json({ premium });
  } catch (err: any) {
    console.error("[webapp] waitlist-status error:", err);
    res.json({ premium: false }); // fail-open: never block the app on this check
  }
});

// ── Create an activity (webapp) ───────────────────────────────────────────────
// POST /api/webapp/events — mirrors the native create but derives the organizer
// from the verified session (never the body) and skips cover upload. This keeps
// the spoofable native POST /api/events out of the webapp's path entirely.
router.post("/events", requireUser, async (req: any, res) => {
  try {
    const organizer_id = req.userId as string;
    const {
      name,
      description = null,
      startDate = null,
      startTime = null,
      startAnytime = true,
      end_at = null,
      location_text = null,
      location_lat = null,
      location_lng = null,
      location_instructions = null,
      require_approval = false,
      visibility = "public",
      category = null,
      capacity = null,
    } = req.body ?? {};

    if (!name || String(name).trim().length < 3) {
      return res.status(400).json({ message: "A name (3+ characters) is required." });
    }
    if (location_lat == null || location_lng == null) {
      return res.status(400).json({ message: "A location is required." });
    }

    // Banned accounts can't host activities either.
    const { data: meCreate } = await supabase
      .from("webapp_users")
      .select("banned")
      .eq("id", organizer_id)
      .maybeSingle();
    if (meCreate?.banned) {
      return res.status(403).json({ message: "Your account is banned.", code: "banned" });
    }

    const { data: created, error } = await supabase
      .from("events")
      .insert({
        organizer_id,
        name: String(name).trim().slice(0, 120),
        description: description ? String(description).slice(0, 2000) : null,
        startDate: startDate || null,
        startTime: startTime || null,
        startAnytime: startAnytime ?? true,
        end_at: end_at || null,
        location_text: location_text ? String(location_text).slice(0, 300) : null,
        location_lat: Number(location_lat),
        location_lng: Number(location_lng),
        location_instructions: location_instructions || null,
        category: category || null,
        require_approval: !!require_approval,
        is_paid: false,
        price: 0,
        visibility: visibility === "private" ? "private" : "public",
        capacity: capacity === null ? null : capacity,
      })
      .select()
      .single();
    if (error) throw error;

    // Auto-create the chat channel so the activity is chattable immediately.
    if (created?.id) {
      const { error: chanErr } = await supabase.from("channels").insert({
        name: created.name,
        description: `Chat for ${created.name}`,
        event_id: created.id,
      });
      if (chanErr) console.error("[webapp] channel creation failed:", chanErr.message);
    }

    // Enrich with the organizer's handle/avatar (same shape as the GET feed) so
    // the optimistic pin + event sheet show "@handle wants to…" immediately,
    // instead of "Someone" until the next refresh re-fetches the enriched feed.
    const [enriched] = await enrichEvents([created]);
    res.status(201).json(enriched ?? created);
  } catch (err: any) {
    console.error("[webapp] create event error:", err);
    res.status(500).json({ message: err.message || "Failed to create activity" });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// ADMIN (banhammer) — every route below is gated by requireAdmin (the caller's
// VERIFIED email must be on the ADMIN_EMAILS allowlist). The webapp only shows
// the admin panel to allow-listed accounts, but that gate is cosmetic:
// authorisation is enforced HERE on every request. These routes use the service
// role, so they intentionally bypass the per-user ownership checks the normal
// routes apply (an admin can edit/delete anyone's events + remove anyone).
// ════════════════════════════════════════════════════════════════════════════

/** Best-effort email lookup for a set of auth uids (fail-open to null). */
async function emailsFor(ids: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  await Promise.all(
    [...new Set(ids.filter(Boolean))].map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id);
        out[id] = data?.user?.email ?? null;
      } catch {
        out[id] = null;
      }
    }),
  );
  return out;
}

// GET /api/webapp/admin/check → 200 { admin: true } for admins, 403 otherwise.
router.get("/admin/check", requireAdmin, (req: any, res) => {
  res.json({ admin: true, email: req.userEmail });
});

// ── Users: search ────────────────────────────────────────────────────────────
// GET /api/webapp/admin/users?q=handle
router.get("/admin/users", requireAdmin, async (req: any, res) => {
  try {
    const q = String(req.query.q ?? "").trim().replace(/^@/, "");
    let query = supabase
      .from("webapp_users")
      .select("id, instagram, avatar_url, banned, banned_at, ban_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (q) query = query.ilike("instagram", `%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    const emails = await emailsFor((data || []).map((u: any) => u.id));
    res.json(
      (data || []).map((u: any) => ({
        ...u,
        avatar_url: normalizeStoredAvatar(u.avatar_url),
        email: emails[u.id] ?? null,
      })),
    );
  } catch (err: any) {
    console.error("[admin] search users error:", err);
    res.status(500).json({ message: err.message || "Failed to search users" });
  }
});

// ── Users: edit (IG handle / avatar) ─────────────────────────────────────────
// PATCH /api/webapp/admin/users/:id { instagram?, avatar_url? }
router.patch("/admin/users/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = req.params.id;
    const { instagram, avatar_url } = req.body ?? {};
    const patch: Record<string, any> = { updated_at: new Date().toISOString() };

    if (instagram !== undefined) {
      const handle = String(instagram).trim().replace(/^@/, "");
      if (handle.length < 2) return res.status(400).json({ message: "Handle is too short." });
      // Reject a handle already owned by a DIFFERENT account.
      const { data: clashRows } = await supabase
        .from("webapp_users")
        .select("id")
        .ilike("instagram", handle)
        .limit(2);
      const clash = (clashRows || []).find((r: any) => r.id !== id);
      if (clash) return res.status(409).json({ message: `@${handle} is already in use.`, code: "ig_taken" });
      patch.instagram = handle;
    }
    if (avatar_url !== undefined) patch.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("webapp_users")
      .update(patch)
      .eq("id", id)
      .select("id, instagram, avatar_url, banned, banned_at, ban_reason, created_at")
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json({ ...data, avatar_url: normalizeStoredAvatar(data.avatar_url) });
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(409).json({ message: "That handle is already in use.", code: "ig_taken" });
    }
    console.error("[admin] update user error:", err);
    res.status(500).json({ message: err.message || "Failed to update user" });
  }
});

// ── Users: ban (block joins/creates + yank from all current activities) ──────
// POST /api/webapp/admin/users/:id/ban { reason? }
router.post("/admin/users/:id/ban", requireAdmin, async (req: any, res) => {
  try {
    const id = req.params.id;
    if (id === req.userId) return res.status(400).json({ message: "You can't ban yourself." });
    const reason = req.body?.reason ? String(req.body.reason).trim().slice(0, 500) : null;

    const { data, error } = await supabase
      .from("webapp_users")
      .update({ banned: true, banned_at: new Date().toISOString(), ban_reason: reason })
      .eq("id", id)
      .select("id, instagram, banned, banned_at, ban_reason")
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });

    // The hammer: remove them from every webapp activity they're currently in.
    await supabase
      .from("webapp_event_members")
      .update({ status: "kicked" })
      .eq("webapp_user_id", id);

    res.json({ success: true, user: data });
  } catch (err: any) {
    console.error("[admin] ban error:", err);
    res.status(500).json({ message: err.message || "Failed to ban user" });
  }
});

// POST /api/webapp/admin/users/:id/unban  (lifts the flag only; no auto-rejoin)
router.post("/admin/users/:id/unban", requireAdmin, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from("webapp_users")
      .update({ banned: false, banned_at: null, ban_reason: null })
      .eq("id", req.params.id)
      .select("id, instagram, banned")
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user: data });
  } catch (err: any) {
    console.error("[admin] unban error:", err);
    res.status(500).json({ message: err.message || "Failed to unban user" });
  }
});

// ── Events: search ───────────────────────────────────────────────────────────
// GET /api/webapp/admin/events?q=name
router.get("/admin/events", requireAdmin, async (req: any, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    let query = supabase.from("events").select("*").order("startDate", { ascending: false }).limit(30);
    if (q) query = query.ilike("name", `%${q}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(await attachGoingCounts(await enrichEvents(data || [])));
  } catch (err: any) {
    console.error("[admin] search events error:", err);
    res.status(500).json({ message: err.message || "Failed to search events" });
  }
});

// ── Events: edit (whitelisted fields only) ───────────────────────────────────
// PATCH /api/webapp/admin/events/:id
const ADMIN_EVENT_FIELDS = [
  "name", "description", "startDate", "startTime", "startAnytime", "end_at",
  "location_text", "location_lat", "location_lng", "location_instructions",
  "category", "require_approval", "visibility", "capacity",
];
router.patch("/admin/events/:id", requireAdmin, async (req: any, res) => {
  try {
    const body = req.body ?? {};
    const patch: Record<string, any> = {};
    for (const k of ADMIN_EVENT_FIELDS) if (body[k] !== undefined) patch[k] = body[k];

    if (patch.name !== undefined) {
      patch.name = String(patch.name).trim().slice(0, 120);
      if (patch.name.length < 3) return res.status(400).json({ message: "Name must be 3+ characters." });
    }
    if (patch.description !== undefined && patch.description !== null) {
      patch.description = String(patch.description).slice(0, 2000);
    }
    if (patch.location_text !== undefined && patch.location_text !== null) {
      patch.location_text = String(patch.location_text).slice(0, 300);
    }
    if (patch.location_lat !== undefined && patch.location_lat !== null) patch.location_lat = Number(patch.location_lat);
    if (patch.location_lng !== undefined && patch.location_lng !== null) patch.location_lng = Number(patch.location_lng);
    if (patch.visibility !== undefined) patch.visibility = patch.visibility === "private" ? "private" : "public";
    if (patch.require_approval !== undefined) patch.require_approval = !!patch.require_approval;
    if (Object.keys(patch).length === 0) return res.status(400).json({ message: "No fields to update." });

    const { data, error } = await supabase.from("events").update(patch).eq("id", req.params.id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Event not found" });
    const [enriched] = await attachGoingCounts(await enrichEvents([data]));
    res.json(enriched ?? data);
  } catch (err: any) {
    console.error("[admin] update event error:", err);
    res.status(500).json({ message: err.message || "Failed to update event" });
  }
});

// ── Events: delete (remove the pin + related rows) ───────────────────────────
// DELETE /api/webapp/admin/events/:id
router.delete("/admin/events/:id", requireAdmin, async (req: any, res) => {
  try {
    const id = req.params.id;
    // Webapp tables aren't ON DELETE CASCADE — clear related rows first.
    await supabase.from("webapp_event_members").delete().eq("event_id", id);
    await supabase.from("channels").delete().eq("event_id", id);
    await supabase.from("user_events").delete().eq("event_id", id);
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[admin] delete event error:", err);
    res.status(500).json({ message: err.message || "Failed to delete event" });
  }
});

// ── Events: roster (webapp + native, any non-kicked status) ──────────────────
// GET /api/webapp/admin/events/:id/members
router.get("/admin/events/:id/members", requireAdmin, async (req: any, res) => {
  try {
    const id = req.params.id;
    const members: any[] = [];

    const { data: memRows } = await supabase
      .from("webapp_event_members")
      .select("webapp_user_id, status, joined_at")
      .eq("event_id", id)
      .neq("status", "kicked");
    const wIds = (memRows || []).map((m: any) => m.webapp_user_id);
    const wMap: Record<string, any> = {};
    if (wIds.length) {
      const { data: wu } = await supabase
        .from("webapp_users")
        .select("id, instagram, avatar_url")
        .in("id", wIds);
      for (const u of wu || []) wMap[u.id] = u;
    }
    for (const m of memRows || []) {
      members.push({
        id: m.webapp_user_id,
        source: "webapp",
        status: m.status,
        instagram: wMap[m.webapp_user_id]?.instagram ?? null,
        avatar_url: normalizeStoredAvatar(wMap[m.webapp_user_id]?.avatar_url ?? null),
      });
    }

    const { data: ueRows } = await supabase.from("user_events").select("user_id").eq("event_id", id);
    const aIds = (ueRows || []).map((r: any) => r.user_id);
    if (aIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, instagram_handle, avatar_url")
        .in("id", aIds);
      for (const p of profs || []) {
        members.push({
          id: p.id,
          source: "app",
          status: "approved",
          instagram: p.instagram_handle ?? p.username ?? null,
          avatar_url: normalizeStoredAvatar(p.avatar_url ?? null),
        });
      }
    }
    res.json(members);
  } catch (err: any) {
    console.error("[admin] event members error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch members" });
  }
});

// ── Events: remove a member ──────────────────────────────────────────────────
// POST /api/webapp/admin/events/:id/remove-member { user_id, source }
router.post("/admin/events/:id/remove-member", requireAdmin, async (req: any, res) => {
  try {
    const event_id = req.params.id;
    const { user_id, source } = req.body ?? {};
    if (!user_id) return res.status(400).json({ message: "user_id is required" });
    if (source === "app") {
      const { error } = await supabase
        .from("user_events")
        .delete()
        .eq("event_id", event_id)
        .eq("user_id", user_id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("webapp_event_members")
        .update({ status: "kicked" })
        .eq("event_id", event_id)
        .eq("webapp_user_id", user_id);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[admin] remove member error:", err);
    res.status(500).json({ message: err.message || "Failed to remove member" });
  }
});

// ── Reports: review the moderation queue ─────────────────────────────────────
// GET /api/webapp/admin/reports
router.get("/admin/reports", requireAdmin, async (req: any, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("reports")
      .select("id, event_id, reporter_id, reportee_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const userIds = [
      ...new Set((rows || []).flatMap((r: any) => [r.reporter_id, r.reportee_id]).filter(Boolean)),
    ] as string[];
    const eventIds = [...new Set((rows || []).map((r: any) => r.event_id).filter(Boolean))] as string[];

    const handleMap: Record<string, string | null> = {};
    if (userIds.length) {
      const [{ data: wu }, { data: profs }] = await Promise.all([
        supabase.from("webapp_users").select("id, instagram").in("id", userIds),
        supabase.from("profiles").select("id, username, instagram_handle").in("id", userIds),
      ]);
      for (const p of profs || []) handleMap[p.id] = p.instagram_handle ?? p.username ?? null;
      // Webapp identities win for shared ids.
      for (const w of wu || []) handleMap[w.id] = w.instagram ?? handleMap[w.id] ?? null;
    }
    const eventMap: Record<string, string | null> = {};
    if (eventIds.length) {
      const { data: evs } = await supabase.from("events").select("id, name").in("id", eventIds);
      for (const e of evs || []) eventMap[e.id] = e.name ?? null;
    }

    res.json(
      (rows || []).map((r: any) => ({
        ...r,
        reporter_instagram: handleMap[r.reporter_id] ?? null,
        reportee_instagram: handleMap[r.reportee_id] ?? null,
        event_name: r.event_id ? eventMap[r.event_id] ?? null : null,
      })),
    );
  } catch (err: any) {
    console.error("[admin] reports error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch reports" });
  }
});

// ── Broadcast email to the launch waitlist (SMTP2GO) ─────────────────────────
// Sends one email per recipient (so addresses are never leaked to each other).
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const API_KEY = process.env.SMTP_API_KEY;
  if (!API_KEY) throw new Error("SMTP_API_KEY is not configured.");
  const resp = await fetch("https://api.smtp2go.com/v3/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      api_key: API_KEY,
      to: [to],
      sender: "bryan@soonest.app",
      subject,
      html_body: html,
    }),
  });
  const data: any = await resp.json().catch(() => ({}));
  if (!resp.ok || data?.data?.error) {
    throw new Error(`SMTP2GO: ${data?.data?.error || resp.statusText}`);
  }
}

const BROADCAST_DEFAULT_SUBJECT = "You're off the waitlist! 🚀 Soonest is live";
// Launch email — mirrors webapp/emails/launch.html. Keep the two in sync if you
// edit the design (this is the version that actually gets sent).
const BROADCAST_DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>You're off the waitlist</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* Client resets */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a { text-decoration: none; }

    /* Mobile */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .h1 { font-size: 30px !important; line-height: 36px !important; }
      .stack { display: block !important; width: 100% !important; }
      .stack-pad { padding: 0 0 14px 0 !important; }
      .footer-text { text-align: left !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1eafc;">
  <!-- Preheader (hidden) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1eafc;">
    <tr>
      <td align="center" style="padding-top: 32px;
padding-right: 48px;
padding-left: 48px;">

        <!-- ───────── Header banner ───────── -->
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" style="">
          <tr>
            <td align="center">
              <img src="https://supabase.hangoutstudios.com/storage/v1/object/public/soonest/avatars/soonestheader.png" width="600" alt="Soonest" style="display:block; width:100%; max-width:400px; height:auto; border-radius:20px;">
            </td>
          </tr>
        </table>

        <!-- ───────── Hero card ───────── -->
          <!-- Body copy -->
          <tr>
            <td class="px" align="left" style="padding:40px 48px 8px 48px; font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 18px 0; font-size:17px; line-height:27px; color:#332F3A; font-weight:700;">
                hey there 👋
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; line-height:27px; color:#635F69;">
                first of all, thank youuu so much for joining the waitlist so early, it really means a ton to me. Soonest is finally live on the web!
                <br /><br />
                i built this because i wanted a place where anyone can easily create or find activities with others anytime anywhere. if you are a social butterfly, or want to expand your social circle, this is for you.
              </p>
            </td>
          </tr>

          <!-- CTA button (bulletproof) -->
          <tr>
            <td class="px" align="center" style="padding: 4px 48px 36px 48px;">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://soonest.app" style="height:54px;v-text-anchor:middle;width:300px;" arcsize="50%" fillcolor="#7C3AED" stroke="f">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">get out there! →</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="https://soonest.app" target="_blank" style="display:inline-block; background-color:#7C3AED; background-image:linear-gradient(135deg,#A78BFA 0%,#7C3AED 100%); color:#ffffff; font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; font-weight:800; letter-spacing:0.2px; padding:16px 34px; border-radius:999px; box-shadow:0 12px 24px -10px rgba(124,58,237,0.6);">
                get out there!&nbsp;&nbsp;→
              </a>
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td class="px" style="padding:30px 48px 44px 48px; font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 4px 0; font-size:16px; line-height:25px; color:#635F69;">see you on the map,</p>
              <p style="margin:0; font-size:16px; line-height:25px; color:#332F3A; font-weight:800;">bryan &amp; the Soonest team</p>
            </td>
          </tr>


        <!-- ───────── Footer ───────── -->
        <table role="presentation" class="container" align="center" width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="px footer-text" align="center" style="padding:28px 48px 8px 48px; font-family:'Nunito',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; text-align:center;">
              <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#9B96A3;">
                you're getting this because you joined the Soonest waitlist.
              </p>
              <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#9B96A3;">
                Soonest app coming soon to stores near you.
              </p>
              <p style="margin:0 0 8px 0; font-size:13px; line-height:20px; color:#9B96A3;">
                <a href="https://soonest.app" target="_blank" style="color:#7C3AED;">soonest.app</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;

// POST /api/webapp/admin/broadcast { subject?, html? }
// While TEST_MODE is true, every broadcast goes ONLY to the admin's own inbox —
// it still reports how many waitlist emails it WOULD reach. Flip TEST_MODE to
// false to email the whole soonest_waitlist for real.
router.post("/admin/broadcast", requireAdmin, async (req: any, res) => {
  try {
    if (!process.env.SMTP_API_KEY) {
      return res.status(500).json({ message: "SMTP_API_KEY isn't configured on the server." });
    }
    const subject = String(req.body?.subject ?? "").trim() || BROADCAST_DEFAULT_SUBJECT;
    const html = String(req.body?.html ?? "").trim() || BROADCAST_DEFAULT_HTML;

    const { data, error } = await supabase.from("soonest_waitlist").select("email");
    if (error) throw error;
    const allEmails = [
      ...new Set((data || []).map((r: any) => String(r.email ?? "").trim().toLowerCase()).filter(Boolean)),
    ] as string[];

    const TEST_MODE = false; // ← set to false to send to the real waitlist
    const recipients = TEST_MODE ? ["bryanchewzy24@gmail.com"] : allEmails;
    if (recipients.length === 0) return res.status(400).json({ message: "No recipients to email." });

    let sent = 0;
    const failures: string[] = [];
    for (const to of recipients) {
      try {
        await sendEmail(to, subject, html);
        sent++;
      } catch (e: any) {
        failures.push(to);
        console.error("[admin] broadcast send failed:", to, e?.message);
      }
    }
    res.json({ success: true, test_mode: TEST_MODE, waitlist_count: allEmails.length, sent, failed: failures.length });
  } catch (err: any) {
    console.error("[admin] broadcast error:", err);
    res.status(500).json({ message: err.message || "Failed to send broadcast" });
  }
});

export default router;
