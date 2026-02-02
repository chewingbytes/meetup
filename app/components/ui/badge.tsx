import * as React from "react";
import { Text, View, ViewProps } from "react-native";

interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
}

export function Badge({ variant = "default", children, style, ...props }: BadgeProps) {
  const variantStyles = {
    default: {
      backgroundColor: "#4f46e5",
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: "#18181b",
      borderColor: "#27272a",
    },
    destructive: {
      backgroundColor: "#ef4444",
      borderColor: "transparent",
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: "#888",
    },
  }[variant];

  return (
    <View
      style={[
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
          justifyContent: "center",
          alignItems: "center",
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {children}
      </Text>
    </View>
  );
}
