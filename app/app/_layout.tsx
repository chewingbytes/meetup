import { Stack } from "expo-router";
import "../global.css";
export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // 👈 this removes the top bar globally
          animation: "none"
        }}
      />
    </>
  );
}
