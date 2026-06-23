import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// GET /api/friends/search?q=&userId=
router.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const userId = String(req.query.userId || req.header("x-user-id") || "");
  if (q.length < 2) return res.json([]);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .ilike("username", `%${q}%`)
      .neq("id", userId)
      .limit(20);
    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/friends/requests?userId=  — incoming pending requests with requester profiles
router.get("/requests", async (req, res) => {
  const userId = String(req.query.userId || req.header("x-user-id") || "");
  if (!userId) return res.status(400).json({ message: "Missing userId" });
  try {
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, created_at")
      .eq("addressee_id", userId)
      .eq("status", "pending");
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) return res.json([]);
    const ids = rows.map((r: any) => r.requester_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", ids);
    res.json(
      rows.map((r: any) => ({
        request_id: r.id,
        created_at: r.created_at,
        requester: (profiles || []).find((p: any) => p.id === r.requester_id),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/friends/dms?userId=  — all DM conversations with last message
router.get("/dms", async (req, res) => {
  const userId = String(req.query.userId || req.header("x-user-id") || "");
  if (!userId) return res.status(400).json({ message: "Missing userId" });
  try {
    const { data: dms, error } = await supabase
      .from("dm_channels")
      .select("channel_id, user1_id, user2_id")
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    if (error) throw error;
    if (!dms || !dms.length) return res.json([]);
    const friendIds = dms.map((d: any) =>
      d.user1_id === userId ? d.user2_id : d.user1_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", friendIds);
    const result = await Promise.all(
      dms.map(async (dm: any) => {
        const friendId = dm.user1_id === userId ? dm.user2_id : dm.user1_id;
        const { data: msgs } = await supabase
          .from("messages")
          .select("text, username, created_at")
          .eq("channel_id", dm.channel_id)
          .order("created_at", { ascending: false })
          .limit(1);
        return {
          channel_id: dm.channel_id,
          friend: (profiles || []).find((p: any) => p.id === friendId),
          lastMessage: msgs?.[0]?.text,
          lastAuthor: msgs?.[0]?.username,
          lastAt: msgs?.[0]?.created_at,
        };
      })
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/friends?userId=  — accepted friends with profiles
router.get("/", async (req, res) => {
  const userId = String(req.query.userId || req.header("x-user-id") || "");
  if (!userId) return res.status(400).json({ message: "Missing userId" });
  try {
    const { data: friendships, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");
    if (error) throw error;
    const rows = friendships || [];
    if (!rows.length) return res.json([]);
    const friendIds = rows.map((f: any) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .in("id", friendIds);
    if (pErr) throw pErr;
    res.json(
      rows.map((f: any) => ({
        friendship_id: f.id,
        friend: (profiles || []).find((p: any) =>
          p.id === (f.requester_id === userId ? f.addressee_id : f.requester_id)
        ),
      }))
    );
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/friends/send  { requester_id, addressee_id }
router.post("/send", async (req, res) => {
  const { requester_id, addressee_id } = req.body;
  if (!requester_id || !addressee_id)
    return res.status(400).json({ message: "Missing fields" });
  if (requester_id === addressee_id)
    return res.status(400).json({ message: "Cannot add yourself" });
  try {
    const { data: existing } = await supabase
      .from("friendships")
      .select("id, status")
      .or(
        `and(requester_id.eq.${requester_id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${requester_id})`
      )
      .maybeSingle();
    if (existing)
      return res.status(409).json({ message: "Already exists", status: existing.status });
    const { data, error } = await supabase
      .from("friendships")
      .insert({ requester_id, addressee_id, status: "pending" })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, friendship: data });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/friends/dm  { user1_id, user2_id }  — get or create DM channel
router.post("/dm", async (req, res) => {
  const { user1_id, user2_id } = req.body;
  if (!user1_id || !user2_id)
    return res.status(400).json({ message: "Missing user IDs" });
  // canonical order so (A,B) === (B,A)
  const [a, b] = [user1_id, user2_id].sort();
  try {
    const { data: existing } = await supabase
      .from("dm_channels")
      .select("channel_id")
      .eq("user1_id", a)
      .eq("user2_id", b)
      .maybeSingle();
    if (existing) return res.json({ channel_id: existing.channel_id });
    const { data: channel, error: chanErr } = await supabase
      .from("channels")
      .insert({ name: `dm:${a}:${b}`, type: "dm" })
      .select("id")
      .single();
    if (chanErr) throw chanErr;
    const { error: dmErr } = await supabase
      .from("dm_channels")
      .insert({ channel_id: channel.id, user1_id: a, user2_id: b });
    if (dmErr) throw dmErr;
    res.json({ channel_id: channel.id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/friends/:id/respond  { action: "accept" | "decline" }
router.post("/:id/respond", async (req, res) => {
  const id = req.params.id;
  const action = req.body.action;
  if (!["accept", "decline"].includes(action))
    return res.status(400).json({ message: "Invalid action" });
  try {
    const status = action === "accept" ? "accepted" : "rejected";
    const { data, error } = await supabase
      .from("friendships")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, friendship: data });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
