import { supabase } from "../../db/supabaseClient.js";

/**
 * Backend auth for the webapp API.
 *
 * The webapp signs users in with Supabase (Google OAuth), so every signed-in
 * client holds a Supabase access token (JWT). These helpers verify that token
 * server-side and derive the caller's identity from it — so routes never have to
 * trust a user id sent in the request body/query (which anyone could forge).
 *
 * NOTE: verification calls the Auth server (`getUser`) on each request. That's
 * fine at current scale; if it ever gets hot, switch to local JWT signature
 * verification with the project's JWT secret.
 */

function bearerToken(req: any): string | null {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m ? m[1].trim() : null;
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Verify the request's bearer token → { id, email }, or null. Never throws. */
export async function getUserFromToken(req: any): Promise<AuthedUser | null> {
  try {
    const token = bearerToken(req);
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

/** Like getUserFromToken but returns just the id (or null). */
export async function getUserIdFromToken(req: any): Promise<string | null> {
  const u = await getUserFromToken(req);
  return u?.id ?? null;
}

/** Comma-separated allowlist of admin emails (lowercased). Defaults to the
 *  project owner so the admin tools work even before ADMIN_EMAILS is set in the
 *  server env. Set ADMIN_EMAILS="a@x.com,b@y.com" to grant additional admins. */
function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "bryanchewzy24@gmail.com";
  return new Set(raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

/** Whether a verified email is on the admin allowlist (case-insensitive). */
export function isAdminEmail(email: string | null | undefined): boolean {
  const e = String(email ?? "").trim().toLowerCase();
  return !!e && adminEmails().has(e);
}

/**
 * Express middleware — requires a valid Supabase session. On success it sets
 * `req.userId` and `req.userEmail`; otherwise responds 401. Use this on every
 * mutating webapp route (and any "my data" reads).
 */
export async function requireUser(req: any, res: any, next: any) {
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: "Sign in required.", code: "unauthenticated" });
  }
  req.userId = user.id;
  req.userEmail = user.email;
  next();
}

/**
 * Express middleware — requires a valid session whose verified email is on the
 * admin allowlist. Sets `req.userId` / `req.userEmail` / `req.isAdmin` on
 * success; 401 if not signed in, 403 if signed in but not an admin. This is the
 * ONLY thing that authorises the admin (banhammer) routes — the client UI gate
 * is cosmetic and never trusted.
 */
export async function requireAdmin(req: any, res: any, next: any) {
  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ message: "Sign in required.", code: "unauthenticated" });
  }
  if (!isAdminEmail(user.email)) {
    return res.status(403).json({ message: "Admin access required.", code: "forbidden" });
  }
  req.userId = user.id;
  req.userEmail = user.email;
  req.isAdmin = true;
  next();
}
