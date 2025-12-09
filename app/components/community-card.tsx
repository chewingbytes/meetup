import { TouchableOpacity, View, Text, Image } from "react-native";
import { CommunityProps } from "@/utils/types";

export default function CommunityCard({
  community,
  onPress,
}: {
  community: CommunityProps;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row w-full rounded-2xl"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Image
        source={{ uri: community.profileImage }}
        className="w-24 h-24 rounded-xl mr-4"
        resizeMode="cover"
      />

      {/* Right Content */}
      <View className="flex-1 justify-between">
        {/* Community Description */}
        <Text className="text-white/70 text-lg font-normal">
          {community.description}
        </Text>

        {/* Community Name */}
        <Text className="text-white text-xl font-medium leading-tight mt-1">
          {community.name}
        </Text>

        {/* Privacy mode */}
        <Text className="text-white/50 text-sm mt-1">
          {community.privacyMode ? "Private" : "Public"} • Created on{" "}
          {community.dateCreated}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
