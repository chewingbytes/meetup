/**
 * Clay design tokens (JS form) — for gradients and any inline styling that
 * Tailwind utility classes can't express cleanly (e.g. dynamic CSS gradients).
 * Mirrors the Expo app's theme/clay.ts.
 */

export const C = {
  canvas: "#F4F1FA",
  surface: "#FFFFFF",
  surfaceWarm: "#FAF8FF",
  textPrimary: "#332F3A",
  textSecondary: "#635F69",
  textTertiary: "#9B96A3",
  accent: "#7C3AED",
  accentLight: "#A78BFA",
  accentPink: "#DB2777",
  accentBlue: "#0EA5E9",
  accentGreen: "#10B981",
  accentAmber: "#F59E0B",
  accentCoral: "#F87171",
} as const;

export const Gradients = {
  primary: ["#A78BFA", "#7C3AED"] as const,
  primaryDeep: ["#7C3AED", "#5B21B6"] as const,
  pink: ["#F472B6", "#DB2777"] as const,
  blue: ["#38BDF8", "#0EA5E9"] as const,
  green: ["#34D399", "#10B981"] as const,
  amber: ["#FCD34D", "#F59E0B"] as const,
  coral: ["#FCA5A5", "#F87171"] as const,
} as const;

/** CSS linear-gradient string from a [from,to] pair (135deg = top-left→bottom-right). */
export function grad(pair: readonly [string, string], deg = 135): string {
  return `linear-gradient(${deg}deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
}

/** Deterministic gradient for an author/avatar based on a string seed. */
const AVATAR_GRADS: Array<readonly [string, string]> = [
  Gradients.primary,
  Gradients.pink,
  Gradients.blue,
  Gradients.green,
  Gradients.amber,
  Gradients.coral,
];

export function authorGradient(seed: string): readonly [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADS[Math.abs(h) % AVATAR_GRADS.length];
}
