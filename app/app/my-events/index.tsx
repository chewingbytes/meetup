import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Calendar } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileNav from "@/components/mobile-nav";
import EventCard from "@/components/event-card";
import { useAuth } from "@/lib/authContext";
import { getMyEvents } from "@/lib/api";
import { EventProps } from "@/utils/types";

export default function MyEventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const fetchMyEvents = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await getMyEvents(user.id);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch events");
      console.error("❌ Error fetching my events:", err);
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

  return (
    <LinearGradient colors={["#000000", "#1a1a1a"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Events</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.loadingText}>Loading your events...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMyEvents}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Upcoming Events */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Calendar size={20} color="#4f46e5" />
                <Text style={styles.sectionTitle}>
                  Upcoming ({upcomingEvents.length})
                </Text>
              </View>
              
              {upcomingEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No upcoming events</Text>
                  <Text style={styles.emptySubtext}>
                    Join or create events to see them here
                  </Text>
                </View>
              ) : (
                upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                ))
              )}
            </View>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={20} color="#666" />
                  <Text style={[styles.sectionTitle, { color: "#999" }]}>
                    Past Events ({pastEvents.length})
                  </Text>
                </View>
                
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/events/${event.id}` as any)}
                  />
                ))}
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        <MobileNav active="profile" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyState: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
});
