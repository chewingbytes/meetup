import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { ChevronLeft, User, Pencil, Settings, CreditCard, Bell, Moon, Phone, Star, Share2, LogOut } from "lucide-react-native";
import ListRow from "@/components/list-row";
import { useAuth } from "@/lib/authContext";

export default function ProfileIndex() {
  const router = useRouter();
  const { userProfile, userSettings, updateUserSettings, signOut, session } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session]);

  const handleToggleNotification = async (type: "push_notifications" | "email_notifications") => {
    if (!userSettings) return;

    try {
      setIsUpdating(true);
      const newValue = !userSettings[type];
      await updateUserSettings({
        [type]: newValue,
      });
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
      await updateUserSettings({
        appearance,
      });
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

  if (!userProfile || !userSettings) {
    return (
      <SafeAreaView style={styles.root} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#FF8FA3" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Settings</Text>

        {/* spacer for centering */}
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri: userProfile.avatar_url || "https://picsum.photos/seed/me/200/200",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>{userProfile.full_name || userProfile.username}</Text>
            <Text style={styles.email}>{session?.user?.email}</Text>
            {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/edit-profile")}
          >
            <Pencil size={16} color="#4f46e5" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info Section */}
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{userProfile.username}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "#222", paddingTop: 8 }]}>
            <Text style={styles.infoLabel}>School</Text>
            <Text style={styles.infoValue}>{userProfile.bio || "Not set"}</Text>
          </View>
          <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "#222", paddingTop: 8 }]}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "N/A"}
            </Text>
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
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

        <View style={[styles.preferenceRow, { borderTopWidth: 1, borderTopColor: "#222", paddingTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceTitle}>Email Notifications</Text>
            <Text style={styles.preferenceSubtitle}>Get email updates</Text>
          </View>
          <Switch
            value={userSettings.email_notifications}
            onValueChange={() => handleToggleNotification("email_notifications")}
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
                userSettings.appearance === mode && styles.appearanceOptionActive,
              ]}
              disabled={isUpdating}
            >
              <Text
                style={[
                  styles.appearanceOptionText,
                  userSettings.appearance === mode && styles.appearanceOptionTextActive,
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

        <View style={{ height: 60 }} />
      </ScrollView>
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
  editBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#0b0b0b",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  editText: { color: "#4f46e5", fontWeight: "700", marginLeft: 6 },
  sectionTitle: { color: "#999", marginTop: 18, marginBottom: 12, fontWeight: "600", fontSize: 12 },
  infoBox: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
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
});
