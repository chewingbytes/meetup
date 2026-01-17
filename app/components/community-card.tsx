import { TouchableOpacity, View, Text, Image } from "react-native";
import { CommunityProps } from "@/utils/types";

export default function CommunityCard({
  community,
  onPress,
}: {
  community: CommunityProps;
  onPress: () => void;
}) {
  const createdDate = new Date(community.created_at as string);
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row w-full rounded-xl"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {community.profileImage ? (
        <Image
          source={{ uri: community.profileImage }}
          className="w-20 h-auto rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View className="w-20 h-auto rounded-xl mr-4 bg-gray-600 justify-center items-center">
          <Text className="text-2xl">📅</Text>
        </View>
      )}

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
          {formattedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
