import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { validateSingaporeSchoolEmail } from "@/lib/schoolEmailValidation";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProceedToOnboarding = () => {
    // Validation logic (simplified for UI demo)
    if (!email.trim() || !password.trim()) {
      // Alert.alert("Error", "Required");
    }
    router.push({
      pathname: "/onboarding",
      params: { email, password },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View className="flex-grow p-6">
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
        <View className="mb-10">
          <Text className="text-6xl font-black uppercase text-black leading-[0.9] tracking-tighter mb-4 pt-1">
            Join{" "}
            <Text className="text-neo-red underline decoration-4 decoration-black underline-offset-4">
              The
            </Text>{" "}
            Club.
          </Text>
          <View className="bg-neo-yellow border-4 border-black p-4 rotate-1 shadow-[4px_4px_0px_0px_#000] self-start max-w-[80%]">
            <Text className="text-black font-bold uppercase tracking-widest leading-tight">
              School Email Only!
            </Text>
          </View>
        </View>

        {/* Card */}
        <View className="bg-white border-4 border-black p-6 mb-6 shadow-[8px_8px_0px_0px_#000]">
          {/* Email */}
          <View className="mb-6 gap-2">
            <Text className="font-bold text-lg uppercase tracking-wider text-black">
              School Email
            </Text>
            <Input
              placeholder="you@school.edu.sg"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View className="mb-6 gap-2">
            <Text className="font-bold text-lg uppercase tracking-wider text-black">
              Password
            </Text>
            <View className="relative justify-center">
              <Input
                placeholder="Create password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                className="pr-12"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 z-10"
                style={{ top: 20 }}
              >
                {showPassword ? (
                  <EyeOff size={24} color="#000" strokeWidth={3} />
                ) : (
                  <Eye size={24} color="#000" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-8 gap-2">
            <Text className="font-bold text-lg uppercase tracking-wider text-black">
              Confirm Password
            </Text>
            <View className="relative justify-center">
              <Input
                placeholder="Repeat password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                className="pr-12"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 z-10"
                style={{ top: 20 }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={24} color="#000" strokeWidth={3} />
                ) : (
                  <Eye size={24} color="#000" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Button
            onPress={handleProceedToOnboarding}
            className="w-full" // Neo Green isn't defined, fallback to default or add logic? Button uses variants.
            variant="default" // Red
          >
            START ONBOARDING
          </Button>
        </View>

        {/* Login Link */}
        <View className="mt-4 flex-row justify-center items-center gap-2 mb-10">
          <Text className="font-medium text-black/60 uppercase">
            Already a member?
          </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="font-black underline decoration-4 decoration-neo-yellow text-lg uppercase">
              Log In
            </Text>
          </TouchableOpacity>
        </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
