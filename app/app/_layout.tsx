import { Stack } from "expo-router";
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { AuthProvider } from "@/lib/authContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none"
        }}
      />
    </AuthProvider>
  );
}
