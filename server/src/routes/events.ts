import express from "express";
import { supabase } from "../../db/supabaseClient.js";
import { upload } from "../../middleware/upload.ts";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { minLat, maxLat, minLng, maxLng } = req.query as Record<string, string | undefined>;

    console.log(`[EVENTS] GET / | bounds: lat=[${minLat ?? "none"}, ${maxLat ?? "none"}] lng=[${minLng ?? "none"}, ${maxLng ?? "none"}]`);

    let query = supabase.from("events").select("*");

    if (minLat && maxLat && minLng && maxLng) {
      query = query
        .gte("location_lat", parseFloat(minLat))
        .lte("location_lat", parseFloat(maxLat))
        .gte("location_lng", parseFloat(minLng))
        .lte("location_lng", parseFloat(maxLng));
    }

    const { data: events, error } = await query
      .order("startDate", { ascending: true })
      .limit(50);
    if (error) throw error;

    console.log(`[EVENTS] query returned ${events?.length ?? 0} rows`);

    // Enrich with organizer avatar_url + username
    const organizerIds = [...new Set(
      (events || []).map((e: any) => e.organizer_id).filter(Boolean)
    )] as string[];

    let organizerMap: Record<string, { avatar_url: string | null; username: string | null; photo_urls: string[] | null }> = {};
    if (organizerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, avatar_url, username, photo_urls")
        .in("id", organizerIds);
      for (const p of profiles || []) {
        organizerMap[p.id] = {
          avatar_url: p.avatar_url ?? null,
          username: p.username ?? null,
          photo_urls: p.photo_urls ?? null,
        };
      }
    }

    const enriched = (events || []).map((e: any) => {
      const org = organizerMap[e.organizer_id];
      return {
        ...e,
        organizer_avatar_url: org?.avatar_url ?? null,
        organizer_username: org?.username ?? null,
        // First photo from photo_urls is the organizer's main profile photo
        organizer_photo_url: org?.photo_urls?.[0] ?? org?.avatar_url ?? null,
      };
    });

    res.json(enriched);
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
      ...new Set([...(joinedEventIds || []).map((j: any) => j.event_id)]),
    ];

    // Fetch events (organized by user OR user joined)
    let query = supabase
      .from("events")
      .select("*")
      .order("startDate", { ascending: true });

    if (eventIds.length > 0) {
      query = query.or(
        `organizer_id.eq.${user_id},id.in.(${eventIds.join(",")})`,
      );
    } else {
      query = query.eq("organizer_id", user_id);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    console.log("✅ Found", events?.length || 0, "events");
    res.json(events || []);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch user events" });
  }
});

// Check event membership
router.get("/check-membership", async (req, res) => {
  try {
    const { user_id, event_id } = req.query;

    if (!user_id || !event_id) {
      return res
        .status(400)
        .json({ message: "user_id and event_id are required" });
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
    res
      .status(500)
      .json({ message: err.message || "Failed to check membership" });
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
    const { data: participantIds, error: participantIdsError } = await supabase
      .from("user_events")
      .select("user_id")
      .eq("event_id", id);

    if (participantIdsError) throw participantIdsError;

    const userIds = (participantIds || []).map((row: any) => row.user_id);

    let participants: Array<{
      id: string;
      username: string | null;
      avatar_url: string | null;
      personality_type: string | null;
      main_interest: string | null;
    }> = [];

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, personality_type, main_interest")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      participants = (profiles || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username || null,
        avatar_url: profile.avatar_url || null,
        personality_type: profile.personality_type || null,
        main_interest: profile.main_interest || null,
      }));
    }

    const output={ ...ev, participants }

    console.log("Fetched event with participants:", output);

    res.json(output);
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
      startDate = null,
      startTime = null,
      startAnytime = true,
      end_at = null,
      location_text,
      location_lat = null,
      location_lng = null,
      location_instructions,
      description,
      require_approval = false,
      is_paid = false,
      price = 0,
      visibility = "public",
      capacity = null,
      category,
      organizerId,
      communityId,
    } = payload;

    console.log("PAYLOAD:", payload);

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
        description: description || null,
        startDate: startDate || null,
        startTime: startTime || null,
        startAnytime: startAnytime ?? true,
        end_at: end_at || null,
        location_text,
        location_lat: location_lat ? Number(location_lat) : null,
        location_lng: location_lng ? Number(location_lng) : null,
        location_instructions,
        category: category || null,
        require_approval,
        is_paid,
        price: is_paid ? price : 0,
        visibility,
        capacity: capacity === null ? null : capacity,
      })
      .select()
      .single();

    if (error) throw error;

    console.log("INSERTED EVENT location_lat:", created?.location_lat, "location_lng:", created?.location_lng);

    // Auto-create a chat channel for this event (community_id optional)
    if (created?.id) {
      console.log("🔵 Creating channel for event:", created.id);
      const { data: newChannel, error: chanErr } = await supabase
        .from("channels")
        .insert({
          name: name,
          description: `Chat for ${name}`,
          community_id: communityId || null,
          event_id: created.id,
        })
        .select()
        .single();
      if (chanErr) {
        console.error("❌ Channel creation failed:", chanErr.message, chanErr.details);
      } else {
        console.log("✅ Channel created:", newChannel?.id, "for event:", created.id);
      }
    }

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
          { onConflict: "user_id,event_id" },
        );

      if (userEventError) {
        console.warn(
          "⚠️ Failed to add organizer to user_events:",
          userEventError,
        );
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

// Delete event — organizer only
// Cascades: channel → user_events → event
// user_id accepted from query param OR body for maximum compatibility
router.delete("/:id", async (req, res) => {
  try {
    const event_id = req.params.id;
    const user_id = (req.query.user_id as string) || req.body?.user_id;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    // Verify the requester is the organizer
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", event_id)
      .single();

    if (evErr || !ev) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (ev.organizer_id !== user_id) {
      return res.status(403).json({ message: "Only the organizer can delete this event" });
    }

    console.log("🔵 Deleting event:", event_id);

    // 1. Delete the channel(s) for this event
    const { error: chanErr } = await supabase
      .from("channels")
      .delete()
      .eq("event_id", event_id);
    if (chanErr) console.warn("⚠️ Channel delete error:", chanErr.message);
    else console.log("✅ Channels deleted for event:", event_id);

    // 2. Remove all attendees from user_events
    const { error: ueErr } = await supabase
      .from("user_events")
      .delete()
      .eq("event_id", event_id);
    if (ueErr) console.warn("⚠️ user_events delete error:", ueErr.message);
    else console.log("✅ user_events cleared for event:", event_id);

    // 3. Delete the event itself
    const { error: delErr } = await supabase
      .from("events")
      .delete()
      .eq("id", event_id);
    if (delErr) throw delErr;

    console.log("✅ Event deleted:", event_id);
    res.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error deleting event:", err);
    res.status(500).json({ message: err.message || "Failed to delete event" });
  }
});

export default router;
