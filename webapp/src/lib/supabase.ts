import { createClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client (anon key). Used exactly like the Expo app's
 * lib/supabase.ts — for realtime chat (messages table) and presence
 * (online users). All privileged writes go through the Express backend.
 *
 * Anonymous webapp visitors are NOT Supabase-auth users, so we disable session
 * persistence. OAuth (Google/Apple) hosts DO use Supabase auth and get their
 * own session (detectSessionInUrl handles the OAuth redirect callback).
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://supabase.hangoutstudios.com";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzY0NjkxMjAwLCJleHAiOjE5MjI0NTc2MDB9.RB4UMWyk4yUl0GvrbJ_B1f9u6AEar6prsBUTqN3ftWQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
