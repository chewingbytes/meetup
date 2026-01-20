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
        description_md,
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
