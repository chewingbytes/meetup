import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Pencil, Settings, CreditCard, Bell, Moon, Phone, Star, Share2, LogOut } from "lucide-react-native";

import ListRow from "@/components/list-row";

export default function ProfileIndex() {
  const router = useRouter();

  function signOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          // placeholder: replace with auth sign out
          router.replace("/");
        },
      },
    ]);
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
            source={{ uri: "https://picsum.photos/seed/me/200/200" }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.name}>Alex Lee</Text>
            <Text style={styles.email}>alex.lee@example.com</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push("/edit-profile")}
          >
            <Pencil size={16} color="#4f46e5" />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
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
        <ListRow
          icon={Bell}
          title="Notifications"
          subtitle="Manage push & email"
          onPress={() => router.push("/preference-notification")}
        />
        <ListRow
          icon={Moon}
          title="Appearance"
          subtitle="Theme, text size"
          onPress={() => router.push("/preference-appearance")}
        />

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
        <TouchableOpacity style={styles.signOut} onPress={signOut}>
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
  sectionTitle: { color: "#999", marginTop: 8, marginBottom: 8, fontWeight: "600" },
  signOut: {
    marginTop: 18,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0b0b0b",
    alignItems: "flex-start",
  },
  signOutText: { color: "#ff6b6b", fontWeight: "700" },
});