/**
 * Activity category config — shared between the create form and map pins.
 * Mirrors the Expo app's utils/categories.ts (Briefcase / Dumbbell / Coffee).
 */
import { Briefcase, Dumbbell, Coffee, type LucideIcon } from "lucide-react";
import { Gradients } from "./theme";

export interface CategoryConfig {
  id: string;
  label: string;
  Icon: LucideIcon;
  gradient: readonly [string, string];
}

export const CATEGORIES: CategoryConfig[] = [
  { id: "network", label: "Network & Collab", Icon: Briefcase, gradient: Gradients.primary },
  { id: "fitness", label: "Fitness & Sports", Icon: Dumbbell, gradient: Gradients.green },
  { id: "chill", label: "Chill & Social", Icon: Coffee, gradient: Gradients.amber },
];

export function getCategoryConfig(categoryId: string | undefined | null): CategoryConfig {
  return CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}

// ── Interest → emoji (subset of the Expo app's map, for the participant badges) ──
const INTEREST_EMOJI: [string, string][] = [
  ["coffee", "☕"], ["gym", "🏋️"], ["fitness", "🏋️"], ["run", "🏃"], ["running", "🏃"],
  ["football", "⚽"], ["soccer", "⚽"], ["basketball", "🏀"], ["tennis", "🎾"],
  ["climb", "🧗"], ["hike", "🥾"], ["yoga", "🧘"], ["music", "🎶"], ["guitar", "🎸"],
  ["art", "🎨"], ["photography", "📷"], ["photo", "📷"], ["food", "🍜"], ["cook", "👨‍🍳"],
  ["startup", "🚀"], ["build", "🛠️"], ["code", "💻"], ["coding", "💻"], ["design", "🎨"],
  ["read", "📚"], ["book", "📚"], ["game", "🎮"], ["gaming", "🎮"], ["movie", "🎬"],
  ["dance", "💃"], ["travel", "✈️"], ["dog", "🐶"], ["beer", "🍺"], ["wine", "🍷"],
  ["network", "🤝"], ["chess", "♟️"], ["invest", "📈"], ["write", "✍️"],
];

export function interestEmoji(interest?: string | null): string {
  if (!interest) return "✨";
  const lower = interest.toLowerCase();
  for (const [key, emoji] of INTEREST_EMOJI) {
    if (lower.includes(key)) return emoji;
  }
  return "✨";
}
