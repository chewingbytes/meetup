import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { user_id, token, platform } = req.body || {};

    if (!user_id || !token) {
      return res.status(400).json({ message: "user_id and token are required" });
    }

    const { data, error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id,
          token,
          platform: platform || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,token" }
      )
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to save push token" });
  }
});

export default router;
