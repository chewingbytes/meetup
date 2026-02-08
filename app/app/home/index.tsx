import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";
import {
  SkeletonCarousel,
  SkeletonVerticalList,
} from "@/components/skeleton-loader";

import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";
import { PullToRefresh } from "@/components/pull-to-refresh";

import { Plus, Bell, User } from "lucide-react-native";

import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView as RNSafeAreaView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CommunitySidebar from "@/components/community-sidebar";
import CommunityContent from "@/components/community-content";

import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { useCommunities } from "@/hooks/useCommunities";
import { useState, useEffect } from "react";
import { CommunityProps } from "@/utils/types";

const PALETTE = {
  background: "#09090b",
};

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isCheckingAuth } = useAuthRedirect("/");

  const {
    communities,
    isLoading: communitiesLoading,
    isRefreshing: communitiesRefreshing,
    refresh: refreshCommunities,
  } = useCommunities();

  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityProps | null>(null);

  useEffect(() => {
    if (communities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(communities[0]);
    }
  }, [communities]);

  const handleRefresh = async () => {
    await Promise.all([refreshCommunities()]);
  };

  const shouldShowSkeleton = communitiesLoading && !isCheckingAuth;

  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: PALETTE.background }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ color: "#fff", marginTop: 12 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
      edges={["top"]}
    >
      {/* <Header
        title="Welcome"
        actions={[
          {
            icon: Plus,
            onPress: () => {
              setMenuOpen(!menuOpen);
            },
          },
          { icon: Bell, link: "/notifications" },
        ]}
      />

      {menuOpen && (
        <View
          style={{
            position: "absolute",
            top: 90,
            right: 20,
            backgroundColor: "#111",
            borderRadius: 12,
            paddingVertical: 8,
            zIndex: 1000,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <TouchableOpacity
            style={{ padding: 12 }}
            onPress={() => {
              setMenuOpen(false);
              router.push("/create-community");
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>
              Create community
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 12 }}
            onPress={() => {
              setMenuOpen(false);
              router.push("/create-event");
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>Create event</Text>
          </TouchableOpacity>
        </View>
      )} */}

      <View
        style={{
          flex: 1,
          marginBottom: 75,
          flexDirection: "row",
        }}
      >
        {shouldShowSkeleton ? (
          <View style={{ flex: 1 }}>
            <SkeletonCarousel />
            <SkeletonVerticalList />
          </View>
        ) : (
          <>
            {/* Left Sidebar */}
            <CommunitySidebar
              communities={communities}
              selectedCommunityId={selectedCommunity?.id || null}
              onSelectCommunity={setSelectedCommunity}
              onAddCommunity={() => {
                console.log("➕ Add community pressed");
                router.push("/browse-communities");
              }}
            />

            {/* Main Content */}
            <View style={{ flex: 1 }}>
              {communitiesLoading && !selectedCommunity ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <ActivityIndicator size="large" color="#4f46e5" />
                  <Text style={{ color: "#fff", marginTop: 12 }}>
                    Loading community...
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
    </SafeAreaView>
  );
}
