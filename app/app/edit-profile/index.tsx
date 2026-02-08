import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function EditProfile() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Edit profile</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={{ padding: 20 }}>
        <Image source={{ uri: "https://picsum.photos/seed/me/200/200" }} style={styles.avatar} />
        <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#777" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#777" keyboardType="email-address" />
        <TouchableOpacity style={styles.save} onPress={() => Alert.alert("Saved")}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  simpleHeader: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  centerTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  avatar: { width: 96, height: 96, borderRadius: 14, backgroundColor: "#222", marginBottom: 12 },
  input: { backgroundColor: "#0f0f0f", color: "#fff", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#1a1a1a" },
  save: { backgroundColor: "#4f46e5", padding: 12, borderRadius: 10, alignItems: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
});