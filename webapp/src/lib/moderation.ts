/**
 * Moderation for activity creation. Two layers:
 *  1. Synchronous local filter (instant, offline-safe) — blocks scam/MLM
 *     vocabulary AND profanity / slurs / derogatory language. This is the
 *     always-on guardrail and does NOT depend on any external service.
 *  2. Optional OpenAI Moderation pass via /api/moderate — catches nuanced /
 *     contextual abuse the keyword list can't. Fails OPEN (never blocks on
 *     infra issues), so layer 1 must stand on its own.
 */

// High-risk scam / MLM vocabulary — multi-word phrases, substring match is fine.
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

/**
 * Profanity, slurs, and clearly-derogatory terms, as regex fragments.
 * Each fragment self-anchors with \b (word boundary) so we don't false-positive
 * on innocent words — e.g. "class", "assignment", "Scunthorpe", "cocktail",
 * "fire retardant", "raccoon" must NOT match. Mild/ambiguous words ("stupid",
 * "ugly", "trash", "loser") are intentionally excluded — they appear in
 * legitimate titles ("ugly sweater party", "beach trash cleanup") and are left
 * to the AI pass to judge in context.
 */
const PROFANITY_PATTERNS = [
  // ── Strong profanity (+ common suffixes via \w*) ──
  "\\bfuck\\w*",
  "\\bmotherfuck\\w*",
  "\\bshit\\w*",
  "\\bbullshit\\w*",
  "\\bbitch\\w*",
  "\\bbastard\\w*",
  "\\basshole\\w*",
  "\\basshat\\w*",
  "\\bdumbass\\w*",
  "\\bjackass\\w*",
  "\\bdickhead\\w*",
  "\\bcocksuck\\w*",
  "\\bcunt\\w*",
  "\\bslut\\w*",
  "\\bwhore\\w*",
  "\\bskank\\w*",
  "\\bdouche\\w*",
  "\\bwank\\w*",
  "\\btwat\\w*",
  // ── Slurs ──
  "\\bnigg\\w*",
  "\\bfag\\w*",
  "\\bkike\\b",
  "\\bspic\\b",
  "\\bchink\\b",
  "\\bgook\\b",
  "\\bwetback\\b",
  "\\bcoon\\b",
  "\\btrann\\w*",
  "\\bretard(?:ed|s)?\\b", // matches retard/retarded/retards, NOT "retardant"
  // ── Unambiguous derogatory ──
  "\\bscumbag\\w*",
  "\\bdirtbag\\w*",
];

const PROFANITY_RE = new RegExp(PROFANITY_PATTERNS.join("|"), "i");

export interface ModerationResult {
  ok: boolean;
  reason?: string;
  flaggedWords?: string[];
}

/** Local, synchronous check. Runs first; cheap and offline-safe. */
export function wordFilter(text: string): ModerationResult {
  const lower = (text || "").toLowerCase();

  // 1. Scam / MLM phrases.
  const scamHits = HIGH_RISK_WORDS.filter((w) => lower.includes(w));
  if (scamHits.length > 0) {
    return {
      ok: false,
      reason:
        "This looks like promotional / financial content, which isn't allowed. Flagged for review.",
      flaggedWords: scamHits,
    };
  }

  // 2. Profanity / slurs / derogatory language.
  const hit = lower.match(PROFANITY_RE);
  if (hit) {
    return {
      ok: false,
      reason:
        "This title or details contain offensive or derogatory language. Please revise it.",
      flaggedWords: [hit[0]],
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
