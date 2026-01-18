import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
} from "lucide-react-native";
import { sampleEvents } from "@/data/event";
// import ImageColors from 'react-native-image-colors';
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { useEventStore } from "@/lib/stores/eventStore";

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gradientColors, setGradientColors] = useState(["#000000", "#333333"]);

  // Use Zustand store to fetch event
  const { eventDetails, fetchEventById } = useEventStore();
  const event = id ? eventDetails[id as string] : null;

  // Try to fetch from API if not in cache
  useEffect(() => {
    if (!event && id) {
      fetchEventById(id as string);
    }
  }, [id, event, fetchEventById]);

  // Fallback to sample events if API event not found
  const displayEvent = event || sampleEvents.find((e) => e.id === id);

  useEffect(() => {
    if (displayEvent) {
      // Static gradients based on interest
      const gradients: { [key: string]: string[] } = {
        "Study Group": ["#1a1a2e", "#16213e", "#0f3460"],
        "Sports Buddies": ["#2d3436", "#636e72", "#b2bec3"],
        "Tech & Coding": ["#0c0c0c", "#1a1a1a", "#2d2d2d"],
        "Thrift Enthusiasts": ["#6c5ce7", "#a29bfe", "#d63031"],
        "Fitness Enthusiasts": ["#00b894", "#00cec9", "#55a3ff"],
      };
      const interest = (displayEvent as any).interest || displayEvent.name;
      setGradientColors(
        gradients[interest as keyof typeof gradients] || [
          "#000000",
          "#333333",
        ]
      );
    }
  }, [displayEvent]);

  if (!displayEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView stickyHeaderIndices={[0]}>
          <BlurView
            intensity={50}
            tint="default"
            style={{
              paddingBottom: 24,
            }}
          >
            {/* Header with back button */}
            <View className="flex-row items-center px-5 py-4">
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold ml-4">
                Event Details
              </Text>
            </View>
          </BlurView>

          {/* Hero Image */}
          <View className="px-5 mb-6">
              <Image
                source={{ uri: (displayEvent as any).image }}
                className="w-full h-64 rounded-xl"
                resizeMode="cover"
              />
          </View>

          {/* Content */}
          <View className="px-5">
            {/* Title */}
            <Text className="text-white text-3xl font-bold mb-2">
              {(displayEvent as any).title || displayEvent.name}
            </Text>

            {/* Interest */}
            <Text className="text-white/70 text-lg mb-4">{(displayEvent as any).interest}</Text>

            {/* CTA Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg items-center">
                <Text className="text-white font-semibold">Join Event</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-white/10 py-3 rounded-lg items-center">
                <Heart color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View className="gap-y-4">
              {/* Location */}
              <View className="flex-row items-center">
                <MapPin color="white" size={20} />
                <Text className="text-white ml-3">{(displayEvent as any).location || displayEvent.location_text}</Text>
              </View>

              {/* Date & Time */}
              <View className="flex-row items-center">
                <Calendar color="white" size={20} />
                <Text className="text-white ml-3">
                  {(displayEvent as any).date} at {(displayEvent as any).time}
                </Text>
              </View>

              {/* Attendees */}
              <View className="flex-row items-center">
                <Users color="white" size={20} />
                <Text className="text-white ml-3">25 attending</Text>
              </View>
            </View>

            {/* About Event */}
            <View className="mt-8">
              <Text className="text-white text-2xl font-semibold mb-3">
                About Event
              </Text>
              <Text className="text-white/80 text-base leading-6">
                {(displayEvent as any).description || displayEvent.description_md}
              </Text>
            </View>

            {/* Event Details */}
            <View className="mt-8">
              <Text className="text-white text-2xl font-semibold mb-3">
                Event Details
              </Text>
              <Text className="text-white/80 text-base leading-6">
                {(displayEvent as any).details}
              </Text>
            </View>

            {/* Host */}
            <View className="mt-8">
              <Text className="text-white text-2xl font-semibold mb-3">
                Host
              </Text>
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-gray-600 rounded-full mr-3"></View>
                <View>
                  <Text className="text-white font-semibold">{event.host}</Text>
                  <Text className="text-white/60">Event Organizer</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
