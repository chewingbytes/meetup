/**
 * ClayInput — recessed clay input field.
 *
 * The "pressed into the surface" feel comes from:
 *   - Slightly darker background than canvas (#EFEBF5)
 *   - Inverted border: dark on top-left, light on bottom-right
 *   - Focus state: white background + accent ring
 */

import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  Animated,
} from "react-native";
import { C } from "@/theme/clay";

interface ClayInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function ClayInput({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ClayInputProps) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onFocus?.(null as any);
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    props.onBlur?.(null as any);
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(124,58,237,0)", "rgba(124,58,237,0.35)"],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#EFEBF5", "#FFFFFF"],
  });

  return (
    <View style={[styles.wrapper, style as any]}>
      {label && (
        <Text style={[styles.label, focused && styles.labelFocused]}>
          {label}
        </Text>
      )}
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: bgColor, borderColor },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={C.textTertiary}
          style={[
            styles.input,
            leftIcon && { paddingLeft: 0 },
            rightIcon && { paddingRight: 0 },
          ]}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    letterSpacing: 0.4,
  },
  labelFocused: {
    color: C.accent,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: C.Radii.lg,
    borderWidth: 2,
    paddingHorizontal: C.Space.lg,
    height: 56,
    // Recessed shadow: dark on top-left, light on bottom-right
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 0,
  },
  input: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    height: "100%",
  },
  iconLeft: {
    marginRight: C.Space.sm,
  },
  iconRight: {
    marginLeft: C.Space.sm,
  },
  error: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.error,
    marginTop: 2,
  },
});
