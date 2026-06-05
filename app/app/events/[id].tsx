/**
 * Event detail screen — clay aesthetic.
 */

import { NeoLoader } from "@/components/ui/neo-loader";
import { ClayBackground } from "@/components/ui/clay-background";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayCard } from "@/components/ui/clay-card";
import { C } from "@/theme/clay";
import {
  checkEventMembership,
  createEventTestimonial,
  joinEvent,
  leaveEvent,
} from "@/lib/api";
import { useEventStore } from "@/lib/stores/eventStore";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { EventProps } from "@/utils/types";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HERO_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
];

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthRedirect("/login");
  const [joined, setJoined] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState("");
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

  const { eventDetails, fetchEventById } = useEventStore();
  const event = id ? (eventDetails[id as string] as EventProps | undefined) : null;

  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      if (!id || !user) return;
      try {
        await fetchEventById(id as string);
        if (mounted) {
          try {
            const result = await checkEventMembership(user.id, id as string);
            setJoined(result?.isMember || false);
            setIsOrganizer(result?.isOrganizer || false);
          } catch { setJoined(false); }
        }
      } catch {}
    }
    loadEvent();
    return () => { mounted = false; };
  }, [id, user, fetchEventById]);

  const formattedStart = useMemo(() => {
    if (!event?.start_at) return null;
    return new Date(event.start_at).toLocaleDateString("en-SG", {
      weekday: "long", month: "long", day: "numeric",
    });
  }, [event?.start_at]);

  const formattedTime = useMemo(() => {
    if (!event?.start_at) return null;
    return new Date(event.start_at).toLocaleTimeString("en-SG", {
      hour: "2-digit", minute: "2-digit",
    });
  }, [event?.start_at]);

  const priceLabel = useMemo(() => {
    if (event?.is_paid && event.price && event.price > 0) return `$${event.price.toFixed(2)}`;
    return "Free";
  }, [event]);

  const isPastEvent = useMemo(() => {
    if (!event?.end_at) return false;
    return new Date(event.end_at) < new Date();
  }, [event?.end_at]);

  const heroGrad = HERO_GRADIENTS[
    (event?.name?.charCodeAt(0) ?? 0) % HERO_GRADIENTS.length
  ];

  const onShare = async () => {
    try { await Share.share({ message: `Check out ${event?.name} on Hangout!` }); }
    catch {}
  };

  const handleJoin = async () => {
    if (!user || !event) return;
    try {
      setIsJoining(true);
      await joinEvent(user.id, event.id);
      setJoined(true);
      Alert.alert("You're in!", "See you there. 🎉");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setIsJoining(false); }
  };

  const handleLeave = async () => {
    if (!user || !event) return;
    Alert.alert("Leave hangout?", "You can always rejoin later.", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLeaving(true);
            await leaveEvent(user.id, event.id);
            setJoined(false);
          } catch (err: any) { Alert.alert("Error", err.message); }
          finally { setIsLeaving(false); }
        },
      },
    ]);
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonialText.trim()) { Alert.alert("Write something first!"); return; }
    try {
      setIsSubmittingTestimonial(true);
      await createEventTestimonial({
        user_id: user?.id, event_id: event?.id,
        rating: testimonialRating, text: testimonialText,
      });
      setShowTestimonialModal(false);
      setTestimonialText("");
      Alert.alert("Thanks!", "Your feedback was submitted.");
    } catch (error: any) { Alert.alert("Error", error.message); }
    finally { setIsSubmittingTestimonial(false); }
  };

  if (!event) {
    return (
      <View style={styles.loader}>
        <NeoLoader />
      </View>
    );
  }

  const participants = (event as any).participants ?? [];

  return (
    <ClayBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero image ── */}
        <View style={styles.hero}>
          {event.cover_image ? (
            <Image source={{ uri: event.cover_image }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <LinearGradient colors={heroGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroImg}>
              <Text style={styles.heroInitial}>{event.name?.charAt(0)?.toUpperCase() ?? "E"}</Text>
            </LinearGradient>
          )}

          {/* Header chrome over image */}
          <View style={[styles.heroChromeRow, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
              <ArrowLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onShare} style={styles.heroBtn}>
              <Share2 size={20} color={C.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Price badge */}
          <View style={[
            styles.priceBadge,
            event.is_paid && event.price && event.price > 0
              ? { backgroundColor: C.accentAmber }
              : { backgroundColor: C.accentGreen },
          ]}>
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Title + tags */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{event.name}</Text>
          </View>
          <View style={styles.tagRow}>
            {event.visibility === "private" && (
              <View style={[styles.tag, { backgroundColor: C.accentMuted }]}>
                <Text style={[styles.tagText, { color: C.accent }]}>Private</Text>
              </View>
            )}
            {event.require_approval && (
              <View style={[styles.tag, { backgroundColor: C.pinkMuted }]}>
                <Text style={[styles.tagText, { color: C.accentPink }]}>Approval required</Text>
              </View>
            )}
            {isPastEvent && (
              <View style={[styles.tag, { backgroundColor: "#F3F4F6" }]}>
                <Text style={[styles.tagText, { color: C.textSecondary }]}>Past hangout</Text>
              </View>
            )}
          </View>

          {/* Info card */}
          <ClayCard elevated style={styles.infoCard}>
            {formattedStart && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Calendar size={18} color={C.accent} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>{formattedStart}</Text>
                  {formattedTime && <Text style={styles.infoSub}>{formattedTime}</Text>}
                </View>
              </View>
            )}
            {(event.location_text || event.location_instructions) && (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "rgba(124,58,237,0.06)", paddingTop: C.Space.lg }]}>
                <View style={styles.infoIconWrap}>
                  <MapPin size={18} color={C.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{event.location_text || "TBD"}</Text>
                  {event.location_instructions && (
                    <Text style={styles.infoSub}>{event.location_instructions}</Text>
                  )}
                </View>
              </View>
            )}
            {(event.capacity != null || participants.length > 0) && (
              <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "rgba(124,58,237,0.06)", paddingTop: C.Space.lg }]}>
                <View style={styles.infoIconWrap}>
                  <Users size={18} color={C.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>
                    {event.capacity ? `${participants.length} / ${event.capacity}` : `${participants.length} going`}
                  </Text>
                  {event.capacity && (
                    <View style={styles.capacityBar}>
                      <View
                        style={[
                          styles.capacityFill,
                          { width: `${Math.min((participants.length / event.capacity) * 100, 100)}%` as any },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </ClayCard>

          {/* Participants */}
          {participants.length > 0 && (
            <View style={styles.participantsWrap}>
              <Text style={styles.subheading}>Who's going</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {participants.slice(0, 8).map((p: any, i: number) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => router.push(`/profile/${p.id}` as any)}
                    style={styles.participantItem}
                  >
                    <LinearGradient
                      colors={HERO_GRADIENTS[i % HERO_GRADIENTS.length]}
                      style={styles.participantAvatar}
                    >
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} style={StyleSheet.absoluteFillObject} />
                      ) : (
                        <Text style={styles.participantInitial}>
                          {p.username?.charAt(0)?.toUpperCase() ?? "?"}
                        </Text>
                      )}
                    </LinearGradient>
                    <Text style={styles.participantName} numberOfLines={1}>{p.username ?? "—"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            {isOrganizer ? (
              <View style={styles.hostingBadge}>
                <LinearGradient colors={C.Gradients.amber} style={styles.hostingGrad}>
                  <Text style={styles.hostingText}>Hosting this hangout ✓</Text>
                </LinearGradient>
              </View>
            ) : !isPastEvent ? (
              !joined ? (
                <ClayButton onPress={handleJoin} loading={isJoining} size="lg" fullWidth>
                  {event.require_approval ? "Apply Now" : "RSVP Now"}
                </ClayButton>
              ) : (
                <ClayButton onPress={handleLeave} loading={isLeaving} variant="secondary" size="lg" fullWidth>
                  {isLeaving ? "Leaving…" : "Attending ✓"}
                </ClayButton>
              )
            ) : null}
          </View>

          {isPastEvent && joined && (
            <TouchableOpacity
              onPress={() => setShowTestimonialModal(true)}
              style={styles.rateBtn}
              activeOpacity={0.85}
            >
              <LinearGradient colors={C.Gradients.amber} style={styles.rateBtnGrad}>
                <Star size={18} color="#fff" strokeWidth={2} fill="#fff" />
                <Text style={styles.rateBtnText}>Rate this hangout</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Description */}
          {event.description && (
            <ClayCard style={styles.descCard}>
              <Text style={styles.subheading}>About this hangout</Text>
              <Text style={styles.descText}>{event.description}</Text>
            </ClayCard>
          )}

          {/* Organizer */}
          <Text style={styles.organizerText}>
            Organized by {(event as any).organizer?.username ?? event.organizer_id ?? "Unknown"}
          </Text>
        </View>
      </ScrollView>

      {/* ── Testimonial modal ── */}
      <Modal visible={showTestimonialModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrap}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate & review</Text>
              <TouchableOpacity onPress={() => setShowTestimonialModal(false)}>
                <X size={22} color={C.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Star rating */}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setTestimonialRating(star)}>
                  <Star
                    size={32}
                    color={star <= testimonialRating ? C.accentAmber : "#E5E7EB"}
                    fill={star <= testimonialRating ? C.accentAmber : "transparent"}
                    strokeWidth={1.5}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={testimonialText}
              onChangeText={setTestimonialText}
              placeholder="Share your experience…"
              multiline
              style={styles.testimonialInput}
              placeholderTextColor={C.textTertiary}
            />

            <ClayButton
              onPress={handleSubmitTestimonial}
              loading={isSubmittingTestimonial}
              size="lg"
              fullWidth
            >
              Submit Review
            </ClayButton>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.canvas },

  hero: { height: 280, position: "relative" },
  heroImg: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  heroInitial: { fontFamily: C.Fonts.heading, fontSize: 80, color: "rgba(255,255,255,0.7)" },
  heroChromeRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: C.Space.xl,
    paddingBottom: 12,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: C.Radii.full,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  priceBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: C.Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  priceText: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.base, color: "#fff" },

  body: { padding: C.Space.xl, gap: C.Space.xl },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  titleText: {
    flex: 1,
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
    lineHeight: C.FontSizes.xxl * 1.15,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: -8 },
  tag: { borderRadius: C.Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  tagText: { fontFamily: C.Fonts.bodyMedium, fontSize: C.FontSizes.xs },

  infoCard: { gap: C.Space.lg },
  infoRow: { flexDirection: "row", gap: C.Space.lg, alignItems: "flex-start" },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: C.Radii.md,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.base, color: C.textPrimary },
  infoSub: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: C.textSecondary, marginTop: 2 },
  capacityBar: {
    height: 4,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    marginTop: 6,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    backgroundColor: C.accentLight,
    borderRadius: C.Radii.full,
  },

  subheading: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
    marginBottom: C.Space.md,
  },

  participantsWrap: { gap: 0 },
  participantItem: { alignItems: "center", gap: 6, width: 60 },
  participantAvatar: {
    width: 52,
    height: 52,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.surface,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  participantInitial: { fontFamily: C.Fonts.bodyBold, fontSize: 18, color: "#fff" },
  participantName: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: 10,
    color: C.textSecondary,
    textAlign: "center",
  },

  actions: { gap: 10 },
  hostingBadge: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: C.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 5,
  },
  hostingGrad: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: C.Radii.xl,
  },
  hostingText: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.lg, color: "#fff" },

  rateBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: C.accentAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 5,
  },
  rateBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  rateBtnText: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.lg, color: "#fff" },

  descCard: {},
  descText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.65,
  },

  organizerText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textTertiary,
    textAlign: "center",
    paddingVertical: C.Space.lg,
  },

  // ── Testimonial modal ──
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(51,47,58,0.45)" },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    padding: C.Space.xxl,
    gap: C.Space.xl,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.xl, color: C.textPrimary },
  starsRow: { flexDirection: "row", gap: 8, justifyContent: "center" },
  testimonialInput: {
    backgroundColor: "#EFEBF5",
    borderRadius: C.Radii.xl,
    padding: C.Space.lg,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
  },
});
