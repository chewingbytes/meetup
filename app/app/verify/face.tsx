import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const PALETTE = { coral: "#FF8FA3", white: "#FFFFFF", graphite: "#2C2C2C" };

export default function FaceVerify() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: PALETTE.white, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Face verification</Text>
      <Text style={{ color: "#6b7280", marginBottom: 20 }}>This is a placeholder for face/selfie verification. Use a real library for production.</Text>

      <TouchableOpacity onPress={() => router.replace("/create-profile" as any)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, borderRadius: 10, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white }}>Take selfie (mock)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/" as any)} style={{ paddingVertical: 12, borderRadius: 10 }}>
        <Text style={{ textAlign: "center", color: "#6b7280" }}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}
