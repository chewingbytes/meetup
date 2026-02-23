import MobileNav from "@/components/mobile-nav";

import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CommunityContent from "@/components/community-content";
import CommunitySidebar from "@/components/community-sidebar";

import { NeoLoader } from "@/components/ui/neo-loader";
import { useCommunities } from "@/hooks/useCommunities";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { CommunityProps } from "@/utils/types";
import { useEffect, useState } from "react";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isCheckingAuth } = useAuthRedirect("/");

  const {
    communities,
    isLoading: communitiesLoading,
    refresh: refreshCommunities,
  } = useCommunities();

  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityProps | null>(null);

  useEffect(() => {
    if (communities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(communities[0]);
    }
    if (communities.length === 0 && selectedCommunity) {
      setSelectedCommunity(null);
    }
  }, [communities]);

  const shouldShowSkeleton = communitiesLoading && !isCheckingAuth;
  const noCommunities = !communitiesLoading && communities.length === 0;

  if (isCheckingAuth) {
    return (
      <View className="flex-1 items-center justify-center">
        <NeoLoader />
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFFDF5", paddingTop: insets.top }}
    >
      <View style={{ flex: 1, flexDirection: "row", marginBottom: 75 }}>
        {shouldShowSkeleton ? (
          <View className="flex-1 items-center justify-center">
            <NeoLoader />
          </View>
        ) : noCommunities ? (
          <View className="flex-1 items-center justify-center px-4 bg-neo-bg">
            <View className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0px_0px_#000] rotate-2 max-w-sm w-full items-center">
              <View className="bg-black px-4 py-2 -rotate-3 mb-6 shadow-[4px_4px_0px_0px_#FF6B6B]">
                <Text className="text-white font-black text-xs uppercase tracking-widest">
                  System Status: Lonely
                </Text>
              </View>

              <Text className="text-4xl font-black uppercase text-center leading-[0.9] mb-4 pt-1">
                No Squad{"\n"}
                <Text className="text-[#FF6B6B]">Found</Text>
              </Text>

              <Text className="font-bold text-black/60 text-center uppercase mb-8 leading-5">
                Your feed is looking drier than a desert 🌵. Join a community to
                start the chaos.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/browse-communities")}
                activeOpacity={0.8}
                className="w-full bg-[#FFD93D] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none flex-row items-center justify-center gap-2"
              >
                <Text className="font-black text-xl uppercase tracking-wider text-black">
                  Start Browsing
                </Text>
              </TouchableOpacity>
            </View>

            {/* Decorative background elements */}
            <View className="absolute top-10 left-10 w-16 h-16 bg-[#C4B5FD] border-[3px] border-black -z-10 -rotate-12" />
            <View className="absolute bottom-20 right-10 w-24 h-24 bg-[#FF6B6B] border-[3px] border-black rounded-full -z-10" />
            <View className="absolute top-1/2 -right-4 w-8 h-8 bg-black -z-10 rotate-45" />
          </View>
        ) : (
          <>
            {/* Left Sidebar */}
            <CommunitySidebar
              communities={communities}
              selectedCommunityId={selectedCommunity?.id || null}
              onSelectCommunity={setSelectedCommunity}
              onAddCommunity={() => {
                router.push("/browse-communities");
              }}
            />

            {/* Main Content */}
            <View style={{ flex: 1 }}>
              {communitiesLoading && !selectedCommunity ? (
                <View className="flex-1 items-center justify-center bg-neo-bg">
                  <NeoLoader />
                  <Text className="text-black font-black uppercase mt-4">
                    Loading Crew...
                  </Text>
                </View>
              ) : (
                <CommunityContent community={selectedCommunity} />
              )}
            </View>
          </>
        )}
      </View>

      {/* Mobile Nav - Fixed at Bottom */}
      <MobileNav active="home" />
    </View>
  );
}
