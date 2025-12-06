import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

const PALETTE = { coral: "#FF8FA3", white: "#FFFFFF", graphite: "#2C2C2C", lightGrey: "#F5F5F5" };

export default function CreateProfile() {
  const router = useRouter();
  const [bio, setBio] = useState("");

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: PALETTE.white }}>
      <Text style={{ fontSize: 22, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Create your profile</Text>
      <Text style={{ color: "#6b7280", marginBottom: 12 }}>Add a short bio and profile picture.</Text>

      <View style={{ alignItems: "center", marginBottom: 18 }}>
        <Image source={{ uri: "https://via.placeholder.com/120" }} style={{ width: 120, height: 120, borderRadius: 999, marginBottom: 8 }} />
        <TouchableOpacity onPress={() => alert("Replace with image picker") } style={{ paddingVertical: 8 }}>
          <Text style={{ color: PALETTE.coral }}>Upload photo</Text>
        </TouchableOpacity>
      </View>

      <Text style={{ marginBottom: 6 }}>Short bio</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="I like study groups & coffee..." style={{ borderWidth: 1, borderColor: PALETTE.lightGrey, padding: 12, borderRadius: 10, marginBottom: 18 }} multiline numberOfLines={3} />

      <TouchableOpacity onPress={() => router.replace("/" as any)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 14, borderRadius: 12 }}>
        <Text style={{ textAlign: "center", color: PALETTE.white, fontWeight: "700" }}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}
