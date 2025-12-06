import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

export default function Splash() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/welcome" as any);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.apricot, alignItems: "center", justifyContent: "center" }}>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 40, fontWeight: "900", color: PALETTE.white }}>meetup</Text>
        <Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 8 }}>Meet your people. For real.</Text>
      </View>

      <TouchableOpacity onPress={() => router.replace("/welcome" as any)} style={{ position: "absolute", bottom: 60, backgroundColor: PALETTE.coral, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }}>
        <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}
