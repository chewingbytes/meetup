import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// Get all testimonials for a specific event
router.get("/event/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from("event_testimonials")
      .select(
        `
        *,
        profiles:user_id (
          id,
          full_name,
          username,
          avatar_url
        )
      `
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching event testimonials:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all testimonials by a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("event_testimonials")
      .select(
        `
        *,
        events:event_id (
          id,
          name,
          cover_image,
          start_at,
          end_at
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching user testimonials:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new event testimonial
router.post("/", async (req, res) => {
  try {
    const { user_id, event_id, rating, text } = req.body;

    console.log("Creating testimonial:", { user_id, event_id, rating, text });

    // Validate required fields
    if (!user_id || !event_id || !rating || !text) {
      console.log("Missing fields validation failed");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      console.log("Rating validation failed");
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, end_at")
      .eq("id", event_id)
      .single();

    if (eventError) {
      console.log("Event fetch error:", eventError);
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event) {
      console.log("Event not found");
      return res.status(404).json({ error: "Event not found" });
    }

    console.log("Event found:", event);

    const { data: attendance, error: attendanceError } = await supabase
      .from("user_events")
      .select("user_id")
      .eq("event_id", event_id)
      .eq("user_id", user_id)
      .single();

    if (attendanceError) {
      console.log("Attendance check error:", attendanceError);
      return res.status(403).json({
        error: "You must have attended this event to leave a testimonial",
      });
    }

    if (!attendance) {
      console.log("User not found in user_events");
      return res.status(403).json({
        error: "You must have attended this event to leave a testimonial",
      });
    }

    console.log("Attendance verified:", attendance);

    // Create testimonial
    const { data, error } = await supabase
      .from("event_testimonials")
      .insert({
        user_id,
        event_id,
        rating,
        text,
      })
      .select()
      .single();

    if (error) {
      console.log("Insert error:", error);
      if (error.code === "23505") {
        return res.status(409).json({
          error: "You have already submitted a testimonial for this event",
        });
      }
      throw error;
    }

    console.log("Testimonial created:", data);
    res.status(201).json(data);
  } catch (error) {
    console.error("Error creating event testimonial:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update an event testimonial
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, text } = req.body;

    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }
      updateData.rating = rating;
    }
    if (text !== undefined) updateData.text = text;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("event_testimonials")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error updating event testimonial:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an event testimonial
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("event_testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ message: "Testimonial deleted successfully" });
  } catch (error) {
    console.error("Error deleting event testimonial:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get testimonial statistics for an event
router.get("/event/:eventId/stats", async (req, res) => {
  try {
    const { eventId } = req.params;

    const { data, error } = await supabase
      .from("event_testimonials")
      .select("rating")
      .eq("event_id", eventId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        total: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }

    const total = data.length;
    const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
    const average = sum / total;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((t) => {
      distribution[t.rating] = (distribution[t.rating] || 0) + 1;
    });

    res.json({ total, average: parseFloat(average.toFixed(1)), distribution });
  } catch (error) {
    console.error("Error fetching testimonial stats:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
