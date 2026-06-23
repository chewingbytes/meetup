//@ts-nocheck
import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// CREATE testimonial
router.post("/", async (req, res) => {
  try {
    const { user_id, event_id, community_id, rating, text } = req.body;

    if (!user_id || !rating || !text) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!event_id && !community_id) {
      return res
        .status(400)
        .json({ message: "Either event_id or community_id is required" });
    }

    // If event_id, verify event has passed
    if (event_id) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("end_at")
        .eq("id", event_id)
        .single();

      if (eventError || !event) {
        return res.status(400).json({ message: "Event not found" });
      }

      if (new Date(event.end_at) > new Date()) {
        return res.status(400).json({ message: "Event has not ended yet" });
      }
    }

    console.log("Inserting testimonial:", { user_id, event_id, community_id, rating, text });

    const { data, error } = await supabase
      .from("event_testimonials")
      .insert({
        user_id,
        event_id: event_id || null,
        community_id: community_id || null,
        rating,
        text,
      })
      .select()
      .single();

    if (error) {
      console.log("Error creating testimonial:", error);
      throw error;
    }
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to create testimonial" });
  }
});

// GET testimonials for event or community
router.get("/", async (req, res) => {
  try {
    const { event_id, community_id } = req.query;

    let query = supabase.from("testimonials").select("*");

    if (event_id) {
      query = query.eq("event_id", event_id);
    } else if (community_id) {
      query = query.eq("community_id", community_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch testimonials" });
  }
});

// GET user's testimonials
router.get("/user/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch user testimonials" });
  }
});

// UPDATE testimonial
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;

    const { data, error } = await supabase
      .from("testimonials")
      .update({ rating, text, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to update testimonial" });
  }
});

// DELETE testimonial
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to delete testimonial" });
  }
});

export default router;
