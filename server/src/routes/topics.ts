import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// Get all topics
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("topics")
      .select("*")
      .order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch topics" });
  }
});

// Get communities by topic
router.get("/:topicId/communities", async (req, res) => {
  try {
    const topicId = req.params.topicId;

    // First, find all community_ids associated with this topic
    const { data: communityTopics, error: ctError } = await supabase
      .from("community_topics")
      .select("community_id")
      .eq("topic_id", topicId);

    if (ctError) throw ctError;

    if (!communityTopics || communityTopics.length === 0) {
      return res.json([]);
    }

    const communityIds = communityTopics.map((ct: any) => ct.community_id);

    // Fetch all communities with those ids
    const { data: communities, error: cError } = await supabase
      .from("communities")
      .select("*")
      .in("id", communityIds)
      .order("created_at", { ascending: false });

    if (cError) throw cError;

    res.json(communities || []);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch communities by topic" });
  }
});

export default router;