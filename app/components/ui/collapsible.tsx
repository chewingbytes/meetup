import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity, Animated, Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface CollapsibleProps extends PropsWithChildren {
  title: string;
}

export function Collapsible({ children, title }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  const handlePress = () => {
    setIsOpen(!isOpen);
    Animated.timing(rotateAnim, {
      toValue: !isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <IconSymbol
            name="chevron.right"
            size={20}
            weight="semibold"
            color="#4f46e5"
          />
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#18181b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  content: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#09090b",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
  },
});
