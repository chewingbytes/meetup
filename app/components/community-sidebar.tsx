import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
  Dimensions,
} from "react-native";
import { Plus } from "lucide-react-native";
import { CommunityProps } from "@/utils/types";

interface CommunitySidebarProps {
  communities: CommunityProps[];
  selectedCommunityId: string | null;
  onSelectCommunity: (community: CommunityProps) => void;
  onAddCommunity: () => void;
}

export default function CommunitySidebar({
  communities,
  selectedCommunityId,
  onSelectCommunity,
  onAddCommunity,
}: CommunitySidebarProps) {
  return (
    <View className="w-20 bg-neo-bg flex-col items-center py-4 gap-y-4 border-r-4 border-black h-min-max">
      {/* Communities Stack */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 w-full px-2"
        contentContainerStyle={{ alignItems: "center", gap: 16 }}
      >
        {communities.map((community) => (
          <TouchableOpacity
            key={community.id}
            activeOpacity={1}
            onPress={() => onSelectCommunity(community)}
            className={`w-14 h-14 bg-white border-4 border-black items-center justify-center overflow-hidden transition-all active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_#000] ${
              selectedCommunityId === community.id
                ? "bg-neo-yellow -rotate-2"
                : "rotate-1"
            }`}
          >
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-neo-violet">
                <Text className="text-black text-xl font-black uppercase">
                  {community.name?.charAt(0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Community Button */}
        <TouchableOpacity
          onPress={onAddCommunity}
          activeOpacity={1}
          className="w-14 h-14 bg-neo-red border-4 border-black items-center justify-center mt-4 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
        >
          <Plus size={28} color="#000" strokeWidth={4} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
