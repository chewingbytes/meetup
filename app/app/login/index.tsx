import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/authContext";
import { validateSingaporeSchoolEmail } from "@/lib/schoolEmailValidation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (!validateSingaporeSchoolEmail(email)) {
        Alert.alert(
          "Invalid Email",
          "Please use a valid Singapore school email"
        );
        return;
      }

      setIsLoading(true);

      const { user, error } = await signIn(email, password);

      if (error) {
        Alert.alert("Sign In Error", error.message || "Failed to sign in");
        return;
      }

      if (user) {
        if (!user.email_confirmed_at) {
          await AsyncStorage.setItem("pending_email_verification", email);
          router.push("/verify/email");
        } else {
          router.replace("/home");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Header */}
          <View className="px-5 pt-4 pb-8">
            <TouchableOpacity onPress={() => router.back()} className="mb-8">
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>

            <Text className="text-white text-4xl font-bold mb-2">
              Welcome Back
            </Text>
            <Text className="text-white/60 text-base">Sign in to continue</Text>
          </View>

          {/* Form */}
          <View className="flex-1 px-5">
            {/* Email */}
            <View className="mb-5">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                School Email
              </Text>
              <TextInput
                placeholder="name@school.edu.sg"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base"
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Password
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#999" />
                  ) : (
                    <Eye size={20} color="#999" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={isLoading}
              className="mb-4"
            >
              <LinearGradient
                colors={isLoading ? ["#333", "#333"] : ["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-white/60 text-sm">
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/register")}
                disabled={isLoading}
              >
                <Text className="text-indigo-400 font-semibold text-sm">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
