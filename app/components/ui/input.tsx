import * as React from "react";
import { TextInput, TextInputProps, View } from "react-native";

interface InputProps extends TextInputProps {
  className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <View className="w-full">
        <TextInput
          ref={ref}
          placeholderTextColor="#A1A1AA" // Tailwind's muted-foreground
          className={`h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base text-black
                      dark:bg-gray-700 dark:border-gray-600 dark:text-white
                      focus:ring-2 focus:ring-primary focus:border-primary
                      ${className}`}
          {...props}
        />
      </View>
    );
  }
);

Input.displayName = "Input";

export { Input };
