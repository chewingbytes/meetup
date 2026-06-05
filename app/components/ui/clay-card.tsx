/**
 * ClayCard — the foundational clay surface.
 *
 * Multi-layer clay depth is simulated in React Native via:
 *   1. Purple-tinted outer shadow  (distance from surface)
 *   2. White directional border    (top-left light catch)
 *   3. Optional LinearGradient bg  (subtle convexity)
 */

import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { C, Shadows } from "@/theme/clay";

interface ClayCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** "default" = white card, "tinted" = soft lavender tint, "glass" = semi-transparent */
  variant?: "default" | "tinted" | "glass";
  radius?: number;
  padding?: number;
  elevated?: boolean;
}

export function ClayCard({
  children,
  style,
  variant = "default",
  radius = C.Radii.xl,
  padding = C.Space.xxl,
  elevated = false,
}: ClayCardProps) {
  const bgColor =
    variant === "tinted"  ? C.surfaceWarm
    : variant === "glass" ? "rgba(255,255,255,0.72)"
    : C.surface;

  return (
    <View
      style={[
        styles.base,
        elevated ? Shadows.card : Shadows.cardSm,
        {
          borderRadius: radius,
          padding,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    // White top-left border simulates the clay "highlight ridge"
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
});
