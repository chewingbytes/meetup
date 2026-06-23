// Time / date label helpers — ported verbatim from the Expo app so the sheet
// reads identically ("today · starts in 20m", "tomorrow · at 7:00 pm", …).

export function combineEventDateTime(
  startDate?: string | null,
  startTime?: string | null,
  startAnytime?: boolean,
): string | undefined {
  if (!startDate) return undefined;
  if (startAnytime || !startTime) return startDate;
  const d = new Date(startDate);
  const t = new Date(startTime);
  d.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return d.toISOString();
}

export function getEventTimeLabel(startAt?: string): { day: string; countdown: string } {
  if (!startAt) return { day: "", countdown: "" };

  const now = new Date();
  const start = new Date(startAt);
  const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;

  const isToday = start.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const dayName = isToday
    ? "today"
    : isTomorrow
      ? "tomorrow"
      : start.toLocaleDateString("en-SG", { weekday: "long" }).toLowerCase();

  if (!hasTime) {
    return { day: isToday ? "today" : `on ${dayName}`, countdown: "" };
  }

  if (isToday) {
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return { day: "now", countdown: "" };
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return { day: "today", countdown: `starts in ${mins}m` };
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return { day: "today", countdown: `starts in ${hrs}h${remMins > 0 ? ` ${remMins}m` : ""}` };
  }

  const timeStr = start.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" });
  return { day: dayName, countdown: `at ${timeStr}` };
}

/** Short clock time for chat bubbles. */
export function fmtTime(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}
