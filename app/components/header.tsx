import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { HeaderProps } from "@/utils/types";
import { Bell } from "lucide-react-native";

export default function Header({
  title,
  actions,
  //profileImage,
}: HeaderProps & { profileImage?: string; onProfilePress?: () => void }) {
  const profileImage = "https://picsum.photos/seed/c1/180/180";
  const router = useRouter();

  return (
    <View
      className="absolute top-0 left-0 right-0 z-50 bg-neo-bg border-b-4 border-black pt-12 pb-4 px-4 flex-row items-center justify-between"
      style={{
           // Ensure it's above everything and handles notch area if SafeAreaView isn't wrapping it explicitly (it's absolute)
           paddingTop: 60 // Approximate notch, or use safe area inset hook if available
      }}
    >
        {/* Left: Profile + Title */}
        <View className="flex-row items-center gap-4">
          <TouchableOpacity onPress={() => router.push("/settings")} className="border-4 border-black bg-white rounded-full overflow-hidden w-12 h-12">
              <Image
                source={{ uri: profileImage }}
                className="w-full h-full"
              />
          </TouchableOpacity>

          <View className="bg-neo-yellow border-4 border-black px-2 -rotate-2 shadow-[4px_4px_0px_0px_#000]">
             <Text className="text-2xl font-black uppercase text-black">{title}</Text>
          </View>
        </View>

        {/* Right Action Buttons */}
        <View className="flex-row items-center gap-4">
          {actions.map((action, idx) => {
            const Icon = action.icon;

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  if (action.onPress) action.onPress();
                  if (action.link) router.push(action.link as any);
                }}
                className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
              >
                <Icon size={20} color="#000" strokeWidth={3} />
              </TouchableOpacity>
            );
          })}
        </View>
    </View>
  );
}
