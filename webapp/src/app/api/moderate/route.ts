import { NextResponse } from "next/server";

/**
 * Server-side OpenAI Moderation pass (free endpoint). The API key stays on the
 * server (never shipped to the browser). If OPENAI_API_KEY is unset or the call
 * fails, we return `flagged: false` so creation is never blocked by infra — the
 * synchronous high-risk word filter on the client is the always-on guardrail.
 */
export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || !text.trim()) return NextResponse.json({ flagged: false });

    const key = process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ flagged: false, disabled: true });

    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });

    if (!res.ok) return NextResponse.json({ flagged: false });

    const data = await res.json();
    const result = data?.results?.[0];

    // OpenAI's own `flagged` boolean is tuned to be conservative (few false
    // positives). We ALSO flag when a serious category crosses a lower
    // threshold, so borderline harassment / hate / derogatory text is caught.
    // Tune THRESHOLD up (fewer blocks) or down (more aggressive) as needed.
    const THRESHOLD = 0.5;
    const WATCH = [
      "harassment",
      "harassment/threatening",
      "hate",
      "hate/threatening",
      "sexual",
      "sexual/minors",
      "violence",
      "violence/graphic",
      "self-harm",
      "self-harm/intent",
      "self-harm/instructions",
    ];
    const scores = (result?.category_scores ?? {}) as Record<string, number>;
    const overThreshold = WATCH.filter((c) => (scores[c] ?? 0) >= THRESHOLD);

    const flagged = !!result?.flagged || overThreshold.length > 0;
    const trueCategories = result?.categories
      ? Object.entries(result.categories)
          .filter(([, v]) => v)
          .map(([k]) => k)
      : [];
    const categories = Array.from(new Set([...trueCategories, ...overThreshold]));

    return NextResponse.json({ flagged, categories });
  } catch {
    return NextResponse.json({ flagged: false });
  }
}
