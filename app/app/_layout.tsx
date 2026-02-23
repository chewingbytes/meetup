import { Stack } from "expo-router";

import { AuthProvider } from "@/lib/authContext";

import "../global.css";

// import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

export default function RootLayout() {
  // const [fontsLoaded] = useFonts({
  //   SpaceGrotesk_700Bold,
  // });

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,

          animation: "none",
          // Neo-brutalist cream background

          contentStyle: { backgroundColor: "#FFFDF5" },
        }}
      />
    </AuthProvider>
  );
}
