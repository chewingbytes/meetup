import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function PreferencesNotifications() {
  const router = useRouter();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Notifications</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={{ padding: 20 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Push notifications</Text>
          <Switch value={push} onValueChange={setPush} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Email notifications</Text>
          <Switch value={email} onValueChange={setEmail} />
        </View>
      </View>
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
  centerTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  row: {
    backgroundColor: "#0f0f0f",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { color: "#fff" },
});