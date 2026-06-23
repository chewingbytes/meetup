import * as React from "react";
import { View, ViewProps, Text, TextProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string; // Add className prop for nativewind
}

function Card({ className, style, ...props }: CardProps) {
  const shadowStyle = {
    elevation: 0, 
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  };

  return (
    <View
      style={[shadowStyle, style]} /* Override shadow */
      className={`bg-white border-4 border-black mb-6 ${className || ''}`}
      {...props}
    />
  );
}

function CardHeader({ className, style, ...props }: CardProps) {
  return (
    <View
      className={`p-4 border-b-4 border-black bg-neo-bg ${className || ''}`}
      style={style}
      {...props}
    />
  );
}

function CardTitle({ className, style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={`text-2xl font-bold uppercase tracking-tighter text-black ${className || ''}`}
      style={style}
      {...props}
    />
  );
}

function CardDescription({ className, style, ...props }: TextProps & { className?: string }) {
  return (
    <Text
      className={`text-base text-black/70 font-medium mt-1 ${className || ''}`}
      style={style}
      {...props}
    />
  );
}

function CardAction({ className, style, ...props }: CardProps) {
  return (
    <View
      className={`justify-end ${className || ''}`}
      style={style}
      {...props}
    />
  );
}

function CardContent({ className, style, ...props }: CardProps) {
  return (
    <View className={`p-4 ${className || ''}`} style={style} {...props} />
  );
}

function CardFooter({ className, style, ...props }: CardProps) {
  return (
    <View
      className={`flex-row items-center p-4 border-t-4 border-black bg-neo-white ${className || ''}`}
      style={style}
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
