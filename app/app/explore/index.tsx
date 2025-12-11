import EventCard from "@/components/event-card";
import HorizontalCarousel from "@/components/horizontal-carousel";
import MobileNav from "@/components/mobile-nav";
import BrowseByCommunity from "@/components/browse-by-category";
import ImageCard from "@/components/image-card";
import SingleRowCarousel from "@/components/horizontal-single-carousel";

import Header from "@/components/header";
import { useRouter } from "expo-router";
import {
  Clock,
  Map,
  MapPin,
  Search,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { sampleEvents } from "@/data/event";
import { usersCommunities } from "@/data/communities";

import chunkArray from "@/scripts/chunkArray";

const PALETTE = {
  background: "#000000",
};

export default function ExploreScreen() {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [joined, setJoined] = useState<{ [key: number]: boolean }>({});

  const eventChunks = chunkArray(sampleEvents, 3);

  const goBack = () => {
    router.back();
  };

  const handlePinPress = (event: any) => {
    setSelectedEvent(event);
  };

  const handleJoinEvent = () => {
    if (selectedEvent) {
      setJoined({ ...joined, [selectedEvent.id]: !joined[selectedEvent.id] });
    }
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      edges={["top"]}
    >
      <Header
        title="Explore"
        actions={[
          {
            icon: Map,
            onPress: () => console.log("Drawer opened"),
          },
          {
            icon: Search,
            onPress: () => console.log("Drawer opened"),
          },
        ]}
      />
      <ScrollView>
        <View className="container">
          <HorizontalCarousel
            heading="Popular Events"
            chunks={eventChunks}
            cardComponent={EventCard}
            dataKey="event"
          />
          <BrowseByCommunity />
          <SingleRowCarousel
            heading="Locations"
            data={usersCommunities}
            cardComponent={ImageCard}
            dataKey="community"
          />
        </View>
      </ScrollView>
      <MobileNav active="explore" />
    </SafeAreaView>
  );
}
