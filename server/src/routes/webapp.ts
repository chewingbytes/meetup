import express from "express";
import { supabase } from "../../db/supabaseClient.js";

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
// own Supabase Storage bucket, then serve that stable public URL everywhere.
const AVATAR_BUCKET = "webapp-avatars";
let bucketReady = false;

async function ensureAvatarBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    await supabase.storage.createBucket(AVATAR_BUCKET, { public: true });
  } catch {
    /* already exists — ignore */
  }
  bucketReady = true;
}

function isGoogleAvatar(url: unknown): url is string {
  return typeof url === "string" && /googleusercontent\.com/.test(url);
}

/** Download a remote avatar and re-host it in our public bucket. Returns the
 *  hosted public URL, or null on failure (caller falls back to the source). */
async function cacheAvatar(uid: string, sourceUrl: string): Promise<string | null> {
  try {
    await ensureAvatarBucket();
    const resp = await fetch(sourceUrl);
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const path = `${uid}.${ext}`;
    const { error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, buf, { contentType, upsert: true });
    if (error) {
      console.warn("[webapp] avatar upload failed:", error.message);
      return null;
    }
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    // Cache-bust so a re-uploaded avatar isn't served stale from the CDN.
    return data?.publicUrl ? `${data.publicUrl}?v=${Date.now()}` : null;
  } catch (e: any) {
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
  for (const w of webUsers || [])
    if (!map[w.id])
      map[w.id] = { username: w.instagram ?? null, avatar_url: w.avatar_url ?? null, photo_url: w.avatar_url ?? null };
  return events.map((e) => {
    const o = map[e.organizer_id];
    return {
      ...e,
      organizer_username: o?.username ?? null,
      organizer_avatar_url: o?.avatar_url ?? null,
      organizer_photo_url: o?.photo_url ?? null,
    };
  });
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
    res.json(await enrichEvents(events || []));
  } catch (err: any) {
    console.error("[webapp] map events error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch events" });
  }
});

// ── My activities: organized + approved-joined (any date — powers the rail) ───
// GET /api/webapp/my-activities?webapp_user_id=...
router.get("/my-activities", async (req, res) => {
  try {
    const uid = req.query.webapp_user_id as string | undefined;
    if (!uid) return res.status(400).json({ message: "webapp_user_id is required" });

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
router.post("/rail-unread", async (req, res) => {
  try {
    const { webapp_user_id, reads } = req.body ?? {};
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
router.post("/users", async (req, res) => {
  try {
    const { id, instagram, avatar_url } = req.body ?? {};
    if (!id || !instagram?.trim()) {
      return res.status(400).json({ message: "id and instagram are required" });
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
    res.status(200).json(data);
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
    res.json(data);
  } catch (err: any) {
    console.error("[webapp] get user error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch user" });
  }
});

// ── Chat: list / send (service-role; messages RLS blocks the anon role) ───────
router.get("/messages", async (req, res) => {
  try {
    const channel_id = req.query.channel_id as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    if (!channel_id) return res.status(400).json({ message: "channel_id is required" });
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

router.post("/messages", async (req, res) => {
  try {
    const { channel_id, user_id, username, text } = req.body ?? {};
    if (!channel_id || !user_id || !text?.trim()) {
      return res.status(400).json({ message: "channel_id, user_id and text are required" });
    }
    const { data, error } = await supabase
      .from("messages")
      .insert({
        channel_id,
        user_id,
        username: username || "guest",
        text: text.trim(),
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
router.post("/events/join", async (req, res) => {
  try {
    const { webapp_user_id, event_id } = req.body ?? {};
    if (!webapp_user_id || !event_id) {
      return res.status(400).json({ message: "webapp_user_id and event_id are required" });
    }

    const { data: existing } = await supabase
      .from("webapp_event_members")
      .select("id, status")
      .eq("webapp_user_id", webapp_user_id)
      .eq("event_id", event_id)
      .maybeSingle();
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
router.post("/events/leave", async (req, res) => {
  try {
    const { webapp_user_id, event_id } = req.body ?? {};
    if (!webapp_user_id || !event_id) {
      return res.status(400).json({ message: "webapp_user_id and event_id are required" });
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
router.get("/events/joined", async (req, res) => {
  try {
    const webapp_user_id = req.query.webapp_user_id as string | undefined;
    if (!webapp_user_id) return res.status(400).json({ message: "webapp_user_id is required" });
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
router.get("/events/:id/requests", async (req, res) => {
  try {
    const event_id = req.params.id;
    const host_id = req.query.host_id as string | undefined;
    if (!host_id) return res.status(400).json({ message: "host_id is required" });

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
        avatar_url: userMap[r.webapp_user_id]?.avatar_url ?? null,
        joined_at: r.joined_at,
      })),
    );
  } catch (err: any) {
    console.error("[webapp] requests error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch requests" });
  }
});

// POST /api/webapp/events/:id/requests/respond { host_id, webapp_user_id, action }
router.post("/events/:id/requests/respond", async (req, res) => {
  try {
    const event_id = req.params.id;
    const { host_id, webapp_user_id, action } = req.body ?? {};
    if (!host_id || !webapp_user_id || !action) {
      return res.status(400).json({ message: "host_id, webapp_user_id and action are required" });
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
          avatar_url: p.avatar_url ?? null,
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
        for (const w of webUsers || []) {
          participants.push({
            id: w.id,
            instagram: w.instagram ?? null,
            avatar_url: w.avatar_url ?? null,
            main_interest: null,
            source: "webapp",
            status: "approved",
          });
        }
      }
    } catch (e) {
      console.warn("[webapp] webapp participants unavailable:", e);
    }

    res.json({ ...ev, participants, my_status: myStatus });
  } catch (err: any) {
    console.error("[webapp] event detail error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch event" });
  }
});

export default router;
