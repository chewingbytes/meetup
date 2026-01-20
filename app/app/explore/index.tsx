import EventCard from "@/components/event-card";
import HorizontalCarousel from "@/components/horizontal-carousel";
import MobileNav from "@/components/mobile-nav";
import BrowseByCommunity from "@/components/browse-by-category";
import ImageCard from "@/components/image-card";
import SingleRowCarousel from "@/components/horizontal-single-carousel";
import Header from "@/components/header";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { useAuthRedirect } from "@/lib/useAuthRedirect";

import { useRouter } from "expo-router";
import { Map, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EventProps, CommunityProps } from "@/utils/types";
import chunkArray from "@/scripts/chunkArray";
import { useEvents } from "@/hooks/useEvents";
import { useCommunities } from "@/hooks/useCommunities";

import {
  SkeletonCarousel,
  SkeletonVerticalList,
} from "@/components/skeleton-loader";
import { useAuth } from "@/lib/authContext";

const PALETTE = {
  background: "#000000",
};

export default function ExploreScreen() {
  const router = useRouter();

  const { user, isCheckingAuth } = useAuthRedirect("/");

  const {
    events,
    isLoading: eventsLoading,
    isRefreshing: eventsRefreshing,
    refresh: refreshEvents,
  } = useEvents();
  const {
    communities,
    isLoading: communitiesLoading,
    isRefreshing: communitiesRefreshing,
    refresh: refreshCommunities,
  } = useCommunities();

  const shouldShowSkeleton =
    (eventsLoading || communitiesLoading) && !isCheckingAuth;
  const isRefreshing = eventsRefreshing || communitiesRefreshing;

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await Promise.all([refreshEvents(), refreshCommunities()]);
  };

  // Sort events by capacity (popularity)
  const popularEvents = [...events].sort(
    (a, b) => (b.capacity || 0) - (a.capacity || 0)
  );
  const popularEventChunks = chunkArray(popularEvents, 3);

  // Group events by location
  const eventsByLocation = events.reduce(
    (acc, event) => {
      const location = event.location_text || "Unknown Location";
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(event);
      return acc;
    },
    {} as Record<string, EventProps[]>
  );

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
        refreshControl={
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {shouldShowSkeleton ? (
          <>
            <SkeletonCarousel />
            <SkeletonVerticalList />
          </>
        ) : (
          <View className="container">
            <HorizontalCarousel<EventProps>
              heading="Popular Events"
              chunks={popularEventChunks}
              cardComponent={EventCard}
              dataKey="event"
              onItemPress={(event) => router.push(`/events/${event.id}` as any)}
            />

            <BrowseByCommunity communities={communities} />

            <SingleRowCarousel<EventProps>
              heading="By Locations"
              data={locationEvents}
              cardComponent={ImageCard}
              dataKey="card"
              onItemPress={(event) => router.push(`/events/${event.id}` as any)}
            />
          </View>
        )}
      </ScrollView>
      <MobileNav active="explore" />
    </SafeAreaView>
  );
}
