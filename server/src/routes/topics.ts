import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    console.log("hi")
    const { data, error } = await supabase.from("topics").select("*").order("id", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to fetch topics" });
  }
});

export default router;