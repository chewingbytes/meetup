import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const recipient_id = req.query.userId as string | undefined;
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (recipient_id) query = query.eq("recipient_id", recipient_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch notifications" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).select().single();
    if (error) throw error;
    res.json({ success: true, notification: data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to mark notification read" });
  }
});

export default router;