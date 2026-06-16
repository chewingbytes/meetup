import { NeoLoader } from "@/components/ui/neo-loader";
import { getProfile } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  MapPin,
  ThumbsUp,
  BadgeCheck,
  Briefcase,
  MessageCircle,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

const SAMPLE_THUMBSUP = 47;
const SAMPLE_MEETUPS = 12;

const PROMPT_DEFS = [
  { key: "fixation", label: "current hyper-fixation" },
  { key: "building", label: "what i'm building" },
  { key: "striving", label: "striving towards" },
] as const;

const PROMPT_ACCENTS = ["#7C3AED", "#DB2777", "#059669"] as const;

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function PhotoCarousel({
  photos,
  avatar,
}: {
  photos: string[] | null | undefined;
  avatar: string | null | undefined;
}) {
  const images = photos?.length ? photos : avatar ? [avatar] : [];
  const [activeIdx, setActiveIdx] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setActiveIdx(idx);
  };

  if (!images.length) {
    return (
      <View style={styles.photoPlaceholder}>
        <View style={styles.placeholderInner}>
          <Text style={styles.placeholderInitial}>?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        data={images}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
        )}
      />
      {/* Gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)"]}
        style={styles.photoGradient}
        pointerEvents="none"
      />
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIdx ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProfile(id as string)
      .then((data) => setProfile(data.user || data))
      .catch((err: any) => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f1fa" }}>
        <NeoLoader />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f4f1fa", padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#332f3a", marginBottom: 8 }}>
          Profile not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnErr}>
          <Text style={{ fontWeight: "700", color: "#7C3AED" }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = computeAge(profile.date_of_birth);
  const interestList: string[] = Array.isArray(profile.interests)
    ? profile.interests.filter(Boolean)
    : [];

  const activePromptDef = PROMPT_DEFS.find((p) => p.key === profile.prompt_key);
  const promptAccentIdx = activePromptDef ? PROMPT_DEFS.indexOf(activePromptDef) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f4f1fa" }}>
      {/* Floating back button */}
      <View
        style={[styles.backBtn, { top: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtnInner}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color="#332f3a" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Photos */}
        <PhotoCarousel photos={profile.photo_urls} avatar={profile.avatar_url} />

        {/* Identity block */}
        <View style={styles.identityBlock}>
          {/* Name + age row */}
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>
              {profile.full_name || profile.username || "—"}
            </Text>
            {age !== null && (
              <View style={styles.agePill}>
                <Text style={styles.agePillText}>{age}</Text>
              </View>
            )}
          </View>

          {/* Occupation + location row */}
          <View style={styles.metaRow}>
            {profile.occupation ? (
              <View style={styles.metaChip}>
                <Briefcase size={12} color="#7C3AED" strokeWidth={2.5} />
                <Text style={styles.metaChipText}>{profile.occupation}</Text>
              </View>
            ) : null}
            {profile.location ? (
              <View style={styles.metaChip}>
                <MapPin size={12} color="#7C3AED" strokeWidth={2.5} />
                <Text style={styles.metaChipText}>{profile.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <ThumbsUp size={16} color="#7C3AED" strokeWidth={2.5} />
              </View>
              <Text style={styles.statNum}>{SAMPLE_THUMBSUP}</Text>
              <Text style={styles.statLabel}>thumbs up</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "#ecfdf5" }]}>
                <BadgeCheck size={16} color="#059669" strokeWidth={2.5} />
              </View>
              <Text style={[styles.statNum, { color: "#059669" }]}>{SAMPLE_MEETUPS}</Text>
              <Text style={styles.statLabel}>verified meetups</Text>
            </View>
          </View>
        </View>

        {/* Prompt */}
        {activePromptDef && profile.prompt_answer ? (
          <View style={styles.section}>
            <View style={styles.promptCard}>
              <View style={[styles.promptLabelBar, { backgroundColor: PROMPT_ACCENTS[promptAccentIdx] + "18" }]}>
                <View style={[styles.promptDot, { backgroundColor: PROMPT_ACCENTS[promptAccentIdx] }]} />
                <Text style={[styles.promptLabel, { color: PROMPT_ACCENTS[promptAccentIdx] }]}>
                  {activePromptDef.label}
                </Text>
              </View>
              <Text style={styles.promptAnswer}>{profile.prompt_answer}</Text>
            </View>
          </View>
        ) : null}

        {/* Interests */}
        {interestList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>interests</Text>
            <View style={styles.tagsWrap}>
              {interestList.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
          <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.ctaBtnText}>Send message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Photo carousel
  carouselWrap: {
    width: SCREEN_W,
    height: SCREEN_W * 1.15,
    backgroundColor: "#e5e0f0",
  },
  photo: {
    width: SCREEN_W,
    height: SCREEN_W * 1.15,
  },
  photoPlaceholder: {
    width: SCREEN_W,
    height: SCREEN_W * 1.15,
    backgroundColor: "#ddd8ea",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#c4b5fd",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderInitial: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  photoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  dots: {
    position: "absolute",
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 18,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },

  // Back button
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 100,
  },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtnErr: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    marginTop: 12,
  },

  // Identity block
  identityBlock: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1a1625",
    letterSpacing: -0.5,
  },
  agePill: {
    backgroundColor: "#ede9fe",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agePillText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7C3AED",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginBottom: 20,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0ebff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5b21b6",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: "center",
    width: "100%",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f0ebff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#7C3AED",
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#f0ebff",
  },

  // Section
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
    textAlign: "center",
  },

  // Prompts
  promptCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  promptLabelBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  promptDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  promptLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  promptAnswer: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1625",
    lineHeight: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
  },

  // Interests
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "#ede9fe",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5b21b6",
  },

  // CTA bar
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#f4f1fa",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.1)",
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  ctaBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
