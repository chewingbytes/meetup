import express from "express";
import { supabase } from "../../db/supabaseClient.js";
import { upload } from "../../middleware/upload.ts";

const router = express.Router();

// GET /api/profile or /api/users/:id handled in users route below
router.get("/", async (req, res) => {
  try {
    const userId = String(req.query.userId || req.header("x-user-id") || "");
    if (userId) {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error && (error as any).code !== "PGRST116") throw error;
      if (!data) return res.status(404).json({ message: "Profile not found" });
      return res.json(data);
    }

    // fallback: return first profile joined with auth.users email
    const { data } = await supabase.from("profiles").select("*").limit(1).single();
    if (data) return res.json(data);
    res.json({ username: "anon", full_name: "Anonymous", avatar_url: null });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch profile" });
  }
});

// Update profile (supports multipart with image or json)
router.patch("/", upload.single("avatar"), async (req, res) => {
  try {
    let payload: any = req.body;
    if (req.body.payload) payload = JSON.parse(req.body.payload);

    const userId = payload.id || req.header("x-user-id");
    if (!userId) return res.status(400).json({ message: "Missing user id" });

    let avatar_url = payload.avatar_url || null;
    if (req.file) {
      const bucket = "avatars";
      const filename = `user_${userId}_${Date.now()}_${req.file.originalname}`;
      const { data: up, error: upErr } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
      if (!upErr) {
        avatar_url = supabase.storage.from(bucket).getPublicUrl(up.path).publicURL;
      } else {
        console.warn("avatar upload failed", upErr);
      }
    }

    const updatePayload: any = {
      full_name: payload.full_name,
      username: payload.username,
      bio: payload.bio,
      avatar_url,
    };

    const { data: updated, error } = await supabase.from("profiles").update(updatePayload).eq("id", userId).select().single();
    if (error) throw error;

    res.json(updated);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to update profile" });
  }
});

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (!data) return res.status(404).json({ message: "Profile not found" });
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch user profile" });
  }
});

export default router;