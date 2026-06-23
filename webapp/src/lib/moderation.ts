/**
 * Anti-scam moderation for activity creation.
 *  1. Synchronous high-risk word filter (instant, blocks the obvious stuff).
 *  2. Optional OpenAI Moderation pass via our server route /api/moderate
 *     (catches inappropriate content; no-ops gracefully if no key is set).
 */

// High-risk scam / MLM vocabulary — block submission and flag for review.
const HIGH_RISK_WORDS = [
  "mentor",
  "passive income",
  "financial freedom",
  "wealth",
  "crypto",
  "forex",
  "investment opportunity",
  "make money fast",
  "side hustle",
  "get rich",
  "dm me to earn",
];

export interface ModerationResult {
  ok: boolean;
  reason?: string;
  flaggedWords?: string[];
}

/** Local, synchronous check. Runs first; cheap and offline-safe. */
export function wordFilter(text: string): ModerationResult {
  const lower = (text || "").toLowerCase();
  const hits = HIGH_RISK_WORDS.filter((w) => lower.includes(w));
  if (hits.length > 0) {
    return {
      ok: false,
      reason:
        "This looks like promotional / financial content, which isn't allowed. Flagged for review.",
      flaggedWords: hits,
    };
  }
  return { ok: true };
}

/** Server-side OpenAI Moderation pass. Returns ok:true if disabled/unreachable. */
export async function aiModerate(text: string): Promise<ModerationResult> {
  try {
    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { ok: true }; // fail open — never block on infra issues
    const data = (await res.json()) as { flagged?: boolean; categories?: string[] };
    if (data.flagged) {
      return {
        ok: false,
        reason: "This content was flagged as inappropriate. Please revise it.",
        flaggedWords: data.categories,
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/** Full pipeline: word filter first (fast-fail), then AI moderation. */
export async function moderateActivityText(text: string): Promise<ModerationResult> {
  const local = wordFilter(text);
  if (!local.ok) return local;
  return aiModerate(text);
}
