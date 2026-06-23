import React from "react";
import { Text, Pressable, View } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string; // For additional styling
}

export const Button = ({
  children,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = "",
}: ButtonProps) => {

  const baseClasses = "flex-row items-center justify-center border-4 border-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
  const shadowStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  };

  // Variant styles
  const variantStyles = {
    default: "bg-neo-red",
    destructive: "bg-red-500",
    outline: "bg-white",
    secondary: "bg-neo-yellow",
    ghost: "bg-transparent border-transparent active:bg-neo-yellow active:border-black",
  };

  // Size styles
  const sizeStyles = {
    default: "h-14 px-6",
    sm: "h-10 px-4",
    lg: "h-16 px-8",
    icon: "h-14 w-14 items-center justify-center px-0",
  };
  
  // Text styles
  const textBase = "font-space-bold uppercase tracking-wider text-black text-center font-bold";
  const textSize = {
    default: "text-base",
    sm: "text-sm",
    lg: "text-lg",
    icon: "text-xl",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${baseClasses} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled ? 'opacity-50' : ''}`}
      style={({ pressed }) => [
        variant !== 'ghost' && !pressed ? shadowStyle : {}, // conditional shadow
        // NativeWind handles the rest via className
      ]}
    >
      <Text className={`${textBase} ${textSize[size]}`}>
        {children}
      </Text>
    </Pressable>
  );
};
