import React, { useEffect, useState } from "react";
import MobileNav from "@/components/mobile-nav";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  User,
  Pencil,
  Settings,
  CreditCard,
  Bell,
  Moon,
  Phone,
  Star,
  Share2,
  LogOut,
  Calendar,
} from "lucide-react-native";
import ListRow from "@/components/list-row";
import { useAuth } from "@/lib/authContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfileIndex() {
  const router = useRouter();
  const {
    userProfile,
    userSettings,
    updateUserSettings,
    signOut,
    session,
    updateUserProfile,
  } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session]);

  useEffect(() => {
    if (userProfile) {
      setForm({
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        personality_type: userProfile.personality_type || "",
        social_preference: userProfile.social_preference || "",
        interests: Array.isArray(userProfile.interests)
          ? userProfile.interests.join(", ")
          : userProfile.interests || "",
        school: userProfile.school || "",
        year_of_study: userProfile.year_of_study || "",
      });
    }
  }, [userProfile]);

  const handleToggleNotification = async (
    type: "push_notifications" | "email_notifications"
  ) => {
    if (!userSettings) return;
    try {
      setIsUpdating(true);
      const newValue = !userSettings[type];
      await updateUserSettings({ [type]: newValue });
    } catch (error) {
      Alert.alert("Error", "Failed to update notification settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeAppearance = async (appearance: string) => {
    if (!userSettings) return;
    try {
      setIsUpdating(true);
      await updateUserSettings({ appearance });
    } catch (error) {
      Alert.alert("Error", "Failed to update appearance");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setEdit(false);
    if (userProfile) {
      setForm({
        full_name: userProfile.full_name || "",
        bio: userProfile.bio || "",
        personality_type: userProfile.personality_type || "",
        social_preference: userProfile.social_preference || "",
        interests: Array.isArray(userProfile.interests)
          ? userProfile.interests.join(", ")
          : userProfile.interests || "",
        school: userProfile.school || "",
        year_of_study: userProfile.year_of_study || "",
      });
    }
  };
  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateUserProfile({
        full_name: form.full_name,
        bio: form.bio,
        personality_type: form.personality_type,
        social_preference: form.social_preference,
        interests: form.interests
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        school: form.school,
        year_of_study: form.year_of_study,
      });
      setEdit(false);
      Alert.alert("Profile updated");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userProfile || !userSettings) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#FF8FA3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                userProfile.avatar_url ||
                "https://picsum.photos/seed/me/200/200",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>
              {userProfile.full_name || userProfile.username}
            </Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
            {userProfile.bio && (
              <Text style={styles.bio}>{userProfile.bio}</Text>
            )}
          </View>

          {/* Removed top edit button */}
        </View>

        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoBox}>
          <TouchableOpacity style={styles.profileEditFab} onPress={handleEdit}>
            <Pencil size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}></Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>
              {userProfile.full_name || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Bio</Text>
            <Text style={styles.infoValue}>{userProfile.bio || "Not set"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Personality</Text>
            <Text style={styles.infoValue}>
              {userProfile.personality_type || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Social Preference</Text>
            <Text style={styles.infoValue}>
              {userProfile.social_preference || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>
              {userProfile.school || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Year</Text>
            <Text style={styles.infoValue}>
              {userProfile.year_of_study || "Not set"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userProfile.created_at
                ? new Date(userProfile.created_at).toLocaleDateString()
                : "N/A"}
            </Text>
          </View>
        </View>

        <Modal
          visible={edit}
          animationType="fade"
          transparent
          onRequestClose={handleCancel}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
              >
                {[
                  { key: "full_name", label: "Full Name" },
                  { key: "bio", label: "Bio" },
                  { key: "personality_type", label: "Personality Type" },
                  { key: "social_preference", label: "Social Preference" },
                  { key: "interests", label: "Interests (comma separated)" },
                  { key: "school", label: "School" },
                  { key: "year_of_study", label: "Year of Study" },
                ].map((item, index) => (
                  <View key={item.key} style={styles.modalSlide}>
                    <Text style={styles.modalTitle}>{item.label}</Text>

                    <Input
                      value={form[item.key]}
                      onChangeText={(v) =>
                        setForm((f: any) => ({ ...f, [item.key]: v }))
                      }
                      style={styles.modalInput}
                      placeholder={`Enter ${item.label}`}
                      multiline={item.key === "bio"}
                    />

                    <Text style={styles.modalIndicator}>{index + 1} / 7</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  onPress={handleCancel}
                  variant="ghost"
                  disabled={isUpdating}
                  style={styles.cancelBtn}
                >
                  Cancel
                </Button>

                <Button
                  onPress={handleSave}
                  disabled={isUpdating}
                  style={styles.saveBtn}
                >
                  Save
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <ListRow
          icon={Calendar}
          title="My Events"
          subtitle="See all your events"
          onPress={() => router.push("/my-events")}
        />
        <ListRow
          icon={Star}
          title="My Testimonials"
          subtitle="Manage reviews & feedback"
          onPress={() => router.push("/settings/testimonials")}
        />
        <ListRow
          icon={User}
          title="Account settings"
          subtitle="Privacy, password"
          onPress={() => router.push("/account")}
        />
        <ListRow
          icon={CreditCard}
          title="Payment"
          subtitle="Manage cards, payouts"
          onPress={() => router.push("/payment-settings")}
        />

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>

        {/* Notifications */}
        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceTitle}>Push Notifications</Text>
            <Text style={styles.preferenceSubtitle}>Get push alerts</Text>
          </View>
          <Switch
            value={userSettings.push_notifications}
            onValueChange={() => handleToggleNotification("push_notifications")}
            disabled={isUpdating}
            trackColor={{ false: "#444", true: "#FF8FA3" }}
            thumbColor={userSettings.push_notifications ? "#fff" : "#888"}
          />
        </View>

        <View
          style={[
            styles.preferenceRow,
            { borderTopWidth: 1, borderTopColor: "#222", paddingTop: 12 },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceTitle}>Email Notifications</Text>
            <Text style={styles.preferenceSubtitle}>Get email updates</Text>
          </View>
          <Switch
            value={userSettings.email_notifications}
            onValueChange={() =>
              handleToggleNotification("email_notifications")
            }
            disabled={isUpdating}
            trackColor={{ false: "#444", true: "#FF8FA3" }}
            thumbColor={userSettings.email_notifications ? "#fff" : "#888"}
          />
        </View>

        {/* Appearance */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Appearance</Text>
        <View style={styles.appearanceContainer}>
          {["light", "dark", "auto"].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => handleChangeAppearance(mode)}
              style={[
                styles.appearanceOption,
                userSettings.appearance === mode &&
                  styles.appearanceOptionActive,
              ]}
              disabled={isUpdating}
            >
              <Text
                style={[
                  styles.appearanceOptionText,
                  userSettings.appearance === mode &&
                    styles.appearanceOptionTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Resources */}
        <Text style={styles.sectionTitle}>Resources</Text>
        <ListRow
          icon={Phone}
          title="Contact support"
          subtitle="Get help"
          onPress={() => router.push("/contact-support")}
        />
        <ListRow
          icon={Star}
          title="Rate in App Store"
          subtitle="Leave a review"
          onPress={() => router.push("/rate-appstore")}
        />
        <ListRow
          icon={Share2}
          title="App socials"
          subtitle="Follow us"
          onPress={() => router.push("/socials")}
        />

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <LogOut size={18} color="#ff6b6b" />
            <Text style={styles.signOutText}>Sign out</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>
      <MobileNav active="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  simpleHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  centerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  container: { padding: 20 },
  profileCard: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: { width: 72, height: 72, borderRadius: 14, backgroundColor: "#222" },
  name: { color: "#fff", fontWeight: "700", fontSize: 16 },
  email: { color: "#888", marginTop: 4 },
  bio: { color: "#aaa", marginTop: 2, fontSize: 12 },
  profileEditFab: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    color: "#999",
    marginTop: 18,
    marginBottom: 12,
    fontWeight: "600",
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: "#18181b",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#23232a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    color: "#888",
    fontSize: 14,
  },
  infoValue: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  inputEdit: {
    color: "#fff",
    backgroundColor: "#23232a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#333",
    marginLeft: 8,
    flex: 1,
  },
  editActionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
  },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 4,
  },
  cancelBtn: {
    backgroundColor: "#23232a",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  preferenceRow: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  preferenceTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  preferenceSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  appearanceContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  appearanceOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  appearanceOptionActive: {
    borderColor: "#FF8FA3",
  },
  appearanceOptionText: {
    color: "#888",
    fontWeight: "600",
    fontSize: 13,
  },
  appearanceOptionTextActive: {
    color: "#fff",
  },
  signOut: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0b0b0b",
    alignItems: "flex-start",
  },
  signOutText: { color: "#ff6b6b", fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: "#222",
    marginVertical: 10,
  },

  carouselOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 50,
  },

  slide: {
    width: Dimensions.get("window").width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  slideTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
  },

  carouselInput: {
    width: "100%",
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 18,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },

  slideIndicator: {
    marginTop: 20,
    color: "#666",
  },

  carouselActions: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#111",
    borderRadius: 20,
    paddingVertical: 40,
    overflow: "hidden",
  },

  modalSlide: {
    width: Dimensions.get("window").width - 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },

  modalInput: {
    width: "100%",
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },

  modalIndicator: {
    marginTop: 16,
    color: "#666",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
});
