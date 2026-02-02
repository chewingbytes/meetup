import * as React from "react";
import { View, ViewProps, StyleSheet } from "react-native";

interface CardProps extends ViewProps {}

function Card({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: "#18181b",
          borderWidth: 1,
          borderColor: "#27272a",
          borderRadius: 14,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardHeader({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          gap: 8,
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardTitle({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          fontSize: 18,
          fontWeight: "700",
          color: "#fff",
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardDescription({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          fontSize: 14,
          color: "#a1a1aa",
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardAction({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          justifyContent: "flex-end",
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardContent({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          paddingVertical: 8,
        },
        style,
      ]}
      {...props}
    />
  );
}

function CardFooter({ style, ...props }: CardProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#27272a",
        },
        style,
      ]}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
