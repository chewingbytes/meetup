import express from "express";
import dotenv from "dotenv";
import { supabaseClient } from "../db/supabaseClient.js";

const router = express.Router();
dotenv.config();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // const supabaseRes = await fetch(
    //   "http://46.62.247.253:8000/auth/v1/token?grant_type=password",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    //     },
    //     body: JSON.stringify({
    //       email,
    //       password,
    //     }),
    //   }
    // );

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Supabase login error:", error);

      return res
        .status(500)
        .json({ error: "something went wrong iwth the client" });
    }

    return res.json({
      data,
    });

    // Supabase returns:
    // {
    //   access_token,
    //   refresh_token,
    //   expires_in,
    //   token_type,
    //   user
    // }
  } catch (error) {
    console.error("Supabase auth error:", error);
    return res.status(500).json({
      error: "Internal server error contacting Supabase Auth",
    });
  }
});

router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({
      error: "Full name, email, and password are required",
    });
  }

  try {
    // 1. Create user with Supabase Auth
    const { data: signupData, error: signupError } =
      await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

    if (signupError) {
      console.error("Supabase signup error:", signupError);
      return res.status(400).json({
        error: signupError.message || "Registration failed",
      });
    }

    const user = signupData.user;

    // IMPORTANT: user may be null if "email confirmation" is ON
    if (!user) {
      return res.json({
        message:
          "Account created. Check your email to confirm before logging in.",
      });
    }

    console.log("New user UID:", user.id);

    // 2. Create profile row
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert([
        {
          id: user.id, // matches user UUID
          full_name: fullName,
          avatar_url: null,
          school_email: email || null,
          // school_name: schoolName || null,
          singpass_verified: false,
          face_verified: false,
          bio: null,
          interests: [],
          personality_type: null,
        },
      ]);

    if (profileError) {
      console.error("Error inserting profile:", profileError);

      await supabaseClient.auth.admin.deleteUser(user.id);

      return res.status(500).json({
        error: "User created but profile creation failed",
      });
    }

    return res.json({
      message: "Account + profile created successfully",
      user,
    });
  } catch (err) {
    console.error("Register catch error:", err);
    return res.status(500).json({
      error: "Internal server error contacting Supabase Auth",
    });
  }
});

export default router;
