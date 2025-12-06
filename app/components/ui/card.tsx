import * as React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  className?: string;
}

function Card({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`bg-white dark:bg-gray-800 text-black dark:text-white flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 py-6 shadow-sm ${className}`}
      {...props}
    />
  );
}

function CardHeader({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`flex flex-col gap-2 px-6 ${className}`}
      {...props}
    />
  );
}

function CardTitle({ className = "", ...props }: CardProps) {
  return (
    <View className={`font-semibold text-base ${className}`} {...props} />
  );
}

function CardDescription({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`text-gray-500 dark:text-gray-400 text-sm ${className}`}
      {...props}
    />
  );
}

function CardAction({ className = "", ...props }: CardProps) {
  return (
    <View
      className={`self-start justify-end ${className}`}
      {...props}
    />
  );
}

function CardContent({ className = "", ...props }: CardProps) {
  return <View className={`px-6 ${className}`} {...props} />;
}

function CardFooter({ className = "", ...props }: CardProps) {
  return (
    <View className={`flex flex-row items-center px-6 pt-6 ${className}`} {...props} />
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
