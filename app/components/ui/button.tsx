import React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  style?: any;
}

export const Button = ({
  children,
  onPress,
  disabled = false,
  variant = 'default',
  size = 'default',
  style,
}: ButtonProps) => {
  const baseStyle = {
    paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyle = {
    default: { backgroundColor: '#4f46e5' },
    destructive: { backgroundColor: '#ef4444' },
    outline: { borderWidth: 2, borderColor: '#888', backgroundColor: 'transparent' },
    secondary: { backgroundColor: '#18181b', borderWidth: 1, borderColor: '#27272a' },
    ghost: { backgroundColor: 'transparent' },
  }[variant];

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[baseStyle, variantStyle, style]}
    >
      <Text
        style={{
          color: variant === 'outline' ? '#fff' : '#fff',
          fontWeight: '700',
          fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};
