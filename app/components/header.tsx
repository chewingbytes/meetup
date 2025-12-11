import { View, Text, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { HeaderProps } from "@/utils/types";

export default function Header({ title, actions }: HeaderProps) {
  const router = useRouter();

  return (
    <BlurView
      intensity={50}
      tint="default"
      style={{
        gap: 16,
        width: "100%",
        padding: 18,
        position: "absolute",
        top: 35,
        zIndex: 999,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Title */}
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            color: "#fff",
          }}
        >
          {title}
        </Text>

        {/* Right Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 25,
          }}
        >
          {actions.map((action, idx) => {
            const Icon = action.icon;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (action.onPress) action.onPress();
                  if (action.link) router.push(action.link as any);
                }}
              >
                <Icon size={22} color="#fff" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BlurView>
  );
}
