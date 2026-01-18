import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
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
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { useEventStore } from "@/lib/stores/eventStore";

interface Event {
  id: string;
  name: string;
  description_md?: string;
  cover_image?: string;
  start_at: string;
  end_at: string;
  location_text?: string;
  location_instructions?: string;
  is_paid?: boolean;
  price?: number;
  capacity?: number;
  require_approval?: boolean;
  visibility?: string;
  organizer_id?: string;
}

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [gradientColors, setGradientColors] = useState(["#000000", "#333333"]);

  // Use Zustand store to fetch event
  const { eventDetails, fetchEventById } = useEventStore();
  const event = id ? eventDetails[id as string] : null;
  const [loading, setLoading] = useState(!event);
  const [error, setError] = useState<string | null>(null);

  // Fetch event data from store on mount
  useEffect(() => {
    let mounted = true;

    async function loadEvent() {
      try {
        if (!id) {
          setError("No event ID provided");
          setLoading(false);
          return;
        }

        console.log("📡 Fetching event with ID:", id);
        const data = await fetchEventById(id as string);
        
        if (!mounted) return;
        
        if (data) {
          console.log("✅ Event loaded:", data);
          // Set gradient based on event name or default
          setGradientColors(["#0c0c0c", "#1a1a1a", "#2d2d2d"]);
        } else {
          setError("Failed to load event");
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("❌ Failed to load event:", err);
        setError(err.message || "Failed to load event");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [id, fetchEventById]);

  const handleJoinEvent = async () => {
    try {
      setJoined(true);
      // TODO: Call API to join event
      console.log("🎉 Joined event:", event?.id);
    } catch (err) {
      console.error("Failed to join event:", err);
      setJoined(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <LinearGradient colors={["#000000", "#333333"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading event...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <LinearGradient colors={["#000000", "#333333"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event Details</Text>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              {error || "Event not found"}
            </Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Parse dates
  const startDate = new Date(event.start_at);
  const endDate = new Date(event.end_at);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
          <BlurView intensity={50} tint="default" style={styles.blurHeader}>
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Event Details</Text>
              <View style={{ width: 24 }} />
            </View>
          </BlurView>

          {/* Hero Image */}
          <View style={styles.imageContainer}>
            {event.cover_image ? (
              <Image
                source={{ uri: event.cover_image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.placeholderImage]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>{event.name}</Text>

            {/* CTA Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.joinButton,
                  joined && styles.joinedButton
                ]}
                onPress={handleJoinEvent}
              >
                <Text style={styles.joinButtonText}>
                  {joined ? "✓ Joined" : "Join Event"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
              {/* Date & Time */}
              <View style={styles.detailRow}>
                <Calendar color="white" size={20} />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {formattedDate} at {formattedTime}
                  </Text>
                </View>
              </View>

              {/* Location */}
              {event.location_text && (
                <View style={styles.detailRow}>
                  <MapPin color="white" size={20} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{event.location_text}</Text>
                    {event.location_instructions && (
                      <Text style={styles.detailSubtext}>
                        {event.location_instructions}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Capacity */}
              {event.capacity && (
                <View style={styles.detailRow}>
                  <Users color="white" size={20} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Capacity</Text>
                    <Text style={styles.detailValue}>
                      {event.capacity} attendees max
                    </Text>
                  </View>
                </View>
              )}

              {/* Price */}
              {event.is_paid && (
                <View style={styles.detailRow}>
                  <Text style={styles.priceLabel}>$</Text>
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Cost</Text>
                    <Text style={styles.detailValue}>
                      SGD ${event.price?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* About Event */}
            {event.description_md && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About Event</Text>
                <Text style={styles.descriptionText}>
                  {event.description_md}
                </Text>
              </View>
            )}

            {/* Approval Notice */}
            {event.require_approval && (
              <View style={styles.approvalNotice}>
                <Text style={styles.approvalText}>
                  ⓘ Host approval required to attend this event
                </Text>
              </View>
            )}

            {/* Visibility Badge */}
            <View style={styles.visibilityBadge}>
              <Text style={styles.visibilityText}>
                {event.visibility === "public" ? "🌐 Public Event" : "🔒 Private Event"}
              </Text>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  blurHeader: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: 240,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  joinButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinedButton: {
    backgroundColor: "#10b981",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    backgroundColor: "#fff/10",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff/20",
  },
  detailsSection: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  detailSubtext: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },
  priceLabel: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  descriptionText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  approvalNotice: {
    backgroundColor: "#2d1b0f",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  approvalText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  visibilityBadge: {
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  visibilityText: {
    color: "#4f46e5",
    fontSize: 12,
    fontWeight: "600",
  },
});