import { Stack } from "expo-router";
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
