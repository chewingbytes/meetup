import * as React from "react";
import { TextInput, TextInputProps, View, StyleSheet } from "react-native";

interface InputProps extends TextInputProps {}

const Input = React.forwardRef<TextInput, InputProps>(({ style, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor="#71717a"
      style={[
        {
          backgroundColor: "#18181b",
          borderWidth: 1,
          borderColor: "#27272a",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          color: "#fff",
          fontSize: 14,
          fontFamily: "System",
        },
        style,
      ]}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
