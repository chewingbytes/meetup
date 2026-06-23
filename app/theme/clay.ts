/**
 * Clay Design System — Design Tokens
 *
 * Single source of truth for all visual values. Import `C` everywhere.
 * React Native can't stack CSS box-shadows, so we approximate the
 * multi-layer clay effect with:
 *   - Purple-tinted outer shadow  (defines depth from surface)
 *   - White top-left border       (simulates light catch / highlight)
 *   - LinearGradient on buttons   (convex illumination)
 */

import { StyleSheet } from "react-native";

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Colors = {
  // Canvas & surfaces
  canvas: "#F4F1FA",
  surface: "#FFFFFF",
  surfaceWarm: "#FAF8FF",
  overlay: "rgba(255,255,255,0.72)",

  // Text
  textPrimary: "#332F3A",
  textSecondary: "#635F69",
  textTertiary: "#9B96A3",
  textInverse: "#FFFFFF",

  // Accents
  accent: "#7C3AED",       // violet — primary brand
  accentLight: "#A78BFA",  // light violet
  accentPink: "#DB2777",   // hot pink
  accentBlue: "#0EA5E9",   // sky blue
  accentGreen: "#10B981",  // emerald
  accentAmber: "#F59E0B",  // amber
  accentCoral: "#F87171",  // soft red/coral

  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#0EA5E9",

  // Muted tints (backgrounds for chips/badges)
  accentMuted: "#EDE9FE",    // violet tint
  pinkMuted: "#FCE7F3",
  blueMuted: "#E0F2FE",
  greenMuted: "#D1FAE5",
  amberMuted: "#FEF3C7",
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────

export const Gradients = {
  primary: ["#A78BFA", "#7C3AED"] as const,
  primaryDeep: ["#7C3AED", "#5B21B6"] as const,
  pink: ["#F472B6", "#DB2777"] as const,
  blue: ["#38BDF8", "#0EA5E9"] as const,
  green: ["#34D399", "#10B981"] as const,
  amber: ["#FCD34D", "#F59E0B"] as const,
  coral: ["#FCA5A5", "#F87171"] as const,
  canvas: ["#F4F1FA", "#EDE9FE"] as const,
  card: ["rgba(255,255,255,1)", "rgba(250,248,255,1)"] as const,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  xxxl: 48,
  full: 9999,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Fonts = {
  // Heading family: Nunito (loaded in _layout.tsx)
  heading: "Nunito_800ExtraBold",
  headingBold: "Nunito_900Black",
  headingMedium: "Nunito_700Bold",

  // Body family: DM Sans
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_700Bold",

  // Fallbacks (used until fonts load or on Android)
  headingFallback: "System",
  bodyFallback: "System",
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  hero: 48,
} as const;

// ─── Shadows (pre-built StyleSheet-compatible objects) ────────────────────────

export const Shadows = StyleSheet.create({
  // Deep card — prominent floating element
  card: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 24,
    elevation: 10,
  } as any,

  // Light card — subtle surface lift
  cardSm: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  } as any,

  // Floating button
  button: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  } as any,

  // Small button / badge
  buttonSm: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  } as any,

  // Navbar float
  nav: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 12,
  } as any,

  // Hero / modal
  hero: {
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 20,
  } as any,

  none: {
    shadowOpacity: 0,
    elevation: 0,
  } as any,
});

// ─── Card border highlight (simulates clay top-light) ─────────────────────────

export const ClayBorder = {
  default: {
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.60)",
    borderRightColor: "rgba(255,255,255,0.25)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  subtle: {
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.70)",
    borderLeftColor: "rgba(255,255,255,0.40)",
    borderRightColor: "rgba(255,255,255,0.15)",
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
} as const;

// ─── Convenience export ───────────────────────────────────────────────────────

export const C = {
  ...Colors,
  Gradients,
  Radii,
  Space,
  Fonts,
  FontSizes,
  Shadows,
  ClayBorder,
} as const;
