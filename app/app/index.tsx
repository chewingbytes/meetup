import React, { useEffect } from "react";
import { View, Text, Image, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";

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
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top", "bottom"]}>
      <View className="flex-grow justify-between p-6">
        <View className="items-center mb-8 relative">
          <View className="absolute top-0 right-0 z-10 rotate-12">
            <View className="bg-neo-yellow border-4 border-black p-2 self-start shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Text className="text-xl font-bold uppercase tracking-widest">
                Hangout!
              </Text>
            </View>
          </View>
          <View className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-neo-red border-4 border-black z-10" />

          <View className="border-4 border-black bg-white p-2 w-full -rotate-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Image
              source={{ uri: hero }}
              style={{ width: "100%", height: height * 0.4 }}
              resizeMode="cover"
              className="border-2 border-black"
            />
          </View>
        </View>

        {/* Text Content */}
        <View className="mb-12 space-y-4">
          <Text className="text-5xl font-black uppercase text-black leading-[0.9] tracking-tighter pt-1">
            Meet. <Text className="text-neo-red italic">Create.</Text> Thrive.
          </Text>
          <View className="bg-white border-4 border-black p-4 rotate-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4">
            <Text className="text-black text-xl font-bold leading-tight">
              Find events and join new communities{" "}
              <Text className="text-red-500">safely and securely.</Text>
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="gap-4 w-full">
          <Button
            onPress={() => router.push("/login")}
            variant="default"
            size="lg"
            className="w-full"
          >
            Log In
          </Button>

          <Button
            onPress={() => router.push("/register")}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            Sign Up
          </Button>
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-xs font-bold uppercase tracking-widest text-black/50">
            Hangout! © 2026
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
