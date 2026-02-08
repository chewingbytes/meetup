import React from "react";
import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { sampleEvents } from "@/data/event";
import { usersCommunities } from "@/data/communities";
import { BlurView } from "expo-blur";

export default function MapScreen() {
  const router = useRouter();

  const allLocations = [
    ...sampleEvents.map((event) => ({
      id: event.id,
      title: event.title,
      image: event.image,
      location: event.location,
      type: "event" as const,
    })),
    ...usersCommunities.map((community) => ({
      id: community.id,
      title: community.name,
      image: community.profileImage,
      topic: community.topics,
      type: "community" as const,
    })),
  ];

  const handleLocationPress = (location: (typeof allLocations)[0]) => {
    if (location.type === "event") {
      router.push(`/events/${location.id}` as any);
    } else {
      router.push(`/community/${location.id}` as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      <SafeAreaView style={{ flex: 1 }}>
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
            <Text className="text-white text-[30px] font-semibold ml-4">
              Map
            </Text>
          </View>
        </BlurView>

        {/* Map Placeholder */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#1a1a1a",
            margin: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 16,
            }}
          >
            🗺️ Interactive Map
          </Text>
          <Text
            style={{
              color: "#888",
              fontSize: 16,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            Map functionality coming soon!{"\n"}Browse all locations below.
          </Text>
        </View>

        {/* Locations List */}
        <View style={{ flex: 2 }}>
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "600",
              padding: 16,
              paddingBottom: 8,
            }}
          >
            All Locations ({allLocations.length})
          </Text>

          <ScrollView style={{ paddingHorizontal: 16 }}>
            {allLocations.map((location) => (
              <TouchableOpacity
                key={`${location.type}-${location.id}`}
                onPress={() => handleLocationPress(location)}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor:
                      location.type === "event" ? "#3b82f6" : "#10b981",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <MapPin color="white" size={24} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "white",
                      fontSize: 16,
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {location.title}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <MapPin color="#888" size={14} />
                    <Text
                      style={{
                        color: "#888",
                        fontSize: 14,
                        marginLeft: 4,
                      }}
                    >
                      {location.location}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: location.type === "event" ? "#3b82f6" : "#10b981",
                      fontSize: 12,
                      fontWeight: "500",
                      textTransform: "uppercase",
                    }}
                  >
                    {location.type}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}
