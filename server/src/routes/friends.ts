import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// GET /api/friends/requests?userId=<id>
router.get("/requests", async (req, res) => {
  try {
    const userId = String(req.query.userId || req.header("x-user-id") || "");
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const { data, error } = await supabase.from("friendships").select("*").eq("addressee_id", userId).eq("status", "pending");
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch friend requests" });
  }
});

// POST /api/friends/:id/respond { action: "accept" | "decline" }
router.post("/:id/respond", async (req, res) => {
  try {
    const id = req.params.id;
    const action = req.body.action;
    if (!["accept", "decline"].includes(action)) return res.status(400).json({ message: "Invalid action" });

    const status = action === "accept" ? "accepted" : "rejected";
    const { data, error } = await supabase.from("friendships").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, friendship: data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to respond to friend request" });
  }
});

export default router;