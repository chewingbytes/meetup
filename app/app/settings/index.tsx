import { PullToRefresh } from "@/components/pull-to-refresh";
import { NeoButtonLoader, NeoLoader } from "@/components/ui/neo-loader";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayBackground } from "@/components/ui/clay-background";
import { C } from "@/theme/clay";
import AntDesign from "react-native-vector-icons/AntDesign"; // Or FontAwesome
import { deleteProfile } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import {
  getAvatarPublicUrl,
  uploadAvatarImage,
  listSubfolderImages,
  deleteStorageImage,
} from "@/lib/supabaseStorage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Briefcase,
  Camera,
  ChevronLeft,
  GraduationCap,
  LogOut,
  MapPin,
  Music,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trophy,
  X,
} from "lucide-react-native";

const SAMPLE_THUMBSUP = 47;
const SAMPLE_MEETUPS = 12;

const PROMPT_DEFS = [
  { key: "fixation", label: "what do you like to do in your free time?", placeholder: "What are you obsessed with right now?" },
  { key: "building", label: "what are you actively working towards?", placeholder: "A project, a habit, a skill…" },
  { key: "striving", label: "what are some goals you have in mind?", placeholder: "Your north star goal…" },
] as const;

const PROMPT_ACCENTS = ["#7C3AED", "#DB2777", "#059669"] as const;

function computeAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Interest presets ───────────────────────────────────────────────────────

const INTEREST_CATEGORIES = [
  {
    label: "🏃 Sports & Fitness",
    items: [
      "Running",
      "Gym",
      "Swimming",
      "Cycling",
      "Yoga",
      "Hiking",
      "Rock Climbing",
      "Martial Arts",
      "Tennis",
      "Basketball",
      "Football",
      "Volleyball",
      "Badminton",
      "Soccer",
      "Boxing",
      "Skiing",
      "Surfing",
      "Dancing",
    ],
  },
  {
    label: "🎨 Arts & Creativity",
    items: [
      "Drawing",
      "Painting",
      "Photography",
      "Filmmaking",
      "Writing",
      "Music Production",
      "Graphic Design",
      "Fashion",
      "DIY & Crafts",
      "Sculpting",
      "Pottery",
      "Architecture",
    ],
  },
  {
    label: "🎵 Music",
    items: [
      "Live Music",
      "Guitar",
      "Piano",
      "Singing",
      "DJing",
      "Hip-Hop",
      "Electronic",
      "Classical",
      "Jazz",
      "K-Pop",
      "Indie",
      "R&B",
      "Rap",
      "Pop",
    ],
  },
  {
    label: "🍜 Food & Drink",
    items: [
      "Cooking",
      "Baking",
      "Coffee",
      "Tea",
      "Street Food",
      "Restaurant Hopping",
      "Wine",
      "Brunch",
      "Cocktails",
      "Vegan Food",
      "Boba",
    ],
  },
  {
    label: "💻 Tech & Gaming",
    items: [
      "Gaming",
      "Coding",
      "AI",
      "Cybersecurity",
      "Mobile Apps",
      "Esports",
      "Board Games",
      "VR/AR",
      "Robotics",
      "3D Printing",
      "Crypto",
    ],
  },
  {
    label: "🌍 Outdoors & Travel",
    items: [
      "Camping",
      "Backpacking",
      "Road Trips",
      "Beach",
      "Nature",
      "Sightseeing",
      "Skydiving",
      "Scuba Diving",
      "Fishing",
      "Bouldering",
    ],
  },
  {
    label: "📚 Culture & Learning",
    items: [
      "Movies",
      "Anime",
      "K-Drama",
      "Reading",
      "Podcasts",
      "History",
      "Philosophy",
      "Psychology",
      "Languages",
      "Science",
      "Astronomy",
      "True Crime",
    ],
  },
  {
    label: "✨ Lifestyle",
    items: [
      "Meditation",
      "Journaling",
      "Thrifting",
      "Astrology",
      "Pets",
      "Skincare",
      "Interior Design",
      "Gardening",
      "Minimalism",
      "Sustainability",
    ],
  },
  {
    label: "🤝 Community",
    items: [
      "Volunteering",
      "Entrepreneurship",
      "Networking",
      "Social Justice",
      "Politics",
      "Public Speaking",
      "Mentoring",
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeadingRow}>
      <LinearGradient
        colors={C.Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sectionHeadingBar}
      />
      <Text style={styles.sectionHeadingText}>{title}</Text>
    </View>
  );
}

export default function ProfileIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    userProfile,
    userSettings,
    updateUserSettings,
    signOut,
    session,
    updateUserProfile,
    fetchUserProfile,
    fetchUserSettings,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);
  const [form, setForm] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchUserProfile(), fetchUserSettings()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchUserProfile, fetchUserSettings]);

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [session]);

  useEffect(() => {
    if (!userProfile || !session?.user?.id) return;
    const userId = session.user.id;

    setForm({
      username: userProfile.username || "",
      occupation: userProfile.occupation || "",
      location: userProfile.location || "",
      date_of_birth: userProfile.date_of_birth || "",
      prompt_key: userProfile.prompt_key || "",
      prompt_answer: userProfile.prompt_answer || "",
      bio: userProfile.bio || "",
      school: userProfile.school || "",
      year_of_study: userProfile.year_of_study || "",
      interests: Array.isArray(userProfile.interests)
        ? userProfile.interests.filter(Boolean)
        : [],
      main_interest: userProfile.main_interest || "",
      instagram_handle: userProfile.instagram_handle || "",
      photo_urls: userProfile.avatar_url ? [userProfile.avatar_url] : [],
    });

    (async () => {
      try {
        const [mainPhotos, profilePhotos] = await Promise.all([
          listSubfolderImages(userId, "mainphoto"),
          listSubfolderImages(userId, "profilephotos"),
        ]);
        const merged = [
          ...(mainPhotos[0]
            ? [mainPhotos[0]]
            : userProfile.avatar_url
              ? [userProfile.avatar_url]
              : []),
          ...profilePhotos,
        ];
        if (merged.length > 0) {
          setForm((prev: any) => ({ ...prev, photo_urls: merged }));
        }
      } catch (e) {
        console.error("📸 storage load error:", e);
      }
    })();
  }, [userProfile, session?.user?.id]);

  const openInstagramProfile = async (username: string) => {
    // Native app URL schem
    const appUrl = `instagram://user?username=${username}`;
    // Fallback web URL
    const webUrl = `https://instagram.com/${username}`;

    try {
      // Check if the native Instagram app is installed and can handle the scheme
      const isSupported = await Linking.canOpenURL(appUrl);

      if (isSupported) {
        // Open the profile inside the native Instagram app
        await Linking.openURL(appUrl);
      } else {
        // Fallback: Open the profile in the device's default web browser
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open Instagram.");
    }
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setIsUpdating(true);
    try {
      // Upload any locally-picked URIs to storage
      const finalUrls = await Promise.all(
        (form.photo_urls ?? []).map(async (url: string, index: number) => {
          if (!isLocalUri(url)) return url;
          const subfolder = index === 0 ? "mainphoto" : "profilephotos";
          const uploaded = await uploadAvatarImage(
            session.user.id,
            url,
            subfolder,
          );
          return uploaded.publicUrl;
        }),
      );

      // Delete any photos the user removed
      await Promise.allSettled(
        pendingDeletes.map((url) => deleteStorageImage(url)),
      );
      setPendingDeletes([]);

      await updateUserProfile({
        username: form.username,
        occupation: form.occupation || null,
        location: form.location || null,
        date_of_birth: form.date_of_birth || null,
        prompt_key: form.prompt_key || null,
        prompt_answer: form.prompt_answer || null,
        bio: form.bio,
        school: form.school,
        year_of_study: form.year_of_study,
        interests: form.interests,
        main_interest: form.main_interest || null,
        instagram_handle: (form.instagram_handle ?? "").trim() || null,
        photo_urls: finalUrls,
        avatar_url: finalUrls[0] || userProfile?.avatar_url || null,
      });
      setIsEditing(false);
      Alert.alert("Saved!", "Your profile is updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setPendingDeletes([]);
    setIsEditing(false);
    // Reset form back to last saved state
    if (userProfile) {
      setForm({
        username: userProfile.username || "",
        occupation: userProfile.occupation || "",
        location: userProfile.location || "",
        date_of_birth: userProfile.date_of_birth || "",
        prompt_key: userProfile.prompt_key || "",
        prompt_answer: userProfile.prompt_answer || "",
        bio: userProfile.bio || "",
        school: userProfile.school || "",
        year_of_study: userProfile.year_of_study || "",
        interests: Array.isArray(userProfile.interests)
          ? userProfile.interests.filter(Boolean)
          : [],
        instagram_handle: userProfile.instagram_handle || "",
        photo_urls: userProfile.avatar_url ? [userProfile.avatar_url] : [],
      });
      if (session?.user?.id) {
        (async () => {
          try {
            const [mainPhotos, profilePhotos] = await Promise.all([
              listSubfolderImages(session.user.id, "mainphoto"),
              listSubfolderImages(session.user.id, "profilephotos"),
            ]);
            const merged = [
              ...(mainPhotos[0]
                ? [mainPhotos[0]]
                : userProfile.avatar_url
                  ? [userProfile.avatar_url]
                  : []),
              ...profilePhotos,
            ];
            if (merged.length > 0)
              setForm((prev: any) => ({ ...prev, photo_urls: merged }));
          } catch {}
        })();
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) return;
    setIsDeleting(true);
    try {
      await deleteProfile(session.user.id);
      await signOut();
      router.replace("/");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "See you later!", [
      { text: "Stay", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleVerify = () => router.push("/verify/singpass" as any);

  const isLocalUri = (url: string) =>
    !url.includes("://") ||
    url.startsWith("file://") ||
    url.startsWith("ph://") ||
    url.startsWith("assets-library://");

  const resolveAvatarUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.includes("://")) return url; // http, https, file, ph — all pass through
    try {
      return getAvatarPublicUrl(url);
    } catch {
      return null;
    }
  };

  const handleEditMainPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert(
          "Permission required",
          "Allow photo access to update your photo.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      setForm((prev: any) => ({
        ...prev,
        photo_urls: [result.assets[0].uri, ...(prev.photo_urls ?? []).slice(1)],
      }));
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not select image.");
    }
  };

  const handleAddPhoto = async () => {
    if ((form.photo_urls?.length ?? 0) >= 5) {
      Alert.alert("Max photos", "You can add up to 5 photos.");
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      setForm((prev: any) => ({
        ...prev,
        photo_urls: [...(prev.photo_urls ?? []), result.assets[0].uri],
      }));
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not select image.");
    }
  };

  const handleRemovePhoto = (index: number) => {
    const url = form.photo_urls?.[index];
    if (url && !isLocalUri(url)) {
      setPendingDeletes((prev) => [...prev, url]);
    }
    setForm((prev: any) => ({
      ...prev,
      photo_urls: prev.photo_urls.filter((_: string, i: number) => i !== index),
    }));
  };

  const toggleInterest = (item: string) => {
    setForm((prev: any) => {
      const has = prev.interests.includes(item);
      const interests = has
        ? prev.interests.filter((i: string) => i !== item)
        : [...prev.interests, item];
      // Keep the main interest valid: default it to the first one picked, and if
      // the current main gets removed, fall back to whatever's left (or none).
      let main_interest = prev.main_interest;
      if (!has && !main_interest) main_interest = item;
      if (has && main_interest === item) main_interest = interests[0] ?? "";
      return { ...prev, interests, main_interest };
    });
  };

  const setMainInterest = (item: string) => {
    setForm((prev: any) => ({ ...prev, main_interest: item }));
  };

  const toggleNotification = async () => {
    if (!userSettings) return;
    try {
      await updateUserSettings({
        push_notifications: !userSettings.push_notifications,
      });
    } catch {}
  };

  if (!userProfile) {
    return (
      <View style={styles.loader}>
        <NeoLoader />
        <TouchableOpacity onPress={handleLogout} style={styles.loaderLogout}>
          <Text style={styles.loaderLogoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = userProfile.username || "You";
  const avatarUrl = resolveAvatarUrl(
    form.photo_urls?.[0] || userProfile.avatar_url,
  );
  const extraPhotos: string[] = (form.photo_urls || [])
    .slice(1)
    .filter(Boolean);
  const isVerified = userProfile.verified === "true";
  const isPending = userProfile.verified === "pending";
  const needsQuiz =
    !userProfile?.personality_answers || !userProfile?.personality_type;

  return (
    <ClayBackground>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {isEditing ? (
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.headerActionBtn}
            >
              <X size={18} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isUpdating}
              style={[
                styles.headerActionBtn,
                { backgroundColor: C.accentGreen },
              ]}
            >
              {isUpdating ? (
                <NeoButtonLoader color="#fff" />
              ) : (
                <Save size={18} color="#fff" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            style={styles.headerActionBtn}
          >
            <Pencil size={18} color={C.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72 }]}
        refreshControl={
          <PullToRefresh
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name Hero ── */}
        <View style={styles.avatarHero}>
          {/* Soft gradient wash behind the hero */}
          <LinearGradient
            colors={["#EDE9FE", "rgba(244,241,250,0)"]}
            style={styles.heroBackdrop}
            pointerEvents="none"
          />
          <View style={styles.avatarWithBubble}>
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <Pressable
                onPress={isEditing ? handleEditMainPhoto : undefined}
                style={styles.avatarWrap}
              >
                {avatarUrl ? (
                  <Image
                    key={avatarUrl}
                    source={{ uri: avatarUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={C.Gradients.primary}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                {isEditing && (
                  <View style={styles.avatarEditOverlay}>
                    <Camera size={20} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
                {isVerified && (
                  <View style={styles.verifiedPip}>
                    <BadgeCheck size={14} color="#fff" strokeWidth={2.5} />
                  </View>
                )}
              </Pressable>
            </LinearGradient>
            {/* Prompt bubble — view mode only, centered below avatar */}
            {!isEditing && (() => {
              const def = PROMPT_DEFS.find((p) => p.key === form.prompt_key);
              const accent = def ? PROMPT_ACCENTS[PROMPT_DEFS.indexOf(def)] : C.accent;
              return def && form.prompt_answer ? (
                <View style={styles.promptBubble}>
                  <View style={styles.promptBubbleTailWrap}>
                    <View style={styles.promptBubbleTail} />
                  </View>
                  <Text style={[styles.promptBubbleLabel, { color: accent }]}>{def.label}</Text>
                  <Text style={styles.promptBubbleText}>
                    <Text style={[styles.promptBubbleQuote, { color: accent }]}>{'”'}</Text>
                    {form.prompt_answer}
                    <Text style={[styles.promptBubbleQuote, { color: accent }]}>{'”'}</Text>
                  </Text>
                </View>
              ) : null;
            })()}
          </View>

          <View style={styles.heroText}>
            {isEditing ? (
              <TextInput
                value={form.username}
                onChangeText={(t) => setForm({ ...form, username: t })}
                style={styles.nameInput}
                placeholder="Your name"
                placeholderTextColor={C.textTertiary}
              />
            ) : (
              <Text style={styles.nameText}>{displayName}</Text>
            )}

            {/* ── Occupation / Location / Age ── */}
            {isEditing ? (
              <View style={styles.metaEditCol}>
                <TextInput
                  value={form.occupation}
                  onChangeText={(t) => setForm({ ...form, occupation: t })}
                  style={styles.metaInput}
                  placeholder="Occupation (e.g. CS Student)"
                  placeholderTextColor={C.textTertiary}
                />
                <TextInput
                  value={form.location}
                  onChangeText={(t) => setForm({ ...form, location: t })}
                  style={styles.metaInput}
                  placeholder="City / area (e.g. Singapore)"
                  placeholderTextColor={C.textTertiary}
                />
                <TextInput
                  value={form.date_of_birth}
                  onChangeText={(t) => setForm({ ...form, date_of_birth: t })}
                  style={styles.metaInput}
                  placeholder="Date of birth (YYYY-MM-DD)"
                  placeholderTextColor={C.textTertiary}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            ) : (
              <View style={styles.metaRow}>
                {userProfile.occupation ? (
                  <View style={styles.metaChip}>
                    <Briefcase size={11} color={C.accent} strokeWidth={2.5} />
                    <Text style={styles.metaChipText}>{userProfile.occupation}</Text>
                  </View>
                ) : null}
                {userProfile.location ? (
                  <View style={styles.metaChip}>
                    <MapPin size={11} color={C.accent} strokeWidth={2.5} />
                    <Text style={styles.metaChipText}>{userProfile.location}</Text>
                  </View>
                ) : null}
                {computeAge(userProfile.date_of_birth) !== null ? (
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>{computeAge(userProfile.date_of_birth)} yrs</Text>
                  </View>
                ) : null}
              </View>
            )}

            {userProfile.personality_type && (
              <View style={styles.personalityBadge}>
                <Text style={styles.personalityText}>
                  {userProfile.personality_type}
                </Text>
              </View>
            )}

            {/* ── Stats cards (sample) ── */}
            {!isEditing && (
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconChip,
                      { backgroundColor: C.accentMuted },
                    ]}
                  >
                    <ThumbsUp size={16} color={C.accent} strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={styles.statNum}>{SAMPLE_THUMBSUP}</Text>
                    <Text style={styles.statLabel}>thumbs up</Text>
                  </View>
                </View>
                <View style={styles.statCard}>
                  <View
                    style={[
                      styles.statIconChip,
                      { backgroundColor: C.greenMuted },
                    ]}
                  >
                    <BadgeCheck
                      size={16}
                      color={C.accentGreen}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View>
                    <Text style={[styles.statNum, { color: C.accentGreen }]}>
                      {SAMPLE_MEETUPS}
                    </Text>
                    <Text style={styles.statLabel}>meetups</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── Social handles (view mode) ── */}
            {!isEditing && form.instagram_handle && (
              <View style={styles.socialsRow}>
                {form.instagram_handle ? (
                  <Pressable
                    onPress={() => openInstagramProfile(form.instagram_handle)}
                  >
                    <LinearGradient
                      colors={["#833AB4", "#FD1D1D", "#FCAF45"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.socialPill}
                    >
                      <AntDesign name="instagram" size={20} color="#FFFFFF" />
                      <Text style={styles.socialPillText}>
                        @{form.instagram_handle}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
          {/* ── Socials Card ── */}
          {isEditing && (
            <ClayCard style={styles.section} elevated>
              {/* Instagram */}
              <View style={styles.socialRow}>
                <LinearGradient
                  colors={["#833AB4", "#FD1D1D", "#FCAF45"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialBrandIcon}
                >
                  <Camera size={16} color="#fff" strokeWidth={2.2} />
                </LinearGradient>
                <View style={styles.socialContent}>
                  <Text style={styles.socialBrandName}>Instagram</Text>
                  {isEditing ? (
                    <TextInput
                      value={form.instagram_handle}
                      onChangeText={(t) =>
                        setForm({
                          ...form,
                          instagram_handle: t
                            .replace("@", "")
                            .replace(/\s/g, ""),
                        })
                      }
                      placeholder="your_handle"
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.socialHandleInput}
                      placeholderTextColor={C.textTertiary}
                    />
                  ) : (
                    <Text
                      style={
                        form.instagram_handle
                          ? styles.socialHandleText
                          : styles.socialHandleEmpty
                      }
                    >
                      {form.instagram_handle
                        ? `@${form.instagram_handle}`
                        : "Not connected"}
                    </Text>
                  )}
                </View>
              </View>
            </ClayCard>
          )}

          {/* {isVerified ? (
            <View style={styles.verifiedBanner}>
              <LinearGradient
                colors={C.Gradients.green}
                style={styles.verifiedBannerGrad}
              >
                <BadgeCheck size={24} color="#fff" strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verifiedBannerTitle}>
                    Student Verified
                  </Text>
                  <Text style={styles.verifiedBannerSub}>
                    Student-only spaces are unlocked
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ) : isPending ? (
            <View style={styles.pendingBanner}>
              <ShieldCheck size={22} color={C.accentAmber} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>
                  Student Verification in review
                </Text>
                <Text style={styles.pendingBody}>
                  We'll notify you once approved.
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.85}
              style={styles.studentCTA}
            >
              <ClayCard elevated radius={C.Radii.xxl} padding={C.Space.xl}>
                <View style={styles.studentCTAInner}>
                  <View style={styles.studentCTAIcon}>
                    <GraduationCap size={24} color={C.accent} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentCTATitle}>
                      Are you a student?
                    </Text>
                    <Text style={styles.studentCTABody}>
                      Verify your student status to unlock exclusive hangouts
                      and safer spaces.
                    </Text>
                  </View>
                </View>
                <View style={styles.studentCTABtn}>
                  <Text style={styles.studentCTABtnText}>Get verified →</Text>
                </View>
              </ClayCard>
            </TouchableOpacity>
          )} */}

          {/* ── Personality quiz nudge ──
          {needsQuiz && (
            <TouchableOpacity
              onPress={() => router.push("/settings/personality-quiz" as any)}
              activeOpacity={0.85}
              style={{ marginHorizontal: C.Space.xl, marginBottom: C.Space.lg }}
            >
              <LinearGradient
                colors={C.Gradients.pink}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quizBanner}
              >
                <Star size={22} color="#fff" strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quizTitle}>Discover your vibe</Text>
                  <Text style={styles.quizBody}>
                    Take the personality quiz to unlock your type.
                  </Text>
                </View>
                <Text style={styles.quizArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
 */}
          {/* ── Extra photos strip (edit mode) ── */}
          {isEditing && (
            <View style={styles.photoStrip}>
              {(form.photo_urls ?? [])
                .slice(1)
                .map((url: string, i: number) => {
                  const resolvedUrl = resolveAvatarUrl(url);
                  return (
                    <View key={url + i} style={styles.photoThumbWrap}>
                      {resolvedUrl ? (
                        <Image
                          source={{ uri: resolvedUrl }}
                          style={styles.photoThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.photoThumb,
                            { backgroundColor: "#E0D9F5" },
                          ]}
                        />
                      )}
                      <TouchableOpacity
                        style={[
                          styles.photoThumbAction,
                          styles.photoThumbRemove,
                        ]}
                        onPress={() => handleRemovePhoto(i + 1)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={9} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              {(form.photo_urls?.length ?? 0) < 5 && (
                <TouchableOpacity
                  style={styles.addPhotoBtn}
                  onPress={handleAddPhoto}
                >
                  <Plus size={20} color={C.accent} strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Extra photos grid (view mode) ── */}
        {!isEditing && extraPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {extraPhotos.map((url, i) => {
              const resolvedUrl = resolveAvatarUrl(url);
              return resolvedUrl ? (
                <Image
                  key={url + i}
                  source={{ uri: resolvedUrl }}
                  style={styles.photoGridImg}
                  resizeMode="cover"
                />
              ) : null;
            })}
          </View>
        )}

        {/* ── Prompt (edit mode only — view mode shows as bubble on photo) ── */}
        {isEditing && (
          <ClayCard style={styles.section} elevated>
            {/* Prompt selector chips */}
            <View style={styles.promptChips}>
              {PROMPT_DEFS.map((p, i) => {
                const selected = form.prompt_key === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setForm({ ...form, prompt_key: p.key })}
                    style={[
                      styles.promptChip,
                      selected && { backgroundColor: PROMPT_ACCENTS[i], borderColor: PROMPT_ACCENTS[i] },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.promptChipText, selected && styles.promptChipTextSelected]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Answer input — only shown once a prompt is chosen */}
            {form.prompt_key ? (
              <TextInput
                value={form.prompt_answer}
                onChangeText={(t) => setForm({ ...form, prompt_answer: t })}
                multiline
                style={[styles.bioInput, { marginTop: C.Space.lg }]}
                placeholder={PROMPT_DEFS.find((p) => p.key === form.prompt_key)?.placeholder ?? "Your answer…"}
                placeholderTextColor={C.textTertiary}
              />
            ) : (
              <Text style={[styles.bioText, { marginTop: 8, color: C.textTertiary }]}>
                Choose a prompt above to answer.
              </Text>
            )}
          </ClayCard>
        )}

        {/* ── Interests Card ── */}
        <ClayCard style={styles.section} elevated>
          <Text style={[styles.sectionLabel, { marginTop: 0 }]}>
            Interests
          </Text>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={styles.interestPickerTrigger}
                onPress={() => setShowInterestPicker(true)}
                activeOpacity={0.8}
              >
                {form.interests.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {form.interests.map((tag: string) => (
                      <View key={tag} style={styles.tagSelected}>
                        <Text style={styles.tagSelectedText}>{tag}</Text>
                      </View>
                    ))}
                    <View style={styles.tagAdd}>
                      <Plus size={12} color={C.accent} strokeWidth={2.5} />
                      <Text style={styles.tagAddText}>Edit</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.interestPlaceholder}>
                    <Plus size={16} color={C.accent} strokeWidth={2.5} />
                    <Text style={styles.interestPlaceholderText}>
                      Choose your interests
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {form.interests.length > 0 && (
                <View style={styles.mainInterestBlock}>
                  <View style={styles.mainInterestHeader}>
                    <Star size={13} color={C.accent} strokeWidth={2.5} fill={C.accent} />
                    <Text style={styles.mainInterestTitle}>Main interest</Text>
                  </View>
                  <Text style={styles.mainInterestHint}>
                    Shown on your map pin — people see this first, before they open
                    your profile.
                  </Text>
                  <View style={styles.tagsRow}>
                    {form.interests.map((tag: string) => {
                      const isMain = form.main_interest === tag;
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => setMainInterest(tag)}
                          activeOpacity={0.8}
                          style={[
                            styles.mainChip,
                            isMain && styles.mainChipActive,
                          ]}
                        >
                          {isMain && (
                            <Star size={11} color="#fff" strokeWidth={2.5} fill="#fff" />
                          )}
                          <Text
                            style={[
                              styles.mainChipText,
                              isMain && styles.mainChipTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          ) : (form.interests?.length ?? 0) > 0 ? (
            <>
              <View style={styles.tagsRow}>
                {[...(form.interests ?? [])]
                  .sort((a: string, b: string) =>
                    a === form.main_interest ? -1 : b === form.main_interest ? 1 : 0,
                  )
                  .map((tag: string) => {
                    const isMain = form.main_interest === tag;
                    return (
                      <View
                        key={tag}
                        style={isMain ? styles.tagMain : styles.tag}
                      >
                        {isMain && (
                          <Star size={10} color="#fff" strokeWidth={2.5} fill="#fff" />
                        )}
                        <Text style={isMain ? styles.tagMainText : styles.tagText}>
                          {tag}
                        </Text>
                      </View>
                    );
                  })}
              </View>
              {form.main_interest ? (
                <View style={styles.mainInterestCaption}>
                  <MapPin size={11} color={C.textSecondary} strokeWidth={2.5} />
                  <Text style={styles.mainInterestCaptionText}>
                    <Text style={styles.mainInterestCaptionStrong}>
                      {form.main_interest}
                    </Text>{" "}
                    shows on your map pin
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.bioText}>No interests added yet.</Text>
          )}
        </ClayCard>

        {/* ── My Space tiles ── */}
        <SectionHeading title="My Space" />
        <View style={styles.tilesRow}>
          {[
            {
              label: "Hangouts",
              icon: Trophy,
              color: C.Gradients.amber,
              onPress: () => router.push("/my-events" as any),
            },
            {
              label: "Host",
              icon: Star,
              color: C.Gradients.primary,
              onPress: () => router.push("/host/dashboard" as any),
            },
          ].map((tile) => (
            <TouchableOpacity
              key={tile.label}
              onPress={tile.onPress}
              style={styles.tile}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={tile.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileGrad}
              >
                <tile.icon size={24} color="#fff" strokeWidth={2} />
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Settings ── */}
        <SectionHeading title="Settings" />
        <ClayCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Bell size={18} color={C.accent} strokeWidth={2} />
            </View>
            <Text style={styles.settingLabel}>Push notifications</Text>
            <Switch
              value={userSettings?.push_notifications ?? false}
              onValueChange={toggleNotification}
              trackColor={{ false: "#E5E7EB", true: C.accentLight }}
              thumbColor={
                userSettings?.push_notifications ? C.accent : "#9CA3AF"
              }
            />
          </View>
        </ClayCard>

        {/* ── Danger zone ── */}
        <View style={styles.dangerZone}>
          <ClayButton
            onPress={handleLogout}
            variant="secondary"
            fullWidth
            size="md"
            style={{ marginBottom: 10 }}
          >
            <LogOut size={16} color={C.textPrimary} strokeWidth={2} />
            {"  "}Sign Out
          </ClayButton>
          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            style={styles.deleteBtn}
          >
            <AlertTriangle size={14} color={C.error} strokeWidth={2} />
            <Text style={styles.deleteBtnText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Interest Picker Modal ── */}
      <Modal
        visible={showInterestPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInterestPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Interests</Text>
            <TouchableOpacity
              onPress={() => setShowInterestPicker(false)}
              style={styles.pickerDoneBtn}
            >
              <Text style={styles.pickerDoneText}>
                Done
                {form.interests?.length > 0
                  ? ` (${form.interests.length})`
                  : ""}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.pickerScroll}
            contentContainerStyle={styles.pickerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {INTEREST_CATEGORIES.map((cat) => (
              <View key={cat.label} style={styles.pickerCategory}>
                <Text style={styles.pickerCatLabel}>{cat.label}</Text>
                <View style={styles.pickerChips}>
                  {cat.items.map((item) => {
                    const selected = form.interests?.includes(item);
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.pickerChip,
                          selected && styles.pickerChipSelected,
                        ]}
                        onPress={() => toggleInterest(item)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.pickerChipText,
                            selected && styles.pickerChipTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText("");
        }}
      >
        <View style={styles.modalOverlay}>
          <ClayCard
            elevated
            radius={C.Radii.xxl}
            padding={C.Space.xxl}
            style={styles.modalCard}
          >
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalBody}>
              This is permanent and cannot be undone.
            </Text>
            <Text style={styles.modalPrompt}>
              Type{" "}
              <Text style={{ color: C.error, fontFamily: C.Fonts.bodyBold }}>
                delete
              </Text>{" "}
              to confirm:
            </Text>
            <TextInput
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="delete"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={
                  deleteConfirmText.toLowerCase() !== "delete" || isDeleting
                }
                style={[
                  styles.modalConfirmBtn,
                  {
                    opacity:
                      deleteConfirmText.toLowerCase() === "delete" ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={styles.modalConfirmText}>
                  {isDeleting ? "Deleting…" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </ClayCard>
        </View>
      </Modal>
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.canvas,
    gap: 20,
  },
  loaderLogout: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.lg,
  },
  loaderLogoutText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: C.Space.xl,
    paddingBottom: 14,
    backgroundColor: "rgba(244,241,250,0.92)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  scroll: { paddingBottom: 60 },

  // ── Avatar + bubble wrapper ──
  avatarWithBubble: {
    alignItems: "center",
    alignSelf: "center",
  },
  promptBubble: {
    marginTop: -5,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.12)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    maxWidth: 300,
    alignItems: "center",
  },
  promptBubbleLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  promptBubbleText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    lineHeight: C.FontSizes.sm * 1.5,
    textAlign: "center",
  },
  promptBubbleQuote: {
    fontFamily: C.Fonts.heading,
    fontSize: 18,
    opacity: 0.45,
  },
  promptBubbleTailWrap: {
    position: "absolute",
    top: -11,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  promptBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#fff",
  },

  // ── Avatar Hero ──
  avatarHero: {
    alignItems: "center",
    paddingTop: C.Space.xxl,
    paddingBottom: C.Space.xl,
    gap: C.Space.lg,
  },
  heroBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.surface,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitial: { fontFamily: C.Fonts.heading, fontSize: 38, color: "#fff" },
  avatarEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: C.Radii.full,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedPip: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentGreen,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
  },
  heroText: { alignItems: "center", gap: 6 },
  nameText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
  },
  nameInput: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
    textAlign: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: C.accentLight,
    paddingVertical: 4,
    minWidth: 160,
  },
  personalityBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  personalityText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
    letterSpacing: 0.5,
  },

  // ── Social pills (hero view mode) ──
  socialsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: C.Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 6,
  },

  socialPillText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },

  // ── Photo strip (edit mode) ──
  photoStrip: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    paddingHorizontal: C.Space.xl,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  photoThumbWrap: { position: "relative", width: 56, height: 56 },
  photoThumb: { width: 56, height: 56, borderRadius: 12 },
  photoThumbAction: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  photoThumbRemove: { top: 2, right: 2, backgroundColor: C.error },
  addPhotoBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.accentLight,
    borderStyle: "dashed",
  },

  // ── Extra photos grid (view mode) ──
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    gap: 8,
  },
  photoGridImg: {
    width: (SCREEN_W - C.Space.xl * 2 - 8) / 2,
    height: (SCREEN_W - C.Space.xl * 2 - 8) / 2,
    borderRadius: C.Radii.xl,
  },

  // ── About card ──
  section: { marginHorizontal: C.Space.xl, marginBottom: C.Space.lg },
  sectionLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  bioText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.6,
  },
  bioInput: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.6,
    backgroundColor: "#F0EBF8",
    borderRadius: C.Radii.md,
    padding: C.Space.md,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // ── Interest picker trigger ──
  interestPickerTrigger: {
    backgroundColor: "#F0EBF8",
    borderRadius: C.Radii.md,
    padding: C.Space.md,
    minHeight: 48,
  },
  interestPlaceholder: { flexDirection: "row", alignItems: "center", gap: 8 },
  interestPlaceholderText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },

  // ── Tags ──
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },
  tagSelected: {
    backgroundColor: C.accent,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagSelectedText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  tagAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.accentLight,
  },
  tagAddText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },

  // ── Main interest ──
  mainInterestBlock: {
    marginTop: C.Space.md,
    paddingTop: C.Space.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.07)",
    gap: 8,
  },
  mainInterestHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  mainInterestTitle: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  mainInterestHint: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    lineHeight: 16,
  },
  mainChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0EBF8",
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  mainChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  mainChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },
  mainChipTextActive: { color: "#fff", fontFamily: C.Fonts.bodyBold },
  tagMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accent,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagMainText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  mainInterestCaption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  mainInterestCaptionText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  mainInterestCaptionStrong: {
    fontFamily: C.Fonts.bodyBold,
    color: C.accent,
  },

  // ── Socials card ──
  socialRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  socialDivider: {
    height: 1,
    backgroundColor: "rgba(124,58,237,0.07)",
    marginVertical: 14,
  },
  socialBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  socialContent: { flex: 1 },
  socialBrandName: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    marginBottom: 2,
  },
  socialHandleInput: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: C.accentLight,
    paddingVertical: 2,
  },
  socialHandleText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },
  socialHandleEmpty: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textTertiary,
  },

  // ── Student section ──
  verifiedBanner: {
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: C.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  verifiedBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    padding: C.Space.xl,
    gap: C.Space.lg,
  },
  verifiedBannerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: "#fff",
  },
  verifiedBannerSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
  pendingBanner: {
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    backgroundColor: C.amberMuted,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.lg,
  },
  pendingTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  pendingBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  studentCTA: { marginHorizontal: C.Space.xl, marginBottom: C.Space.lg },
  studentCTAInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: C.Space.lg,
    marginBottom: C.Space.lg,
  },
  studentCTAIcon: {
    width: 48,
    height: 48,
    borderRadius: C.Radii.md,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  studentCTATitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  studentCTABody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    lineHeight: C.FontSizes.sm * 1.5,
  },
  studentCTABtn: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  studentCTABtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },

  // ── Quiz banner ──
  quizBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.lg,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    shadowColor: C.accentPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  quizTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
  quizBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: "rgba(255,255,255,0.8)",
  },
  quizArrow: { fontFamily: C.Fonts.heading, fontSize: 24, color: "#fff" },

  // ── Tiles ──
  sectionHeading: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
    paddingHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    marginTop: C.Space.lg,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    marginTop: C.Space.lg,
  },
  sectionHeadingBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionHeadingText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  tilesRow: {
    flexDirection: "row",
    paddingHorizontal: C.Space.xl,
    gap: C.Space.lg,
    marginBottom: C.Space.lg,
  },
  tile: {
    flex: 1,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  tileGrad: {
    padding: C.Space.xl,
    alignItems: "center",
    gap: C.Space.sm,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tileLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },

  // ── Settings ──
  settingsCard: { marginHorizontal: C.Space.xl, marginBottom: C.Space.lg },
  settingRow: { flexDirection: "row", alignItems: "center", gap: C.Space.lg },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  // ── Danger ──
  dangerZone: {
    paddingHorizontal: C.Space.xl,
    paddingBottom: 40,
    gap: 8,
    alignItems: "center",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  deleteBtnText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.error,
  },

  // ── Interest picker modal ──
  pickerContainer: { flex: 1, backgroundColor: C.canvas },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: C.Space.xl,
    paddingVertical: C.Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    backgroundColor: C.surface,
  },
  pickerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  pickerDoneBtn: {
    backgroundColor: C.accent,
    borderRadius: C.Radii.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerDoneText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  pickerScroll: { flex: 1 },
  pickerScrollContent: { padding: C.Space.xl, paddingBottom: 60 },
  pickerCategory: { marginBottom: C.Space.xl },
  pickerCatLabel: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginBottom: 10,
  },
  pickerChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: C.Radii.full,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.12)",
  },
  pickerChipSelected: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  pickerChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  pickerChipTextSelected: { color: "#fff" },

  // ── Meta identity chips (view mode) ──
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },

  // ── Meta identity inputs (edit mode) ──
  metaEditCol: {
    width: "100%",
    gap: 8,
    paddingHorizontal: C.Space.xl,
    marginTop: 8,
  },
  metaInput: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    backgroundColor: "#F0EBF8",
    borderRadius: C.Radii.md,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 10,
    textAlign: "center",
  },

  // ── Stats cards ──
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    width: SCREEN_W - C.Space.xl * 2,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: C.Radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  statIconChip: {
    width: 38,
    height: 38,
    borderRadius: C.Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.accent,
    lineHeight: C.FontSizes.xl * 1.1,
  },
  statLabel: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // ── Prompt selector ──
  promptChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.Radii.full,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.15)",
  },
  promptChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  promptChipTextSelected: {
    color: "#fff",
    fontFamily: C.Fonts.bodyBold,
  },

  // ── Prompt label bar (view mode) ──
  promptLabelBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 8,
    borderRadius: C.Radii.md,
    marginBottom: 4,
  },
  promptDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // ── Delete modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(51,47,58,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: { width: "100%" },
  modalTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    marginBottom: 4,
  },
  modalBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginBottom: 16,
  },
  modalPrompt: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#EFEBF5",
    borderRadius: C.Radii.lg,
    padding: C.Space.lg,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: C.Radii.lg,
    backgroundColor: "#EFEBF5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: C.Radii.lg,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
});
