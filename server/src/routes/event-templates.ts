import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// GET templates (optionally filter by community_id)
router.get("/", async (req, res) => {
  try {
    const { community_id } = req.query as { community_id?: string };

    let query = supabase.from("event_templates").select("*");

    if (community_id) {
      query = query.eq("community_id", community_id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch templates" });
  }
});

// CREATE event template
router.post("/", async (req, res) => {
  try {
    const { community_id, name, description, duration_minutes, default_capacity, color, icon } = req.body;

    if (!community_id || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("event_templates")
      .insert({
        community_id,
        name,
        description: description || "",
        duration_minutes: duration_minutes || 120,
        default_capacity: default_capacity || 50,
        color: color || "#FF8FA3",
        icon: icon || "calendar",
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create template" });
  }
});

// GET templates for community
router.get("/community/:community_id", async (req, res) => {
  try {
    const { community_id } = req.params;

    const { data, error } = await supabase
      .from("event_templates")
      .select("*")
      .eq("community_id", community_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch templates" });
  }
});

// UPDATE template
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration_minutes, default_capacity, color, icon } = req.body;

    const { data, error } = await supabase
      .from("event_templates")
      .update({
        name,
        description,
        duration_minutes,
        default_capacity,
        color,
        icon,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to update template" });
  }
});

// DELETE template
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("event_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to delete template" });
  }
});

export default router;
