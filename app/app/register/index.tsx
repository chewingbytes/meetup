import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { validateSingaporeSchoolEmail } from "@/lib/schoolEmailValidation";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProceedToOnboarding = () => {
    // if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
    //   Alert.alert("Error", "Please fill in all fields");
    //   return;
    // }

    // if (!validateSingaporeSchoolEmail(email)) {
    //   Alert.alert("Invalid Email", "Please use a valid Singapore school email");
    //   return;
    // }

    // if (password.length < 8) {
    //   Alert.alert("Error", "Password must be at least 8 characters");
    //   return;
    // }

    // if (password !== confirmPassword) {
    //   Alert.alert("Error", "Passwords do not match");
    //   return;
    // }

    router.push({
      pathname: "/onboarding",
      params: { email, password },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={["top"]}>
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
              Create Account
            </Text>
            <Text className="text-white/60 text-base">
              Sign up with your school email
            </Text>
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
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base"
              />
            </View>

            {/* Password */}
            <View className="mb-5">
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

            {/* Confirm Password */}
            <View className="mb-6">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Confirm Password
              </Text>
              <View className="relative">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base pr-12"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-4"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#999" />
                  ) : (
                    <Eye size={20} color="#999" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Box */}
            <View className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
              <Text className="text-indigo-300 text-xs leading-5">
                🔐 Password must be at least 8 characters
              </Text>
              <Text className="text-indigo-300 text-xs leading-5 mt-1">
                🎓 Only Singapore school emails allowed
              </Text>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleProceedToOnboarding}
              className="mb-4"
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={["#4f46e5", "#7c3aed"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    alignSelf: "flex-start", // 👈 shrink to content
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                  }}
                >
                  <Text className="text-white font-bold text-base">
                    Next
                  </Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-white/60 text-sm">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text className="text-indigo-400 font-semibold text-sm">
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
