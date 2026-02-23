import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar, Ticket, XCircle } from "lucide-react-native";
import { useAuth } from "@/lib/authContext";
import { getMyEvents } from "@/lib/api";
import EventCard from "@/components/event-card";
import { NeoLoader } from "@/components/ui/neo-loader";

export default function MyEventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (user) fetchMyEvents();
  }, [user]);

  const fetchMyEvents = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await getMyEvents(user.id);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingEvents = events.filter(
    (ev) => !ev.start_at || new Date(ev.start_at) >= new Date()
  );

  const pastEvents = events.filter(
    (ev) => ev.start_at && new Date(ev.start_at) < new Date()
  );

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <View className="flex-1 bg-neo-bg">
      {/* Sticky Header & Tabs */}
      <View
         style={{ paddingTop: insets.top, zIndex: 50 }}
         className="absolute top-0 left-0 right-0 bg-neo-yellow"
      >
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center justify-between border-b-4 border-black bg-neo-yellow z-20">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-2xl font-black uppercase tracking-widest">My Events</Text>
          <View className="w-10" />
        </View>

        {/* Tabs */}
        <View className="flex-row border-b-4 border-black z-10 bg-white">
           <TouchableOpacity
             onPress={() => setActiveTab('upcoming')}
             className={`flex-1 p-4 items-center border-r-4 border-black ${activeTab === 'upcoming' ? 'bg-neo-red' : 'bg-white'}`}
           >
              <Text className={`font-black uppercase ${activeTab === 'upcoming' ? 'text-white' : 'text-black'}`}>Upcoming ({upcomingEvents.length})</Text>
           </TouchableOpacity>
           <TouchableOpacity
             onPress={() => setActiveTab('past')}
             className={`flex-1 p-4 items-center ${activeTab === 'past' ? 'bg-black' : 'bg-white'}`}
           >
              <Text className={`font-black uppercase ${activeTab === 'past' ? 'text-white' : 'text-black'}`}>Past ({pastEvents.length})</Text>
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView
         contentContainerStyle={{
           paddingTop: insets.top + 140, // Header + Tabs height
           paddingBottom: 40,
           paddingHorizontal: 16
         }}
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <NeoLoader />
            <Text className="font-black mt-4 uppercase animate-pulse">Loading tickets...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <View className="bg-neo-red border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] items-center">
               <XCircle size={48} color="white" className="mb-4" />
               <Text className="font-black text-white text-xl uppercase text-center mb-4">{error}</Text>
               <TouchableOpacity onPress={fetchMyEvents} className="bg-white border-4 border-black px-6 py-3">
                  <Text className="font-black uppercase">Try Again</Text>
               </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 p-4">
            {displayEvents.length === 0 ? (
              <View className="bg-white border-4 border-black p-8 items-center shadow-[8px_8px_0px_0px_#000] mt-8 rotate-1">
                <Ticket size={64} color="#000" strokeWidth={1} className="mb-4 opacity-20" />
                <Text className="font-black text-2xl uppercase text-center mb-2">No Events Found</Text>
                <Text className="font-bold text-gray-500 text-center uppercase text-sm">
                  {activeTab === 'upcoming' ? "You haven't joined any events yet." : "No past events to show."}
                </Text>
                {activeTab === 'upcoming' && (
                   <TouchableOpacity onPress={() => router.push('/explore')} className="mt-6 bg-neo-yellow border-4 border-black px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-y-1">
                      <Text className="font-black uppercase">Explore Events</Text>
                   </TouchableOpacity>
                )}
              </View>
            ) : (
              <View className="gap-6">
                {displayEvents.map((event) => (
                  <View key={event.id} className="relative">
                     {/* Using key to force re-render if needed */}
                     <EventCard event={event} onPress={() => router.push(`/events/${event.id}` as any)} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
