import express from "express";
import { supabase } from "../../db/supabaseClient.js";
import { upload } from "../../middleware/upload.ts";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("FETHCING EVENTS");
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });
    if (error) throw error;
    res.json(events);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch events" });
  }
});

// Get user's events (joined or organized)
router.get("/my-events", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    console.log("🔵 Fetching user's events:", user_id);

    // Get user_id from user_events table (events user joined)
    const { data: joinedEventIds, error: joinError } = await supabase
      .from("user_events")
      .select("event_id")
      .eq("user_id", user_id);

    if (joinError) throw joinError;

    // Get all event IDs (organized + joined)
    const eventIds = [
      ...new Set([
        ...((joinedEventIds || []).map((j: any) => j.event_id)),
      ]),
    ];

    // Fetch events (organized by user OR user joined)
    let query = supabase
      .from("events")
      .select("*")
      .order("start_at", { ascending: true });

    if (eventIds.length > 0) {
      query = query.or(`organizer_id.eq.${user_id},id.in.(${eventIds.join(",")})`);
    } else {
      query = query.eq("organizer_id", user_id);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    console.log("✅ Found", events?.length || 0, "events");
    res.json(events || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch user events" });
  }
});

// Check event membership
router.get("/check-membership", async (req, res) => {
  try {
    const { user_id, event_id } = req.query;

    if (!user_id || !event_id) {
      return res.status(400).json({ message: "user_id and event_id are required" });
    }

    console.log("🔵 Checking event membership:", { user_id, event_id });

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();

    if (eventError) throw eventError;

    // Check if user is organizer
    if (event?.organizer_id === user_id) {
      return res.json({ isMember: true, isOrganizer: true });
    }

    // Check if user joined
    const { data: joined, error: joinError } = await supabase
      .from("user_events")
      .select("*")
      .eq("user_id", user_id)
      .eq("event_id", event_id)
      .single();

    if (joinError && (joinError as any).code !== "PGRST116") throw joinError;

    res.json({ isMember: !!joined, isOrganizer: false });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to check membership" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { data: ev, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    if (error && (error as any).code !== "PGRST116") throw error;
    if (!ev) return res.status(404).json({ message: "Not found" });
    res.json(ev);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch event" });
  }
});

// Create event - supports multipart/form-data (payload + cover)
router.post("/", upload.single("cover"), async (req, res) => {
  try {
    const isForm = !!req.file || !!req.body.payload;
    let payload: any;
    if (isForm && req.body.payload) payload = JSON.parse(req.body.payload);
    else payload = req.body;

    const {
      name,
      start_at,
      end_at,
      location_text,
      location_instructions,
      description,
      description_md,
      require_approval = false,
      is_paid = false,
      price = 0,
      visibility = "public",
      capacity = null,
      organizerId,
      communityId,
    } = payload;

    let cover_image_url: string | null = null;
    if (req.file) {
      const bucket = "event-covers";
      const filename = `event_${Date.now()}_${req.file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (!uploadError) {
        const { publicURL } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);
        cover_image_url = publicURL;
      } else {
        console.warn("cover upload failed", uploadError);
      }
    }

    const { data: created, error } = await supabase
      .from("events")
      .insert({
        community_id: communityId || null,
        organizer_id: organizerId || null,
        cover_image: cover_image_url,
        name,
        description: description || description_md || null,
        start_at,
        end_at,
        location_text,
        location_instructions,
        require_approval,
        is_paid,
        price: is_paid ? price : 0,
        visibility,
        capacity: capacity === null ? null : capacity,
      })
      .select()
      .single();

    if (error) throw error;

    // Add organizer to user_events table
    const effectiveOrganizerId = organizerId || created?.organizer_id;
    if (effectiveOrganizerId && created?.id) {
      const { error: userEventError } = await supabase
        .from("user_events")
        .upsert(
          {
            user_id: effectiveOrganizerId,
            event_id: created.id,
            joined_at: new Date().toISOString(),
          },
          { onConflict: "user_id,event_id" }
        );

      if (userEventError) {
        console.warn("⚠️ Failed to add organizer to user_events:", userEventError);
        // Don't throw - event was created successfully, just warn about the user_events entry
      } else {
        console.log("✅ Organizer added to user_events for event:", created.id);
      }
    } else {
      console.warn("⚠️ Missing organizerId; skipping user_events insert", {
        organizerId,
        createdId: created?.id,
      });
    }

    res.status(201).json(created);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to create event" });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
      return res
        .status(400)
        .json({ message: "user_id and event_id are required" });
    }

    console.log("🔵 User joining event:", { user_id, event_id });

    // Check if user already joined
    const { data: existing, error: checkError } = await supabase
      .from("user_events")
      .select("*")
      .eq("user_id", user_id)
      .eq("event_id", event_id)
      .single();

    if (existing) {
      return res.status(409).json({ message: "Already joined this event" });
    }

    // Insert join record
    const { data, error: joinError } = await supabase
      .from("user_events")
      .insert({
        user_id,
        event_id,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (joinError) {
      console.error("❌ Join error:", joinError);
      throw joinError;
    }

    console.log("✅ User successfully joined event");
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error("❌ Error joining event:", err);
    res.status(500).json({ message: err.message || "Failed to join event" });
  }
});

// Leave event
router.post("/leave", async (req, res) => {
  try {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
      return res
        .status(400)
        .json({ message: "user_id and event_id are required" });
    }

    console.log("🔵 User leaving event:", { user_id, event_id });

    const { error: leaveError } = await supabase
      .from("user_events")
      .delete()
      .eq("user_id", user_id)
      .eq("event_id", event_id);

    if (leaveError) {
      console.error("❌ Leave error:", leaveError);
      throw leaveError;
    }

    console.log("✅ User successfully left event");
    res.json({ success: true, message: "Successfully left event" });
  } catch (err: any) {
    console.error("❌ Error leaving event:", err);
    res.status(500).json({ message: err.message || "Failed to leave event" });
  }
});

export default router;
