import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const buttonStyles = tv({
  base: "flex flex-row items-center justify-center rounded-md active:opacity-80",
  variants: {
    variant: {
      default: "bg-primary",
      destructive: "bg-red-600",
      outline: "border border-gray-300",
      secondary: "bg-secondary",
      ghost: "",
      link: "",
    },
    size: {
      default: "h-10 px-4",
      sm: "h-8 px-3",
      lg: "h-12 px-6",
      icon: "h-10 w-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonStyles>["variant"];
  size?: VariantProps<typeof buttonStyles>["size"];
  onPress?: () => void;
  disabled?: boolean;
};

export const Button = ({
  children,
  className,
  variant,
  size,
  onPress,
  disabled,
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      className={buttonStyles({ variant, size, className })}
    >
      <Text className="text-white font-medium">{children}</Text>
    </TouchableOpacity>
  );
};
