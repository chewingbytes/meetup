import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const PALETTE = { coral: "#FF8FA3", white: "#FFFFFF", graphite: "#2C2C2C" };

export default function EmailVerify() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: PALETTE.white, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Email verification</Text>
      <Text style={{ color: "#6b7280", marginBottom: 12 }}>Enter email to receive a one-time code (mock).</Text>

      <TextInput value={email} onChangeText={setEmail} placeholder="you@school.edu" style={{ borderWidth: 1, borderColor: "#eee", padding: 12, borderRadius: 10, marginBottom: 12 }} />
      <TouchableOpacity onPress={() => alert('Mock code sent to ' + email)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, borderRadius: 10, marginBottom: 12 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white }}>Send code</Text>
      </TouchableOpacity>

      <TextInput value={code} onChangeText={setCode} placeholder="Enter code" style={{ borderWidth: 1, borderColor: "#eee", padding: 12, borderRadius: 10, marginBottom: 12 }} />
      <TouchableOpacity onPress={() => router.push("/verify/face" as any)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, borderRadius: 10 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white }}>Verify (mock)</Text>
      </TouchableOpacity>
    </View>
  );
}
