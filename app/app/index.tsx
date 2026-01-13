import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";

import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";

import { Plus, Bell, User } from "lucide-react-native";

import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// import { sampleEvents } from "@/data/event";
// import { usersCommunities } from "@/data/communities";
import { EventProps, CommunityProps } from "@/utils/types";

import chunkArray from "@/scripts/chunkArray";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const PALETTE = {
  background: "#000000",
};

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const router = useRouter();

  const openChat = (groupId: string, groupName: string) => {
    router.push(`/chat/${groupId}?name=${groupName}` as any);
  };

  // const eventChunks = chunkArray(sampleEvents, 3);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [ev, comm] = await Promise.all([
          api.getEvents().catch(() => null),
          api.getCommunities().catch(() => null),
        ]);
        if (!mounted) return;
        if (ev && Array.isArray(ev)) setEvents(ev);
        if (comm && Array.isArray(comm)) setCommunities(comm);
      } catch (err) {
        console.warn("Home load failed", err);
      } finally {
        if (mounted) setLoadingHome(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {}, [events, communities]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      edges={["top"]}
    >
      <Header
        title="Welcome"
        actions={[
          {
            icon: Plus,
            onPress: () => {
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                setMenuOpen(true);
              }
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
      )}

      <ScrollView>
        {/* <View
          style={{
            padding: 18,
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Home
          </Text>
        </View> */}

        <View className="container">
          {/* Your Events */}
          <HorizontalCarousel<EventProps>
            heading="Your Events"
            chunks={chunkArray(events, 3)}
            cardComponent={EventCard}
            dataKey="event"
            onItemPress={(event) => router.push(`/events/${event.id}` as any)}
          />

          {/* Your Communities */}
          <VerticalList<CommunityProps>
            heading="Your Communities"
            items={communities}
            cardComponent={CommunityCard}
            dataKey="community"
            onItemPress={(community) => {
              console.log("community id:", community.id)
              router.push(`/community/${community.id}` as any);
            }}
          />
          {/* <VerticalList
            heading="Your Communities"
            items={sampleEvents}
            cardComponent={EventCard}
            dataKey="event"
          /> */}
        </View>
      </ScrollView>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}
