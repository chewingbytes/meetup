import * as React from "react";
import { View, Image, Text, ImageProps, ViewProps, TextProps } from "react-native";

interface AvatarProps extends ViewProps {
  size?: number;
}

interface AvatarImageProps extends ImageProps {
  size?: number;
}

interface AvatarFallbackProps extends TextProps {
  size?: number;
  children: string;
}

export function Avatar({ size = 40, style, ...props }: AvatarProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          backgroundColor: "#27272a",
          borderWidth: 2,
          borderColor: "#4f46e5",
        },
        style,
      ]}
      {...props}
    />
  );
}

export function AvatarImage({ size = 40, style, ...props }: AvatarImageProps) {
  return (
    <Image
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function AvatarFallback({
  size = 40,
  children,
  style,
  ...props
}: AvatarFallbackProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#4f46e5",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      {...props}
    >
      <Text style={{ fontSize: size / 2.5, fontWeight: "700", color: "#fff" }}>
        {children}
      </Text>
    </View>
  );
}
