import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function PreferencesAppearance() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Appearance</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ color: "#fff" }}>Theme and text-size options (placeholder).</Text>
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
});