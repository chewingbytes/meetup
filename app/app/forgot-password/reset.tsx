import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Lock, Key } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { useAuth } from "@/lib/authContext";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { signIn } = useAuth(); // Assuming signIn is available to auto-login if needed, or just redirect
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Missing Info", "Type something, genius.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords don't match. Try again.");
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
        setIsLoading(false);
        // Navigate home (auto-login simulation)
        // In real app, you would call updatePassword(password) then signIn(email, password)
        router.replace("/"); 
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="p-6 h-full justify-between">
          
          <View>
            {/* Back Button (optional, maybe not allowed here in secure flow but let's keep it) */}
            <TouchableOpacity onPress={() => router.back()} className="mb-8 self-start">
                <View className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none">
                <ArrowLeft size={24} color="#000" strokeWidth={3} />
                </View>
            </TouchableOpacity>

            {/* Header */}
            <View className="mb-10">
                <View className="bg-neo-red border-4 border-black px-4 py-2 -rotate-2 self-start mb-4 shadow-[4px_4px_0px_0px_#000]">
                    <Text className="font-bold uppercase text-white tracking-widest text-xs">
                        Final Step
                    </Text>
                </View>
                <Text className="text-5xl font-black uppercase text-black leading-tight tracking-tighter mb-4">
                Fresh <Text className="text-neo-green underline decoration-4 decoration-black">Start</Text>
                </Text>
                <Text className="text-base font-medium text-black/60 uppercase">
                    Create a new password. Make it lengthy.
                </Text>
            </View>

            {/* Form */}
            <View className="bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000] rotate-1">
                <View className="gap-2 mb-6">
                    <Text className="font-bold text-sm uppercase tracking-wider text-black">
                        New Password
                    </Text>
                    <View className="relative justify-center">
                        <Input
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="bg-neo-bg pr-12"
                        />
                        <View className="absolute right-4 top-4 pointer-events-none">
                            <Lock size={20} color="#000" strokeWidth={2.5} />
                        </View>
                    </View>
                </View>

                <View className="gap-2 mb-8">
                    <Text className="font-bold text-sm uppercase tracking-wider text-black">
                        Confirm Password
                    </Text>
                    <View className="relative justify-center">
                        <Input
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            className="bg-neo-bg pr-12"
                        />
                        <View className="absolute right-4 top-4 pointer-events-none">
                            <Key size={20} color="#000" strokeWidth={2.5} />
                        </View>
                    </View>
                </View>

                <TouchableOpacity 
                    onPress={handleReset} 
                    disabled={isLoading}
                    className={`bg-neo-violet border-4 border-black p-4 flex-row items-center justify-center shadow-[6px_6px_0px_0px_#000] active:translate-y-[2px] active:shadow-none ${isLoading ? 'opacity-80' : ''}`}
                >
                    {isLoading ? (
                        <NeoButtonLoader color="white" /> 
                    ) : (
                        <Text className="text-white font-black text-xl uppercase tracking-widest">
                            Reset & Login
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
          </View>

          {/* Footer Note */}
           <View className="items-center mb-8 bg-neo-yellow border-2 border-black p-4 rotate-1 mx-4">
             <Text className="font-bold text-center text-xs uppercase tracking-widest">
                System will auto-login upon success.
             </Text>
           </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
