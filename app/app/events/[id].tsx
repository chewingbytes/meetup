import { joinEvent, leaveEvent } from "@/lib/api";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  ShieldCheck,
  EyeOff,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { BlurView } from "expo-blur";
import { useEventStore } from "@/lib/stores/eventStore";
import { EventProps } from "@/utils/types";
import { useAuthRedirect } from "@/lib/useAuthRedirect";

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gradientColors, setGradientColors] = useState(["#000000", "#333333"]);
  const { user, isCheckingAuth } = useAuthRedirect("/login");

  const { eventDetails, fetchEventById, isLoading } = useEventStore();
  const event = id
    ? (eventDetails[id as string] as EventProps | undefined)
    : null;

  // Fetch if missing
  useEffect(() => {
    if (!event && id) {
      fetchEventById(id as string);
    }
  }, [id, event, fetchEventById]);

  // Static gradients by “interest” or fallback
  useEffect(() => {
    if (!event) return;
    const gradients: Record<string, string[]> = {
      study: ["#1a1a2e", "#16213e", "#0f3460"],
      sports: ["#2d3436", "#636e72", "#b2bec3"],
      tech: ["#0c0c0c", "#1a1a1a", "#2d2d2d"],
      thrift: ["#6c5ce7", "#a29bfe", "#d63031"],
      fitness: ["#00b894", "#00cec9", "#55a3ff"],
    };
    const key =
      (event.interest as string)?.toLowerCase() ||
      event.name?.toLowerCase() ||
      "default";
    const matched = Object.entries(gradients).find(([k]) => key.includes(k));
    setGradientColors(matched ? matched[1] : ["#000000", "#333333"]);
  }, [event]);

  const formattedStart = useMemo(() => {
    if (!event?.start_at) return null;
    const d = new Date(event.start_at);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }, [event?.start_at]);

  const formattedTime = useMemo(() => {
    if (!event?.start_at) return null;
    const d = new Date(event.start_at);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event?.start_at]);

  const priceLabel = useMemo(() => {
    if (event?.is_paid && event.price && event.price > 0) {
      return `SGD $${event.price.toFixed(2)}`;
    }
    return "Free";
  }, [event]);

  // Loading state
  if (isLoading && !event) {
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

  // Not found
  if (!event) {
    return (
      <LinearGradient colors={["#000000", "#333333"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Event</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Event not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={50} tint="default" style={styles.blurHeader}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Event</Text>
              <View style={{ width: 24 }} />
            </View>
          </BlurView>

          {/* Hero Image */}
          <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
            {event.cover_image ? (
              <Image
                source={{ uri: event.cover_image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.placeholder]}>
                <Text style={{ fontSize: 48 }}>📅</Text>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
            {/* Title & price pill */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={styles.title}>{event.name}</Text>
              <View style={styles.pricePill}>
                <Text style={styles.priceText}>{priceLabel}</Text>
              </View>
            </View>

            {/* Meta rows */}
            <View style={{ gap: 10, marginBottom: 18 }}>
              {formattedStart && (
                <View style={styles.metaRow}>
                  <Calendar color="white" size={18} />
                  <Text style={styles.metaText}>
                    {formattedStart} {formattedTime ? `· ${formattedTime}` : ""}
                  </Text>
                </View>
              )}
              {event.location_text && (
                <View style={styles.metaRow}>
                  <MapPin color="white" size={18} />
                  <Text style={styles.metaText}>{event.location_text}</Text>
                </View>
              )}
              {event.capacity !== undefined && event.capacity !== null && (
                <View style={styles.metaRow}>
                  <Users color="white" size={18} />
                  <Text style={styles.metaText}>
                    Capacity: {event.capacity}
                  </Text>
                </View>
              )}
              <View style={styles.metaRow}>
                {event.visibility === "private" ? (
                  <>
                    <EyeOff color="#f59e0b" size={18} />
                    <Text style={[styles.metaText, { color: "#f59e0b" }]}>
                      Private event
                    </Text>
                  </>
                ) : (
                  <>
                    <ShieldCheck color="#22c55e" size={18} />
                    <Text style={[styles.metaText, { color: "#22c55e" }]}>
                      Public event
                    </Text>
                  </>
                )}
              </View>
              {event.require_approval && (
                <View style={styles.metaRow}>
                  <ShieldCheck color="#f97316" size={18} />
                  <Text style={[styles.metaText, { color: "#f97316" }]}>
                    Requires host approval
                  </Text>
                </View>
              )}
            </View>

            {/* CTAs */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => joinEvent(String(user?.id), event.id)}
              >
                <Text style={styles.primaryBtnText}>Join Event</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn}>
                <Heart color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* About */}
            {event.description ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bodyText}>{event.description}</Text>
              </View>
            ) : null}

            {/* Location instructions */}
            {event.location_instructions ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Location details</Text>
                <Text style={styles.bodyText}>
                  {event.location_instructions}
                </Text>
              </View>
            ) : null}

            {/* Organizer */}
            {event.organizer_id ? (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionTitle}>Organizer</Text>
                <Text style={styles.bodyText}>{event.organizer_id}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  blurHeader: {
    paddingBottom: 20,
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
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#4f46e5",
    borderRadius: 10,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  heroImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
  },
  placeholder: {
    backgroundColor: "#1f1f1f",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  pricePill: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 10,
  },
  priceText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaText: {
    color: "#e5e7eb",
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  ghostBtn: {
    width: 52,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  bodyText: {
    color: "#d4d4d8",
    fontSize: 15,
    lineHeight: 22,
  },
});
