import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
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
    <View className="w-24 bg-zinc-950 flex-col items-center py-4 gap-y-3">
      {/* Communities Stack */}
      <ScrollView
        scrollEnabled={communities.length > 6}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {communities.map((community) => (
          <TouchableOpacity
            key={community.id}
            onPress={() => onSelectCommunity(community)}
            className={`w-16 h-16 rounded-full mb-3 items-center justify-center overflow-hidden border-2 ${
              selectedCommunityId === community.id
                ? "border-indigo-500"
                : "border-zinc-800"
            }`}
          >
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full bg-indigo-600 items-center justify-center">
                <Text className="text-white text-xl font-bold">
                  {community.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Community Button */}
      <View className="border-t border-zinc-800 pt-3">
        <TouchableOpacity
          onPress={onAddCommunity}
          className="w-16 h-16 rounded-full bg-zinc-800 items-center justify-center hover:bg-zinc-700"
        >
          <Plus size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}