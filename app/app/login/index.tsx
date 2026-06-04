import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Ensure Input is correctly implemented
import { useAuth } from "@/lib/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Import Card components
// Assuming Card is in components/ui/card.tsx
// I will just use View with classes if importing Card fails or is complicated with path aliases in new file

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

      // Mock validation logic check if needed
      // if (!validateSingaporeSchoolEmail(email)) { ... }

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
          router.replace("/");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
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
                  Access{" "}
                  <Text className="text-neo-yellow underline decoration-4 decoration-black underline-offset-4">
                    Point
                  </Text>
                </Text>
                <View className="bg-neo-violet border-4 border-black p-4 -rotate-1 shadow-[4px_4px_0px_0px_#000] self-start">
                  <Text className="text-black font-bold uppercase tracking-widest">
                    Login Required
                  </Text>
                </View>
              </View>

              {/* Form Card */}
              <View className="bg-white border-4 border-black p-6 mb-6 shadow-[8px_8px_0px_0px_#000]">
                {/* Email */}
                <View className="gap-2 mb-6">
                  <Text className="font-bold text-lg uppercase tracking-wider text-black">
                    Email Address
                  </Text>
                  <Input
                    placeholder="STUDENT@SCHOOL.EDU.SG"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="bg-neo-bg"
                  />
                </View>

                {/* Password */}
                <View className="gap-2 mb-8">
                  <Text className="font-bold text-lg uppercase tracking-wider text-black">
                    Password
                  </Text>
                  <View className="relative justify-center">
                    <Input
                      placeholder="••••••••"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      className="bg-neo-bg pr-12"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)} // Toggle visibility
                      className="absolute right-4 z-10"
                      style={{ top: 20 }} // Manual adjust for center
                    >
                      {showPassword ? (
                        <EyeOff size={24} color="#000" strokeWidth={3} />
                      ) : (
                        <Eye size={24} color="#000" strokeWidth={3} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="self-end mb-6"
                  onPress={() => router.push("/forgot-password")}
                >
                  <Text className="font-bold underline decoration-2 decoration-black uppercase tracking-wide">
                    FORGOT PASSWORD?
                  </Text>
                </TouchableOpacity>

                <Button
                  onPress={handleSignIn}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "LOADING..." : "ENTER SYSTEM"}
                </Button>
              </View>

              {/* Footer Link */}
              <View className="mt-8 flex-row justify-center items-center gap-2 mb-10">
                <Text className="font-medium text-black/60 uppercase">
                  No credentials?
                </Text>
                <TouchableOpacity onPress={() => router.push("/register")}>
                  <Text className="font-black underline decoration-4 decoration-neo-red text-lg uppercase">
                    Register Now
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
