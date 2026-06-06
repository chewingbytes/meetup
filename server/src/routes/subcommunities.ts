import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// CREATE subcommunity
router.post("/", async (req, res) => {
  try {
    const { community_id, creator_id, name, description } = req.body;

    if (!community_id || !creator_id || !name) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("subcommunities")
      .insert({
        community_id,
        creator_id,
        name,
        description: description || "",
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create subcommunity" });
  }
});

// GET subcommunities for community
router.get("/community/:community_id", async (req, res) => {
  try {
    const { community_id } = req.params;

    const { data, error } = await supabase
      .from("subcommunities")
      .select("*")
      .eq("community_id", community_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch subcommunities" });
  }
});

// UPDATE subcommunity
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from("subcommunities")
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to update subcommunity" });
  }
});

// DELETE subcommunity
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("subcommunities")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to delete subcommunity" });
  }
});

export default router;
