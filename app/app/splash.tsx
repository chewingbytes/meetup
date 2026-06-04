import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useAuth } from "@/lib/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const { session, isLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      // Add delay to show splash screen
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Check if onboarding was completed
      const onboardingData = await AsyncStorage.getItem("onboarding_data");
      setOnboardingDone(!!onboardingData);

      // Route based on auth state
      if (session?.user) {
        // User is logged in, go to home
        router.replace("/");
      } else if (onboardingData) {
        // Onboarding done but not logged in, go to login
        router.replace("/login");
      } else {
        // New user, go to welcome/onboarding
        router.replace("/main");
      }
    };

    if (!isLoading) {
      checkAuthAndOnboarding();
    }
  }, [isLoading, session]);

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.apricot, alignItems: "center", justifyContent: "center" }}>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 40, fontWeight: "900", color: PALETTE.white }}>meetup</Text>
        <Text style={{ color: "rgba(255,255,255,0.9)", marginTop: 8 }}>Meet your people. For real.</Text>
      </View>

      {isLoading && (
        <View style={{ position: "absolute", bottom: 60 }}>
          <NeoLoader />
        </View>
      )}

      {!isLoading && (
        <TouchableOpacity
          onPress={async () => {
            // Skip to welcome
            const onboardingData = await AsyncStorage.getItem("onboarding_data");
            if (onboardingData || session?.user) {
              router.replace("/login");
            } else {
              router.replace("/");
            }
          }}
          style={{ position: "absolute", bottom: 60, backgroundColor: PALETTE.coral, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }}
        >
          <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Get started</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
