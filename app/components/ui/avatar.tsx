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

export function Avatar({ size = 40, className = "", style, ...props }: AvatarProps) {
  return (
    <View
      style={[{ width: size, height: size, borderRadius: size / 2, overflow: "hidden" }, style]}
      className={`bg-gray-200 ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({ size = 40, className = "", style, ...props }: AvatarImageProps) {
  return (
    <Image
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      className={className}
      {...props}
    />
  );
}

export function AvatarFallback({ size = 40, children, className = "", style, ...props }: AvatarFallbackProps) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
        style,
      ]}
      className={className}
      {...props}
    >
      <Text style={{ fontSize: size / 2, fontWeight: "bold", color: "#111827" }}>{children}</Text>
    </View>
  );
}
