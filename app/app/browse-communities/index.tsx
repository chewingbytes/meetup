import MobileNav from "@/components/mobile-nav";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useCommunities } from "@/hooks/useCommunities";
import { useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BrowseCommunitiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    communities,
    isLoading: communitiesLoading,
    refresh: refreshCommunities,
  } = useCommunities(true, false);

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Sticky Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 bg-[#FFD93D] border-b-4 border-black pb-4"
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 active:translate-y-1"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-2xl font-black uppercase tracking-tighter">
            Directory
          </Text>
          <View className="w-10" />
        </View>

        {/* Search */}
        <View className="px-4 mb-2 relative z-10">
          <View className="absolute top-1 left-5 right-3 bottom-0 bg-black translate-x-1 translate-y-1" />
          <View className="bg-white border-2 border-black flex-row items-center px-4 py-3">
            <Search size={20} color="#000" strokeWidth={3} />
            <TextInput
              placeholder="Find a crew..."
              placeholderTextColor="#999"
              className="flex-1 ml-3 font-bold text-lg text-black bg-transparent border-0 min-h-[24px]"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ fontFamily: "SpaceGrotesk-Bold" }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 180, // Adjust based on header height
          paddingBottom: 180,
          paddingHorizontal: 16,
        }}
      >
        {communitiesLoading ? (
          <View className="flex-1 items-center justify-center">
            <NeoLoader />
          </View>
        ) : (
          filteredCommunities.map((community, index) => (
            <TouchableOpacity
              key={community.id}
              onPress={() => router.push(`/community/${community.id}` as any)}
              className={`flex-row w-full bg-white border-4 border-black p-4 mb-6 active:translate-y-[2px] ${index % 2 === 0 ? "rotate-1" : "-rotate-1"}`}
            >
              {/* Image Box */}
              <View className="border-2 border-black bg-neo-yellow w-20 h-20 mr-4 items-center justify-center overflow-hidden -rotate-2">
                {(() => {
                  const imageSource =
                    community.profile_image ?? community.profileImage;
                  const resolvedImageSource =
                    typeof imageSource === "string"
                      ? { uri: imageSource }
                      : imageSource;
                  return resolvedImageSource ? (
                    <Image
                      source={resolvedImageSource as any}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-3xl"></Text>
                  );
                })()}
              </View>

              {/* Content */}
              <View className="flex-1 justify-center">
                <View className="self-start bg-neo-violet border border-black px-1 mb-1">
                  <Text className="text-white text-[10px] font-bold uppercase">
                    {community.privacy_mode ? "Private" : "Public"}
                  </Text>
                </View>
                <Text
                  className="text-black text-xl font-black uppercase leading-5 mb-1"
                  numberOfLines={1}
                >
                  {community.name}
                </Text>
                <Text
                  className="text-black/60 font-medium text-xs leading-4"
                  numberOfLines={2}
                >
                  {community.description || "No description provided."}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {!communitiesLoading && filteredCommunities.length === 0 && (
          <View className="items-center justify-center mt-10 p-8 border-4 border-dashed border-black/20">
            <Text className="text-black/40 font-black uppercase text-center text-xl">
              No communities found.
            </Text>
          </View>
        )}
      </ScrollView>
      <MobileNav />
    </View>
  );
}
