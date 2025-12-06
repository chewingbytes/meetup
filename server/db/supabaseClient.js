import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Replace with your self-hosted Supabase URL and anonKey
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseRoleKey = process.env.SUPABASE_ROLE_KEY;

export const supabaseClient = createClient(supabaseUrl, supabaseRoleKey);