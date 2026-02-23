import * as React from "react";
import { TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  className?: string; // For Tailwind
}

const Input = React.forwardRef<TextInput, InputProps>(({ className, style, onFocus, onBlur, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <TextInput
      ref={ref}
      placeholderTextColor="rgba(0,0,0,0.5)"
      className={`bg-white border-4 border-black px-4 py-3 text-black text-lg font-bold font-space ${isFocused ? 'bg-neo-yellow' : ''} ${className}`}
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      style={[
        {
          borderRadius: 0, // Force sharp corners
          height: 56, // Fixed height for better text alignment
          textAlignVertical: 'center', // Center text vertically on Android
          includeFontPadding: false, // Remove extra padding on Android
        },
        style,
      ]}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
