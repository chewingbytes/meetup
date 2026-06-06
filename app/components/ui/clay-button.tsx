/**
 * ClayButton — gradient button with haptic squish.
 *
 * Physical feel is achieved via:
 *   - LinearGradient from light-to-dark (top-left lit = convex clay)
 *   - Purple drop shadow (floating above surface)
 *   - Animated press: scale 0.93 + shadow reduction
 *   - Expo Haptics for tactile feedback
 */

import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import { C, Shadows } from "@/theme/clay";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

interface ClayButtonProps {
  onPress?: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANT_GRADIENTS: Record<ButtonVariant, readonly [string, string]> = {
  primary: C.Gradients.primary,
  secondary: ["#FFFFFF", "#F4F1FA"] as const,
  ghost:   ["rgba(124,58,237,0.08)", "rgba(124,58,237,0.14)"] as const,
  danger:  C.Gradients.coral,
  success: C.Gradients.green,
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary:   C.textInverse,
  secondary: C.textPrimary,
  ghost:     C.accent,
  danger:    C.textInverse,
  success:   C.textInverse,
};

const SIZE_HEIGHT: Record<ButtonSize, number> = { sm: 44, md: 52, lg: 60 };
const SIZE_TEXT: Record<ButtonSize, number> = { sm: 13, md: 15, lg: 17 };
const SIZE_RADIUS: Record<ButtonSize, number> = { sm: C.Radii.md, md: C.Radii.lg, lg: C.Radii.xl };
const SIZE_H_PAD: Record<ButtonSize, number> = { sm: 16, md: 24, lg: 32 };

export function ClayButton({
  onPress,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ClayButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const isDisabled = disabled || loading;
  const gradColors = VARIANT_GRADIENTS[variant];

  return (
    <Animated.View
      style={[
        isDisabled ? Shadows.none : Shadows.button,
        fullWidth && { width: "100%" },
        { transform: [{ scale }], opacity: isDisabled ? 0.55 : 1 },
        style,
      ]}
    >
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : handlePressIn}
        onPressOut={isDisabled ? undefined : handlePressOut}
        style={{ borderRadius: SIZE_RADIUS[size] }}
      >
        <LinearGradient
          colors={gradColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.inner,
            {
              height: SIZE_HEIGHT[size],
              borderRadius: SIZE_RADIUS[size],
              paddingHorizontal: SIZE_H_PAD[size],
            },
            variant === "secondary" && styles.secondaryBorder,
            variant === "ghost" && styles.ghostBorder,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              color={VARIANT_TEXT[variant]}
              size="small"
            />
          ) : (
            <Text
              style={[
                styles.label,
                { color: VARIANT_TEXT[variant], fontSize: SIZE_TEXT[size] },
                textStyle,
              ]}
            >
              {children}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // Top-left white border = convex highlight
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.60)",
    borderLeftColor: "rgba(255,255,255,0.40)",
    borderRightColor: "rgba(255,255,255,0.10)",
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  label: {
    fontFamily: C.Fonts.bodyBold,
    letterSpacing: 0.3,
  },
  secondaryBorder: {
    borderTopColor: "rgba(124,58,237,0.15)",
    borderLeftColor: "rgba(124,58,237,0.10)",
    borderRightColor: "rgba(124,58,237,0.10)",
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
  ghostBorder: {
    borderTopColor: "rgba(124,58,237,0.20)",
    borderLeftColor: "rgba(124,58,237,0.12)",
    borderRightColor: "rgba(124,58,237,0.12)",
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
});
