import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Calendar,
    ChevronDown,
    ChevronUp,
    MapPin,
    Users,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import * as api from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { EventAttendee, EventProps } from "@/utils/types";

export default function HostDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, userProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventProps[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<{
    [key: string]: { attendees?: EventAttendee[] } & EventProps;
  }>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchHostedEvents();
    }
  }, [session]);

  const fetchHostedEvents = async () => {
    try {
      setLoading(true);
      if (!session?.user?.id) return;

      const myEvents = await api.getMyEvents(session.user.id);

      // Filter events where I am the organizer
      const hosted = myEvents.filter(
        (e: EventProps) => e.organizer_id === session?.user?.id,
      );
      setEvents(hosted);
    } catch (e: any) {
      console.error("Failed to fetch events:", e);
      Alert.alert("Error", "Could not load your hosted hangouts.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpandEvent = async (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      return;
    }

    setExpandedEventId(eventId);

    // Fetch details if not already loaded
    if (!eventDetails[eventId]) {
      try {
        setLoadingDetails(eventId);
        const details = await api.getEvent(eventId);
        setEventDetails((prev) => ({
          ...prev,
          [eventId]: details,
        }));
      } catch (e) {
        console.error("Failed to load details", e);
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  useEffect(() => {
    console.log(
      "Hangout details updated:",
      JSON.stringify(eventDetails, null, 2),
    );
  }, [events]);

  const renderStatusBadge = (status: string) => {
    let bg = "bg-gray-200";
    let text = "text-gray-800";

    switch (status) {
      case "approved":
        bg = "bg-green-200";
        text = "text-green-800";
        break;
      case "requested":
        bg = "bg-yellow-200";
        text = "text-yellow-800";
        break;
      case "rejected":
        bg = "bg-red-200";
        text = "text-red-800";
        break;
    }

    return (
      <View className={`px-2 py-1 ${bg} border border-black rounded-sm`}>
        <Text className={`text-xs font-bold uppercase ${text}`}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={28} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-3xl font-black uppercase tracking-tighter flex-1">
            Host Dashboard
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
      >
        <Text className="text-xl font-black uppercase mb-4">Your Events</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#000" />
        ) : events.length === 0 ? (
          <View className="bg-white border-2 border-black p-6 items-center">
            <Text className="text-lg font-bold uppercase text-gray-500 text-center">
              You haven't hosted any events yet.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/host")}
              className="mt-4 bg-neo-blue border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              <Text className="font-black text-white uppercase">
                Create Event
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => {
            const isExpanded = expandedEventId === event.id;
            const details = eventDetails[event.id];
            // Safe access attendees
            const attendees = details?.participants || [];
            const hasAttendees =
              Array.isArray(attendees) && attendees.length > 0;

            return (
              <View
                key={event.id}
                className="mb-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000]"
              >
                {/* Event Card Header */}
                <TouchableOpacity
                  onPress={() => handleExpandEvent(event.id)}
                  className="p-4 bg-white"
                  activeOpacity={1}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-xl font-black uppercase flex-1 mr-2">
                      {event.name}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={24} color="#000" />
                    ) : (
                      <ChevronDown size={24} color="#000" />
                    )}
                  </View>

                  <View className="flex-row items-center gap-2 mb-1">
                    <Calendar size={16} color="#666" />
                    <Text className="font-bold text-gray-600 text-xs">
                      {new Date(event.start_at).toLocaleDateString()} •{" "}
                      {new Date(event.start_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <MapPin size={16} color="#666" />
                    <Text
                      className="font-bold text-gray-600 text-xs"
                      numberOfLines={1}
                    >
                      {event.location_text || "No location set"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Expanded Details (Participants) */}
                {isExpanded && (
                  <View className="border-t-4 border-black bg-neo-bg p-4">
                    <View className="flex-row items-center gap-2 mb-4">
                      <Users size={20} color="#000" />
                      <Text className="font-black text-lg uppercase">
                        Participants
                      </Text>
                    </View>

                    {loadingDetails === event.id ? (
                      <ActivityIndicator color="#000" />
                    ) : !hasAttendees ? (
                      <Text className="font-bold text-gray-500 italic">
                        No participants yet.
                      </Text>
                    ) : (
                      <View>
                        {/* Header Row */}
                        <View className="flex-row border-b-2 border-black pb-2 mb-2">
                          <Text className="text-xs font-black uppercase w-1/2">
                            User
                          </Text>
                          <Text className="text-xs font-black uppercase flex-1">
                            Status
                          </Text>
                        </View>
                        {/* Attendees List */}
                        {(attendees as any[]).map((p: any, idx) => {
                          console.log("Attendee:", p);
                          return (
                            <View
                              key={p.id || idx}
                              className="flex-row items-center py-2 border-b border-dashed border-gray-400"
                            >
                              <TouchableOpacity
                                key={p.id}
                                onPress={() =>
                                  router.push(`/profile/${p.id}` as any)
                                }
                              >
                                <View className="w-1/2 flex-row items-center gap-2 pr-2">
                                  {p.avatar_url ? (
                                    <Image
                                      source={{ uri: p.avatar_url }}
                                      className="w-6 h-6 rounded-full border border-black"
                                    />
                                  ) : (
                                    <View className="w-6 h-6 bg-gray-300 rounded-full border border-black" />
                                  )}
                                  <Text
                                    className="font-bold text-sm"
                                    numberOfLines={1}
                                  >
                                    {p.username || "User"}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                              <View className="flex-1">
                                <Text className="font-black text-xs uppercase text-green-700">
                                  Joined
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <View className="mt-4 pt-4 border-t-2 border-black flex-row justify-end">
                      <TouchableOpacity
                        className="bg-neo-blue border-2 border-black px-3 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1 active:shadow-none"
                        onPress={() =>
                          router.push(`/host/event/${event.id}` as any)
                        }
                      >
                        <Text className="font-bold text-white text-xs uppercase">
                          Edit Event
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
