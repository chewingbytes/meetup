import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.white, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 34, fontWeight: "900", color: PALETTE.graphite, marginBottom: 8 }}>Welcome to meetup</Text>
      <Text style={{ color: "#6b7280", marginBottom: 24 }}>Find events, groups and people that actually fit your vibe.</Text>

      <TouchableOpacity onPress={() => router.push("/onboarding" as any)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 14, borderRadius: 12, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white, fontWeight: "700" }}>Create account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login" as any)} style={{ paddingVertical: 14, borderRadius: 12 }}>
        <Text style={{ textAlign: "center", color: "#6b7280" }}>I already have an account</Text>
      </TouchableOpacity>
    </View>
  );
}
