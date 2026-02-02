import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// SEND event invitation (bring a friend)
router.post("/send", async (req, res) => {
  try {
    const { event_id, inviter_id, invitee_id } = req.body;

    if (!event_id || !inviter_id || !invitee_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("event_invitations")
      .insert({
        event_id,
        inviter_id,
        invitee_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for invitee
    await supabase.from("notifications").insert({
      recipient_id: invitee_id,
      actor_id: inviter_id,
      type: "event",
      title: "You've been invited to an event",
      ref_event: event_id,
    });

    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to send invitation" });
  }
});

// GET pending invitations for user
router.get("/pending/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from("event_invitations")
      .select(`
        *,
        events(name, start_at, location_text),
        profiles:inviter_id(full_name, avatar_url)
      `)
      .eq("invitee_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch invitations" });
  }
});

// ACCEPT invitation (join event)
router.post("/accept/:invitation_id", async (req, res) => {
  try {
    const { invitation_id } = req.params;
    const { user_id } = req.body;

    // Get invitation details
    const { data: invitation } = await supabase
      .from("event_invitations")
      .select("*")
      .eq("id", invitation_id)
      .single();

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Add user to event
    await supabase.from("user_events").insert({
      user_id,
      event_id: invitation.event_id,
    });

    // Delete invitation
    await supabase.from("event_invitations").delete().eq("id", invitation_id);

    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to accept invitation" });
  }
});

// DECLINE invitation
router.post("/decline/:invitation_id", async (req, res) => {
  try {
    const { invitation_id } = req.params;

    const { error } = await supabase
      .from("event_invitations")
      .delete()
      .eq("id", invitation_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to decline invitation" });
  }
});

export default router;
