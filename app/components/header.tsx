import { View, Text, TouchableOpacity, Image } from "react-native";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { HeaderProps } from "@/utils/types";

export default function Header({
  title,
  actions,
  //profileImage,
  onProfilePress,
}: HeaderProps & { profileImage?: string; onProfilePress?: () => void }) {

  const profileImage = "https://picsum.photos/seed/c1/180/180";
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
        {/* Left: Profile + Title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {profileImage && (
            <TouchableOpacity onPress={onProfilePress}>
              <Image
                source={{ uri: profileImage }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20, // makes it round
                }}
              />
            </TouchableOpacity>
          )}

          <Text
            style={{
              fontSize: 30,
              fontWeight: "700",
              color: "#fff",
            }}
          >
            {title}
          </Text>
        </View>

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
