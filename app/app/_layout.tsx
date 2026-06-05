import { Stack } from "expo-router";
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts as useNunito,
} from "@expo-google-fonts/nunito";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts as useDMSans,
} from "@expo-google-fonts/dm-sans";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider } from "@/lib/authContext";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [nunitoLoaded] = useNunito({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const [dmSansLoaded] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const fontsLoaded = nunitoLoaded && dmSansLoaded;

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: { backgroundColor: "#F4F1FA" },
        }}
      />
    </AuthProvider>
  );
}
