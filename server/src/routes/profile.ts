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

    if (payload.personality_type) updatePayload.personality_type = payload.personality_type;
    if (payload.social_preference) updatePayload.social_preference = payload.social_preference;
    if (payload.interests !== undefined) updatePayload.interests = payload.interests;
    if (payload.main_interest !== undefined) updatePayload.main_interest = payload.main_interest || null;
    if (payload.school) updatePayload.school = payload.school;
    if (payload.year_of_study) updatePayload.year_of_study = payload.year_of_study;
    if (payload.instagram_handle !== undefined) updatePayload.instagram_handle = payload.instagram_handle || null;
    if (payload.tiktok_handle !== undefined) updatePayload.tiktok_handle = payload.tiktok_handle || null;
    if (payload.photo_urls !== undefined) updatePayload.photo_urls = payload.photo_urls;
    if (payload.occupation !== undefined) updatePayload.occupation = payload.occupation || null;
    if (payload.location !== undefined) updatePayload.location = payload.location || null;
    if (payload.date_of_birth !== undefined) updatePayload.date_of_birth = payload.date_of_birth || null;
    if (payload.prompt_key !== undefined) updatePayload.prompt_key = payload.prompt_key || null;
    if (payload.prompt_answer !== undefined) updatePayload.prompt_answer = payload.prompt_answer || null;

    const { data: updated, error } = await supabase.from("profiles").update(updatePayload).eq("id", userId).select().single();
    if (error) throw error;

    res.json(updated);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to update profile" });
  }
});

// PATCH /api/profile/:id/verify — set verified to 'pending'
router.patch("/:id/verify", async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing user id" });

    const { data, error } = await supabase
      .from("profiles")
      .update({ verified: "pending" })
      .eq("id", id)
      .select("id, verified")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to submit verification" });
  }
});

// DELETE /api/profile/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const requestingUserId = req.header("x-user-id");
    if (!requestingUserId || requestingUserId !== id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Delete profile row first
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileError) throw profileError;

    // Delete from Supabase auth (requires service role key)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    res.status(204).send();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to delete account" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("RECEVIEDED ID:", id)
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