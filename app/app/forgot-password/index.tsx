import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Mail, AlertTriangle } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { NeoButtonLoader } from "@/components/ui/neo-loader";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("BRUH", "Enter a valid email address fr.");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Pass email to next screen via params
      router.push({
        pathname: "/forgot-password/verify",
        params: { email },
      });
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="flex-grow p-6">
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              router.back();
            }}
            className="mb-8 self-start active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_#000]"
          >
            <View className="bg-white border-4 border-black p-3">
              <ArrowLeft size={24} color="#000" strokeWidth={3} />
            </View>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-10 relative">
            <View className="absolute -top-6 -right-2 rotate-12 bg-neo-yellow border-4 border-black px-3 py-1 z-10 shadow-[4px_4px_0px_0px_#000]">
              <Text className="font-bold text-xs">iykyk</Text>
            </View>
            <Text className="text-5xl font-black uppercase text-black leading-[0.9] tracking-tighter mb-4 pt-4">
              Forgot{" "}
              <Text className="text-neo-red italic underline decoration-4 decoration-black">
                Password?
              </Text>
            </Text>
            <View className="bg-neo-violet border-4 border-black p-4 rotate-1 shadow-[6px_6px_0px_0px_#000] self-start">
              <Text className="text-black font-bold uppercase tracking-widest text-sm">
                Don't panic. We gotchu fam.
              </Text>
            </View>
          </View>

          {/* Card */}
          <View className="bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000 relative">
            {/* Decorative elements */}
            <View className="absolute -top-3 -left-3 w-6 h-6 bg-neo-green border-2 border-black" />
            <View className="absolute -bottom-3 -right-3 w-6 h-6 bg-neo-coral border-2 border-black" />

            <View className="flex-row items-center gap-2 mb-6">
              <View className="bg-black p-2 rounded-none">
                <AlertTriangle color="yellow" size={24} />
              </View>
              <Text className="font-bold text-lg uppercase flex-1">
                Recovery Protocol
              </Text>
            </View>

            <Text className="font-medium text-black/70 mb-6 leading-5">
              Enter user email to initiate memory wipe sequence... wait, no,
              just sending a code.
            </Text>

            {/* Email Input */}
            <View className="gap-2 mb-8">
              <Text className="font-bold text-sm uppercase tracking-wider text-black">
                Target Email Address
              </Text>
              <View className="relative justify-center">
                <Input
                  placeholder="YOU@EXAMPLE.COM"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  className="bg-neo-bg pr-12"
                />
                <View className="absolute right-4 top-4 pointer-events-none">
                  <Mail size={24} color="#000" strokeWidth={2.5} />
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={isLoading}
              className={`bg-black border-4 border-black p-4 flex-row items-center justify-center shadow-[6px_6px_0px_0px_#999] active:translate-y-[2px] active:shadow-none ${isLoading ? "opacity-80" : ""}`}
            >
              {isLoading ? (
                <NeoButtonLoader color="white" />
              ) : (
                <Text className="text-white font-black text-xl uppercase tracking-widest">
                  Send Recovery Code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
