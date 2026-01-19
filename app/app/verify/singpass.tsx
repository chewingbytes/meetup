import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

const PALETTE = { coral: "#FF8FA3", white: "#FFFFFF", graphite: "#2C2C2C" };

export default function SingpassVerify() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: PALETTE.white, justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Singpass verification</Text>
      <Text style={{ color: "#6b7280", marginBottom: 20 }}>This is a placeholder for the Singpass flow integration.
      </Text>

      <TouchableOpacity onPress={() => router.push("/verify/email" as any)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, borderRadius: 12, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white, fontWeight: "700" }}>Continue (mock)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/home" as any)} style={{ paddingVertical: 12, borderRadius: 12 }}>
        <Text style={{ textAlign: "center", color: "#6b7280" }}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}
