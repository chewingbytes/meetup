import React, { useEffect } from "react";
import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/authContext";

const hero =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80";

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = Dimensions.get("window");
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/home");
      }
    }
  }, [isLoading, user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {/* Hero image */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <Image
            source={{ uri: hero }}
            style={{ width: "100%", height: height * 0.6 }}
            resizeMode="cover"
          />
          {/* Gradient overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)", "rgba(0,0,0,0.95)"]}
            style={{
              position: "absolute",
              inset: 0,
              justifyContent: "flex-end",
              paddingHorizontal: 24,
              paddingBottom: 32,
              gap: 12,
            }}
          >
            <Text className="text-white text-4xl font-bold leading-tight">
              Meet. Create. Thrive.
            </Text>
            <Text className="text-white/80 text-base">
              Find events, join communities, and make friends around your campus
              and beyond.
            </Text>
          </LinearGradient>
        </View>

        {/* Bottom actions */}
        <View style={{ padding: 20, gap: 12 }}>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <LinearGradient
              colors={["#4f46e5", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text className="text-white font-bold text-base">Log In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            style={{
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <Text className="text-white font-semibold text-base">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
