import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// SAVE user interests with ranking
router.post("/", async (req, res) => {
  try {
    const { user_id, interests } = req.body;

    if (!user_id || !Array.isArray(interests)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete existing interests
    await supabase.from("user_interests").delete().eq("user_id", user_id);

    // Insert new interests with ranking
    const interestData = interests.map((interest: string, index: number) => ({
      user_id,
      interest_name: interest,
      ranking: index + 1,
    }));

    const { data, error } = await supabase
      .from("user_interests")
      .insert(interestData)
      .select();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to save interests" });
  }
});

// GET user interests
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user_id)
      .order("ranking", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch interests" });
  }
});

// CALCULATE interest match score for event
router.post("/match-score", async (req, res) => {
  try {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user interests
    const { data: userInterests } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user_id)
      .order("ranking", { ascending: true });

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("name, description, community_id")
      .eq("id", event_id)
      .single();

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventText = `${event.name} ${event.description || ""}`.toLowerCase();

    // Calculate score based on interest matches
    let score = 0;
    if (userInterests) {
      userInterests.forEach((interest, index) => {
        if (eventText.includes(interest.interest_name.toLowerCase())) {
          // Weight by ranking (top interest gets more points)
          score += 100 / (index + 1);
        }
      });
    }

    res.json({ score, matchedInterests: userInterests });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to calculate match" });
  }
});

export default router;
