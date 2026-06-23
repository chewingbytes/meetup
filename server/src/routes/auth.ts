import express from "express";
import { supabase } from "../../db/supabaseClient.js";

const router = express.Router();

// POST /api/auth/signup { email, password, username? }
router.post("/signup", async (req, res) => {
  try {

    console.log("TRIGGERING SIGNUP ROUTE WITH BODY:", req.body);
    const { email, password, username, image_url, bio, interests } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const { data: userData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.log("ERROR:", error);
      throw error;
    }

    const userId = (userData as any)?.user?.id || (userData as any)?.id;
    const userEmail =
      (userData as any)?.user?.email || (userData as any)?.email || email;
    if (!userId) throw new Error("User creation failed");

    const profilePayload: any = {
      id: userId,
      username: username || null,
      full_name: null,
    };

    if (image_url) profilePayload.avatar_url = image_url;
    if (bio) profilePayload.bio = bio;
    if (Array.isArray(interests)) profilePayload.interests = interests;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert(profilePayload);

    if (profileError) {
      console.error("Error creating profile:", profileError);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    const userSettingsPayload: any = {
      user_id: userId,
      push_notifications: true,
      email_notifications: true,
      appearance: "system",
    }

    console.log("User settings payload:", userSettingsPayload);

    const { error: settingsError } = await supabase.from("user_settings").insert(userSettingsPayload);

    if (settingsError) {
      console.error("Error creating user settings:", settingsError);
      throw new Error(`User settings creation failed: ${settingsError.message}`);
    }

    res.status(201).json({ id: userId, email: userEmail });
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
