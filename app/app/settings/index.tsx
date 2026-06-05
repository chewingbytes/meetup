/**
 * Profile / Settings screen — clay aesthetic.
 *
 * Layout:
 *   - Gradient hero header with avatar
 *   - Clay profile card (name, bio, interests)
 *   - Student verification section
 *   - Archives & settings tiles
 */

import { PullToRefresh } from "@/components/pull-to-refresh";
import { NeoButtonLoader, NeoLoader } from "@/components/ui/neo-loader";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayBackground } from "@/components/ui/clay-background";
import { C } from "@/theme/clay";
import { deleteProfile } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { getAvatarPublicUrl, uploadAvatarImage } from "@/lib/supabaseStorage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Camera,
  ChevronLeft,
  GraduationCap,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try { await Promise.all([fetchUserProfile(), fetchUserSettings()]); }
    finally { setIsRefreshing(false); }
  }, [fetchUserProfile, fetchUserSettings]);

  useEffect(() => {
    if (!session) router.replace("/login");
  }, [session]);

  useEffect(() => {
    if (userProfile) {
      setForm({
        username: userProfile.username || "",
        bio: userProfile.bio || "",
        school: userProfile.school || "",
        year_of_study: userProfile.year_of_study || "",
        interests: Array.isArray(userProfile.interests)
          ? userProfile.interests.join(", ")
          : userProfile.interests || "",
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateUserProfile({
        username: form.username,
        bio: form.bio,
        school: form.school,
        year_of_study: form.year_of_study,
        interests: form.interests
          ? form.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
      });
      setIsEditing(false);
      Alert.alert("Saved!", "Your profile is updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile");
    } finally { setIsUpdating(false); }
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
      { text: "Sign out", style: "destructive", onPress: async () => { await signOut(); router.replace("/"); } },
    ]);
  };

  const handleVerify = () => router.push("/verify/singpass" as any);

  const resolveAvatarUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    try { return getAvatarPublicUrl(url); } catch { return null; }
  };

  const handleEditImage = async () => {
    if (!session?.user?.id) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission required", "Allow photo access to update your avatar.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      setIsUploadingAvatar(true);
      const uploaded = await uploadAvatarImage(session.user.id, result.assets[0].uri);
      await updateUserProfile({ avatar_url: uploaded.publicUrl });
      Alert.alert("Done!", "Avatar updated.");
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message || "Could not upload image.");
    } finally { setIsUploadingAvatar(false); }
  };

  const toggleNotification = async () => {
    if (!userSettings) return;
    try { await updateUserSettings({ push_notifications: !userSettings.push_notifications }); }
    catch {}
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
  const displayBio = userProfile.bio?.trim() || "";
  const interestList = Array.isArray(userProfile.interests)
    ? userProfile.interests.filter(Boolean)
    : [];
  const avatarUrl = resolveAvatarUrl(userProfile.avatar_url);
  const isVerified = userProfile.verified === "true";
  const isPending = userProfile.verified === "pending";
  const needsQuiz = !userProfile?.personality_answers || !userProfile?.personality_type;

  return (
    <ClayBackground>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.headerActionBtn}>
              <X size={18} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isUpdating}
              style={[styles.headerActionBtn, { backgroundColor: C.accentGreen }]}
            >
              {isUpdating ? <NeoButtonLoader color="#fff" /> : <Save size={18} color="#fff" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerActionBtn}>
            <Pencil size={18} color={C.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 72 }]}
        refreshControl={<PullToRefresh isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name Hero ── */}
        <View style={styles.avatarHero}>
          <Pressable onPress={isEditing ? handleEditImage : undefined} style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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
                {isUploadingAvatar
                  ? <NeoButtonLoader color="#fff" />
                  : <Camera size={20} color="#fff" strokeWidth={2.5} />}
              </View>
            )}
            {/* Verification pip */}
            {isVerified && (
              <View style={styles.verifiedPip}>
                <BadgeCheck size={14} color="#fff" strokeWidth={2.5} />
              </View>
            )}
          </Pressable>

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
            {userProfile.personality_type && (
              <View style={styles.personalityBadge}>
                <Text style={styles.personalityText}>{userProfile.personality_type}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Bio Card ── */}
        <ClayCard style={styles.section} elevated>
          <Text style={styles.sectionLabel}>About</Text>
          {isEditing ? (
            <TextInput
              value={form.bio}
              onChangeText={(t) => setForm({ ...form, bio: t })}
              multiline
              style={styles.bioInput}
              placeholder="Tell people about yourself…"
              placeholderTextColor={C.textTertiary}
            />
          ) : (
            <Text style={styles.bioText}>{displayBio || "No bio yet."}</Text>
          )}

          {/* Interests */}
          <Text style={[styles.sectionLabel, { marginTop: C.Space.xl }]}>Interests</Text>
          {isEditing ? (
            <TextInput
              value={form.interests}
              onChangeText={(t) => setForm({ ...form, interests: t })}
              style={styles.interestInput}
              placeholder="Art, Music, Tech, …"
              placeholderTextColor={C.textTertiary}
            />
          ) : interestList.length > 0 ? (
            <View style={styles.tagsRow}>
              {interestList.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bioText}>No interests added yet.</Text>
          )}
        </ClayCard>

        {/* ── Student verification section ── */}
        {isVerified ? (
          <View style={styles.verifiedBanner}>
            <LinearGradient colors={C.Gradients.green} style={styles.verifiedBannerGrad}>
              <BadgeCheck size={24} color="#fff" strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedBannerTitle}>Student Verified</Text>
                <Text style={styles.verifiedBannerSub}>Student-only spaces are unlocked</Text>
              </View>
            </LinearGradient>
          </View>
        ) : isPending ? (
          <View style={styles.pendingBanner}>
            <ShieldCheck size={22} color={C.accentAmber} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Verification in review</Text>
              <Text style={styles.pendingBody}>We'll notify you once approved.</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handleVerify} activeOpacity={0.85} style={styles.studentCTA}>
            <ClayCard elevated radius={C.Radii.xxl} padding={C.Space.xl}>
              <View style={styles.studentCTAInner}>
                <View style={styles.studentCTAIcon}>
                  <GraduationCap size={24} color={C.accent} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentCTATitle}>Are you a student?</Text>
                  <Text style={styles.studentCTABody}>
                    Verify your student status to unlock exclusive hangouts and safer spaces.
                  </Text>
                </View>
              </View>
              <View style={styles.studentCTABtn}>
                <Text style={styles.studentCTABtnText}>Get verified →</Text>
              </View>
            </ClayCard>
          </TouchableOpacity>
        )}

        {/* ── Personality quiz nudge ── */}
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
                <Text style={styles.quizBody}>Take the personality quiz to unlock your type.</Text>
              </View>
              <Text style={styles.quizArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── Archive tiles ── */}
        <Text style={styles.sectionHeading}>My Space</Text>
        <View style={styles.tilesRow}>
          {[
            { label: "Hangouts", icon: Trophy, color: C.Gradients.amber, onPress: () => router.push("/my-events" as any) },
            { label: "Host", icon: Star, color: C.Gradients.primary, onPress: () => router.push("/host/dashboard" as any) },
          ].map((tile) => (
            <TouchableOpacity key={tile.label} onPress={tile.onPress} style={styles.tile} activeOpacity={0.85}>
              <LinearGradient colors={tile.color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tileGrad}>
                <tile.icon size={24} color="#fff" strokeWidth={2} />
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Settings ── */}
        <Text style={styles.sectionHeading}>Settings</Text>
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
              thumbColor={userSettings?.push_notifications ? C.accent : "#9CA3AF"}
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

      {/* ── Delete confirmation modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
      >
        <View style={styles.modalOverlay}>
          <ClayCard elevated radius={C.Radii.xxl} padding={C.Space.xxl} style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalBody}>This is permanent and cannot be undone.</Text>
            <Text style={styles.modalPrompt}>
              Type <Text style={{ color: C.error, fontFamily: C.Fonts.bodyBold }}>delete</Text> to confirm:
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
                onPress={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleteConfirmText.toLowerCase() !== "delete" || isDeleting}
                style={[
                  styles.modalConfirmBtn,
                  { opacity: deleteConfirmText.toLowerCase() === "delete" ? 1 : 0.4 },
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
  loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.canvas, gap: 20 },
  loaderLogout: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.accentMuted, borderRadius: C.Radii.lg },
  loaderLogoutText: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.base, color: C.accent },

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

  scroll: {
    paddingBottom: 60,
  },

  // ── Avatar Hero ──
  avatarHero: {
    alignItems: "center",
    paddingTop: C.Space.xxl,
    paddingBottom: C.Space.xl,
    gap: C.Space.lg,
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
  avatarInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 38,
    color: "#fff",
  },
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

  // ── Bio card ──
  section: {
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
  },
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
  interestInput: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    backgroundColor: "#F0EBF8",
    borderRadius: C.Radii.md,
    padding: C.Space.md,
  },
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
  verifiedBannerTitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.lg, color: "#fff" },
  verifiedBannerSub: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: "rgba(255,255,255,0.8)" },
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
  pendingTitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.base, color: C.textPrimary },
  pendingBody: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: C.textSecondary },
  studentCTA: {
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
  },
  studentCTAInner: { flexDirection: "row", alignItems: "flex-start", gap: C.Space.lg, marginBottom: C.Space.lg },
  studentCTAIcon: {
    width: 48,
    height: 48,
    borderRadius: C.Radii.md,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  studentCTATitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.lg, color: C.textPrimary },
  studentCTABody: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: C.textSecondary, lineHeight: C.FontSizes.sm * 1.5 },
  studentCTABtn: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  studentCTABtnText: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.sm, color: C.accent },

  // ── Quiz banner ──
  quizBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.lg,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    shadowColor: C.accentPink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 6,
  },
  quizTitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.base, color: "#fff" },
  quizBody: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: "rgba(255,255,255,0.8)" },
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
  tileLabel: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.sm, color: "#fff" },

  // ── Settings ──
  settingsCard: {
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.lg,
  },
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

  // ── Delete modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(51,47,58,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: { width: "100%" },
  modalTitle: { fontFamily: C.Fonts.heading, fontSize: C.FontSizes.xl, color: C.textPrimary, marginBottom: 4 },
  modalBody: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.sm, color: C.textSecondary, marginBottom: 16 },
  modalPrompt: { fontFamily: C.Fonts.body, fontSize: C.FontSizes.base, color: C.textPrimary, marginBottom: 8 },
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
  modalCancelText: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.base, color: C.textSecondary },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: C.Radii.lg,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.base, color: "#fff" },
});
