import EventCard from "@/components/event-card";
import HorizontalCarousel from "@/components/horizontal-carousel";
import MobileNav from "@/components/mobile-nav";
import BrowseByCommunity from "@/components/browse-by-category";
import ImageCard from "@/components/image-card";
import SingleRowCarousel from "@/components/horizontal-single-carousel";
import Header from "@/components/header";
import { PullToRefresh } from "@/components/pull-to-refresh";

import { useRouter } from "expo-router";
import {
  Map,
  Search,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventProps, CommunityProps } from "@/utils/types";
import chunkArray from "@/scripts/chunkArray";
import { useEvents } from "@/hooks/useEvents";
import { useCommunities } from "@/hooks/useCommunities";

const PALETTE = {
  background: "#000000",
};

export default function ExploreScreen() {
  const router = useRouter();

  // Use Zustand stores with custom hooks
  const { events, isLoading: eventsLoading, isRefreshing: eventsRefreshing, refresh: refreshEvents } = useEvents();
  const { communities, isLoading: communitiesLoading, isRefreshing: communitiesRefreshing, refresh: refreshCommunities } = useCommunities();

  const isLoading = eventsLoading || communitiesLoading;
  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  // Sort events by capacity (popularity)
  const popularEvents = [...events].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
  const popularEventChunks = chunkArray(popularEvents, 3);

  // Group events by location
  const eventsByLocation = events.reduce((acc, event) => {
    const location = event.location_text || "Unknown Location";
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(event);
    return acc;
  }, {} as Record<string, EventProps[]>);

  // Get unique locations for carousel
  const locationEvents = Object.values(eventsByLocation).flat().slice(0, 10);

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
            onPress: () => router.push("/map" as any),
          },
          {
            icon: Search,
            onPress: () => console.log("Search pressed"),
          },
        ]}
      />
      <ScrollView
        refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View className="container">
          {/* Popular Events - sorted by capacity */}
          <HorizontalCarousel<EventProps>
            heading="Popular Events"
            chunks={popularEventChunks}
            cardComponent={EventCard}
            dataKey="event"
            onItemPress={(event) => router.push(`/events/${event.id}` as any)}
          />

          {/* Browse by Community */}
          <BrowseByCommunity communities={communities} />

          {/* By Locations */}
          <SingleRowCarousel<EventProps>
            heading="By Locations"
            data={locationEvents}
            cardComponent={ImageCard}
            dataKey="card"
            onItemPress={(event) => router.push(`/events/${event.id}` as any)}
          />
        </View>
      </ScrollView>
      <MobileNav active="explore" />
    </SafeAreaView>
  );
}
