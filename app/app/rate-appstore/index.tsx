import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

export default function Rate() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Rate app</Text>

        <View style={{ width: 28 }} />
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ color: "#fff", marginBottom: 8 }}>Thanks for supporting us!</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://apps.apple.com/")}>
          <Text style={{ color: "#4f46e5" }}>Open App Store</Text>
        </TouchableOpacity>
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
});