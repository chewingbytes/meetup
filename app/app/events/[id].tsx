import { joinEvent, leaveEvent, checkEventMembership, createEventTestimonial } from "@/lib/api";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  UserPlus,
  X,
  Star,
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
  const [gradientColors, setGradientColors] = useState(["#09090b", "#333333"]);
  const { user, isCheckingAuth } = useAuthRedirect("/login");
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState('');
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

  const { eventDetails, fetchEventById, isLoading } = useEventStore();
  const event = id
    ? (eventDetails[id as string] as EventProps | undefined)
    : null;

  // Fetch event if missing and check membership
  useEffect(() => {
    let mounted = true;

    async function loadEvent() {
      if (!id || !user) {
        setIsLoading?.(false);
        return;
      }

      try {
        console.log("📡 Fetching event with ID:", id);
        await fetchEventById(id as string);
        if (mounted) {
          console.log("✅ Event loaded");
          
          try {
            const membershipCheck = await checkEventMembership(user.id, id as string);
            setJoined(membershipCheck?.isMember || false);
            console.log("✅ Event membership status:", membershipCheck?.isMember ? "Joined" : "Not joined");
          } catch (err) {
            console.error("❌ Failed to check event membership:", err);
            setJoined(false);
          }
        }
      } catch (err) {
        console.error("❌ Failed to load event:", err);
      }
    }

    loadEvent();
    return () => {
      mounted = false;
    };
  }, [id, user, fetchEventById]);

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
    setGradientColors(matched ? matched[1] : ["#09090b", "#333333"]);
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

  const isPastEvent = useMemo(() => {
    if (!event?.end_at) return false;
    return new Date(event.end_at) < new Date();
  }, [event?.end_at]);

  const handleSubmitTestimonial = async () => {
    if (!testimonialText.trim()) {
      Alert.alert('Error', 'Please write a testimonial');
      return;
    }

    try {
      setIsSubmittingTestimonial(true);
      await createEventTestimonial({
        user_id: user?.id,
        event_id: event?.id,
        rating: testimonialRating,
        text: testimonialText,
      });
      setShowTestimonialModal(false);
      setTestimonialText('');
      setTestimonialRating(5);
      Alert.alert('Success', 'Thank you for your testimonial!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit testimonial');
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  // Loading state
  if (isLoading && !event) {
    return (
      <LinearGradient colors={["#09090b", "#333333"]} style={{ flex: 1 }}>
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
      <LinearGradient colors={["#09090b", "#333333"]} style={{ flex: 1 }}>
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
              {joined && !isPastEvent ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, { opacity: isLeaving ? 0.6 : 1 }]}
                  onPress={async () => {
                    if (!user || !event) {
                      console.error("❌ Missing user or event");
                      Alert.alert("Error", "User or event not found");
                      return;
                    }
                    console.log("🔵 Attempting to leave event:", { userId: user.id, eventId: event.id });
                    try {
                      setIsLeaving(true);
                      console.log("🔵 Calling leaveEvent API...");
                      const result = await leaveEvent(user.id, event.id);
                      console.log("✅ API Response:", result);
                      setJoined(false);
                      console.log("✅ Left event successfully");
                      Alert.alert("Success", "You have left this event");
                    } catch (err: any) {
                      console.error("❌ Failed to leave event:", {
                        message: err.message,
                        status: err.status,
                        body: err.body,
                        error: err,
                      });
                      Alert.alert("Error", err.message || "Failed to leave event");
                    } finally {
                      setIsLeaving(false);
                    }
                  }}
                  disabled={isLeaving}
                >
                  {isLeaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Leave Event</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.primaryBtn, { opacity: isJoining ? 0.6 : 1 }]}
                  onPress={async () => {
                    if (!user || !event) {
                      Alert.alert("Error", "User or event not found");
                      return;
                    }
                    try {
                      setIsJoining(true);
                      await joinEvent(user.id, event.id);
                      setJoined(true);
                      console.log("✅ Joined event successfully");
                    } catch (err: any) {
                      Alert.alert("Error", err.message || "Failed to join event");
                      console.error("❌ Failed to join event:", err);
                    } finally {
                      setIsJoining(false);
                    }
                  }}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Join Event</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.ghostBtn}
                onPress={() => router.push(`/events/participants?id=${event.id}`)}
              >
                <Users color="white" size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn}>
                <Heart color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Add Testimonial Button for Past Events */}
            {isPastEvent && joined && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#f59e0b',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginBottom: 24,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={() => setShowTestimonialModal(true)}
              >
                <Star size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  Share Your Experience
                </Text>
              </TouchableOpacity>
            )}

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

        {/* Testimonial Modal */}
        <Modal visible={showTestimonialModal} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.7)',
                justifyContent: 'flex-end',
              }}
              onPress={() => setShowTestimonialModal(false)}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
              >
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={{
                    backgroundColor: '#111',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    maxHeight: '100%',
                  }}
                  contentContainerStyle={{
                    padding: 20,
                  }}
                >
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                      Share Your Experience
                    </Text>
                    <TouchableOpacity onPress={() => setShowTestimonialModal(false)}>
                      <X size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Event Name */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>Event</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{event?.name}</Text>
                  </View>

                  {/* Rating */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                      Rating
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <TouchableOpacity key={i} onPress={() => setTestimonialRating(i)}>
                          <Text style={{ fontSize: 32 }}>{i <= testimonialRating ? '⭐' : '☆'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Text */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                      Your Experience
                    </Text>
                    <TextInput
                      value={testimonialText}
                      onChangeText={setTestimonialText}
                      placeholder="How was this event? Share your thoughts..."
                      placeholderTextColor="#666"
                      multiline
                      numberOfLines={6}
                      style={{
                        backgroundColor: '#18181b',
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        color: '#fff',
                        fontSize: 14,
                        borderWidth: 1,
                        borderColor: '#27272a',
                        textAlignVertical: 'top',
                        minHeight: 120,
                      }}
                    />
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => setShowTestimonialModal(false)}
                      style={{
                        flex: 1,
                        backgroundColor: '#18181b',
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#27272a',
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSubmitTestimonial}
                      disabled={isSubmittingTestimonial}
                      style={{
                        flex: 1,
                        backgroundColor: '#f59e0b',
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        opacity: isSubmittingTestimonial ? 0.7 : 1,
                      }}
                    >
                      {isSubmittingTestimonial ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Share</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
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
