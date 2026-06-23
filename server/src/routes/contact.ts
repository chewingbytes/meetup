import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// POST /api/contact
router.post("/", async (req, res) => {
  try {
    const { name, email, type, message } = req.body as {
      name?: string;
      email?: string;
      type?: string;
      message?: string;
    };

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email, and message are required" });
    }

    const { data, error } = await supabase
      .from("contact_messages")
      .insert({ name, email, type: type || null, message })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res
      .status(201)
      .json({ message: "Contact message received", data });
  } catch (err: any) {
    console.error("Error saving contact message:", err);
    return res
      .status(500)
      .json({ message: err.message || "Failed to save contact message" });
  }
});

export default router;
