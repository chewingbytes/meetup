import * as React from "react";
import { Text, View, ViewProps, TextProps } from "react-native";

interface BadgeProps extends ViewProps {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  let variantStyles = "";

  switch (variant) {
    case "secondary":
      variantStyles = "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200";
      break;
    case "destructive":
      variantStyles = "bg-red-600 text-white";
      break;
    case "outline":
      variantStyles = "border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200";
      break;
    case "default":
    default:
      variantStyles = "bg-blue-600 text-white";
  }

  return (
    <View
      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 w-fit shrink-0 gap-1 overflow-hidden ${variantStyles} ${className}`}
      {...props}
    >
      <Text className="text-xs font-medium">{children}</Text>
    </View>
  );
}
