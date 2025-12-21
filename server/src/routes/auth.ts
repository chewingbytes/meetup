import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// POST /api/auth/signup { email, password, username? }
router.post("/signup", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    // create user
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;

    // create profile row
    await supabase
      .from("profiles")
      .insert({ id: userData.id, username: username || null, full_name: null })
      .ignore();

    res.status(201).json({ id: userData.id, email: userData.email });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Signup failed" });
  }
});

// POST /api/auth/signin { email, password }
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      // return generic error
      return res
        .status(401)
        .json({ message: error.message || "Invalid credentials" });
    }
    // NOTE: server is not persisting session cookie here. Return session & user data to client for test purposes.
    res.json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Signin failed" });
  }
});

// POST /api/auth/signout
router.post("/signout", async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message || "Signout failed" });
  }
});

export default router;
