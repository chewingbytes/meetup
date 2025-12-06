import MobileNav from "@/components/mobile-nav";
import { useRouter } from "expo-router";
import {
  Clock,
  MapPin,
  Search,
  TrendingUp,
  Users,
  X
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

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

export default function ExploreScreen() {
  const router = useRouter();
  const screenSlideAnim = useRef(new Animated.Value(20)).current;
  const screenOpacityAnim = useRef(new Animated.Value(0)).current;
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [joined, setJoined] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(screenSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(screenOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const trendingTopics = [
    { name: "Study Groups", count: 42, emoji: "📚" },
    { name: "Running", count: 38, emoji: "🏃" },
    { name: "Thrifting", count: 29, emoji: "🛍️" },
    { name: "Gaming", count: 24, emoji: "🎮" },
    { name: "Food Adventures", count: 19, emoji: "🍜" },
  ];

  // Mock events at various locations on Singapore island (using pixel offsets)
  const locationEvents = [
    { id: 1, name: "Night Study", group: "Study Group", x: 70, y: 60, color: PALETTE.coral, emoji: "📚" },
    { id: 2, name: "Morning Run", group: "Running Club", x: 280, y: 80, color: "#FF6B6B", emoji: "🏃" },
    { id: 3, name: "Thrift Hunt", group: "Thrifting", x: 180, y: 140, color: "#FFD93D", emoji: "🛍️" },
    { id: 4, name: "Gaming Night", group: "Gaming Group", x: 240, y: 200, color: "#6BCB77", emoji: "🎮" },
    { id: 5, name: "Food Tour", group: "Food Lovers", x: 120, y: 260, color: "#FF9FF3", emoji: "🍜" },
    { id: 6, name: "Study Break", group: "Study Group - Night Owls", x: 280, y: 300, color: PALETTE.coral, emoji: "📚" },
    { id: 7, name: "Evening Gaming", group: "Gaming - Casual", x: 60, y: 200, color: "#6BCB77", emoji: "🎮" },
    { id: 8, name: "Coffee Meet", group: "Study Group - Cafe Crew", x: 200, y: 320, color: "#4D96FF", emoji: "☕" },
  ];

  const featuredCommunities = [
    {
      id: 1,
      name: "Late Night Study Crew",
      members: 456,
      category: "Study",
      image: "https://placehold.co/600x400",
      tagline: "Coffee, books, and good vibes ☕",
    },
    {
      id: 2,
      name: "Morning Run Squad",
      members: 342,
      category: "Sports",
      image: "https://placehold.co/600x400",
      tagline: "5AM starts hit different 🌅",
    },
    {
      id: 3,
      name: "Thrift Hunters SG",
      members: 278,
      category: "Lifestyle",
      image: "https://placehold.co/600x400",
      tagline: "Find hidden gems fr fr 💎",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Night Study Session",
      community: "Late Night Study Crew",
      time: "Tonight, 9PM",
      attendees: 12,
      image: "https://placehold.co/150x100",
      location: "NUS Central Library",
      isVideo: false,
    },
    {
      id: 2,
      title: "Sunrise Run @ ECP",
      community: "Morning Run Squad",
      time: "Tomorrow, 5:30AM",
      attendees: 8,
      image: "https://placehold.co/150x100",
      location: "East Coast Park",
      isVideo: false,
    },
    {
      id: 3,
      title: "Thrift Tour Bugis",
      community: "Thrift Hunters SG",
      time: "Sat, 2PM",
      attendees: 15,
      image: "https://placehold.co/150x100",
      location: "Bugis Street",
      isVideo: false,
    },
  ];

  const discoverCommunities = [
    {
      name: "NUS Computer Science Hub",
      members: 456,
      category: "Study",
      description: "Coding, projects, and late-night debugging sessions",
      avatar: "https://placehold.co/80x80",
      online: 23,
      images: [
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
      ],
    },
    {
      name: "Polytechnic Sports Network",
      members: 342,
      category: "Sports",
      description: "Connect with athletes across all poly schools",
      avatar: "https://placehold.co/80x80",
      online: 18,
      images: [
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
      ],
    },
    {
      name: "Singapore Art Students",
      members: 278,
      category: "Art",
      description: "Share your art, get feedback, find collab partners",
      avatar: "https://placehold.co/80x80",
      online: 12,
      images: [
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
        "https://placehold.co/80x80",
      ],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: PALETTE.lightGrey,
          transform: [{ translateX: screenSlideAnim }],
          opacity: screenOpacityAnim,
        }}
      >
        {/* Header */}
        <View
          style={{ 
            padding: 16, 
            borderBottomWidth: 1, 
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={PALETTE.graphite} />
          </TouchableOpacity> */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: PALETTE.graphite }}>Discover Events</Text>
            <View style={{ marginTop: 8, position: "relative" }}>
              <Search
                size={16}
                color="#9ca3af"
                style={{ position: "absolute", left: 12, top: 10 }}
              />
              <TextInput
                placeholder="Find events near you..."
                style={{
                  backgroundColor: "#808080",
                  borderRadius: 999,
                  paddingVertical: 6,
                  paddingLeft: 36,
                  paddingRight: 12,
                  fontSize: 12,
                }}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Trending Section */}
          <View style={{ padding: 16, borderBottomWidth: 1, borderColor: PALETTE.babyPink }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <TrendingUp size={20} color={PALETTE.coral} />
              <Text style={{ fontWeight: "bold", marginLeft: 8, fontSize: 16, color: PALETTE.graphite }}>
                Trending Now
              </Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {trendingTopics.map((topic) => (
                <TouchableOpacity
                  key={topic.name}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: PALETTE.babyPink,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: PALETTE.coral,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>{topic.emoji}</Text>
                  <Text style={{ fontWeight: "600", marginHorizontal: 6, color: PALETTE.graphite, fontSize: 12 }}>
                    {topic.name}
                  </Text>
                  <View style={{ backgroundColor: PALETTE.coral, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 }}>
                    <Text style={{ color: PALETTE.white, fontSize: 11, fontWeight: "700" }}>{topic.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Map Section */}
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: PALETTE.graphite, marginBottom: 12 }}>
              Events on the Island
            </Text>
            
            {/* Mock Island Map Background */}
            <View
              style={{
                width: "100%",
                height: 400,
                backgroundColor: "#E8F4F8",
                borderRadius: 16,
                borderWidth: 2,
                borderColor: PALETTE.babyPink,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Island shape (mock) */}
              <View
                style={{
                  position: "absolute",
                  width: "85%",
                  height: "75%",
                  backgroundColor: "#FFE0B2",
                  borderRadius: 40,
                  left: "7.5%",
                  top: "12.5%",
                  opacity: 0.5,
                }}
              />
              
              {/* Text overlay on map */}
              <View
                style={{
                  position: "absolute",
                  top: "45%",
                  left: "35%",
                  zIndex: 1,
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFD7E9", opacity: 0.3 }}>
                  Singapore Island
                </Text>
              </View>

              {/* Event Pins */}
              {locationEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => handlePinPress(event)}
                  style={{
                    position: "absolute",
                    left: event.x,
                    top: event.y,
                    zIndex: 10,
                  }}
                >
                  {/* Pin Marker */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: event.color,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 3,
                      borderColor: PALETTE.white,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{event.emoji}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Legend */}
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: PALETTE.graphite, marginBottom: 8 }}>
                Tap any pin to view event details
              </Text>
            </View>
          </View>

          {/* Events List */}
          <View style={{ padding: 16, borderTopWidth: 1, borderColor: PALETTE.babyPink }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: PALETTE.graphite, marginBottom: 12 }}>
              Happening Now
            </Text>
            
            {locationEvents.slice(0, 5).map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => handlePinPress(event)}
                style={{
                  backgroundColor: PALETTE.white,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: PALETTE.babyPink,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: event.color,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{event.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", color: PALETTE.graphite, fontSize: 14 }}>
                    {event.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {event.group}
                  </Text>
                </View>
                <MapPin size={16} color={PALETTE.coral} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* EVENT DETAILS MODAL */}
        <Modal
          transparent
          visible={!!selectedEvent}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: PALETTE.white,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 20,
                paddingBottom: 40,
                maxHeight: "75%",
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: PALETTE.graphite,
                  }}
                >
                  Event Details
                </Text>
                <TouchableOpacity onPress={closeModal} style={{ padding: 8 }}>
                  <X size={24} color={PALETTE.graphite} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: "100%" }} showsVerticalScrollIndicator={false}>
                {/* Event Badge and Name */}
                <View
                  style={{
                    backgroundColor: selectedEvent?.color,
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 48, marginBottom: 8 }}>
                    {selectedEvent?.emoji}
                  </Text>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: PALETTE.white,
                      textAlign: "center",
                    }}
                  >
                    {selectedEvent?.name}
                  </Text>
                </View>

                {/* Group Info */}
                <View
                  style={{
                    backgroundColor: PALETTE.babyPink,
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                    Community Group
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: PALETTE.graphite,
                    }}
                  >
                    {selectedEvent?.group}
                  </Text>
                </View>

                {/* Event Details Grid */}
                <View style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 12,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: PALETTE.lightGrey,
                        padding: 10,
                        borderRadius: 10,
                        marginRight: 12,
                      }}
                    >
                      <Clock size={20} color={PALETTE.coral} />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        Time
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: PALETTE.graphite,
                        }}
                      >
                        Today at 7:00 PM
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 12,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: PALETTE.lightGrey,
                        padding: 10,
                        borderRadius: 10,
                        marginRight: 12,
                      }}
                    >
                      <MapPin size={20} color={PALETTE.coral} />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        Location
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: PALETTE.graphite,
                        }}
                      >
                        Central Business District
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: PALETTE.lightGrey,
                        padding: 10,
                        borderRadius: 10,
                        marginRight: 12,
                      }}
                    >
                      <Users size={20} color={PALETTE.coral} />
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginBottom: 2,
                        }}
                      >
                        Attendees
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: PALETTE.graphite,
                        }}
                      >
                        {12 + (joined[selectedEvent?.id] ? 1 : 0)} people going
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View
                  style={{
                    backgroundColor: PALETTE.lightGrey,
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginBottom: 6,
                    }}
                  >
                    About
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: PALETTE.graphite,
                      lineHeight: 20,
                    }}
                  >
                    Join us for an amazing meetup with like-minded people from the{" "}
                    {selectedEvent?.group} community. Great way to network, share
                    experiences, and make new friends!
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={closeModal}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: PALETTE.babyPink,
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: PALETTE.coral,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: PALETTE.coral,
                        fontSize: 14,
                      }}
                    >
                      Close
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleJoinEvent}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: joined[selectedEvent?.id]
                        ? PALETTE.babyPink
                        : PALETTE.coral,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: "700",
                        color: joined[selectedEvent?.id]
                          ? PALETTE.coral
                          : PALETTE.white,
                        fontSize: 14,
                      }}
                    >
                      {joined[selectedEvent?.id] ? "Joined ✓" : "Join Event"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <MobileNav active="explore" />
      </Animated.View>
    </SafeAreaView>
  );
}
