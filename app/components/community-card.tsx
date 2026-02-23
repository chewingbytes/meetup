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
      className="flex-row w-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-4 mb-6 active:translate-y-[2px] active:shadow-none"
    >
      {/* Image Box */}
      <View className="border-4 border-black bg-neo-yellow w-24 h-24 mr-4 items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_#000] -rotate-2">
        {community.profileImage ? (
          <Image
            source={{ uri: community.profileImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-4xl">👾</Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 justify-between py-1">
        <View>
            <View className="bg-neo-red border-2 border-black self-start px-2 mb-1 rotate-1">
                <Text className="text-white text-xs font-bold uppercase">{community.privacyMode ? "PRIVATE" : "PUBLIC"}</Text>
            </View>
            <Text className="text-black text-xl font-black uppercase leading-tight" numberOfLines={2}>
            {community.name}
            </Text>
        </View>

        <Text className="text-black/80 font-medium text-sm leading-tight mt-1" numberOfLines={2}>
          {community.description}
        </Text>
        
        <Text className="text-black/40 text-xs font-bold uppercase mt-2">
           EST. {formattedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
