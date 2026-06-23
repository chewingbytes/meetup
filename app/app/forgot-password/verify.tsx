import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import { NeoButtonLoader } from "@/components/ui/neo-loader";

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleInputChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit on last digit
    if (index === 5 && text) {
      // Check if all filled
      if (newCode.every((d) => d !== "")) {
        handleSubmit(newCode.join(""));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (fullCode: string) => {
    setIsLoading(true);
    // Mock verify
    setTimeout(() => {
      setIsLoading(false);
      if (fullCode === "123456" || true) {
        // Mock: any code works for now
        router.push("/forgot-password/reset");
      } else {
        Alert.alert("Error", "Invalid code");
      }
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-bg" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="p-6 h-full justify-between">
          <View>
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
              <View className="bg-neo-green border-4 border-black px-4 py-2 rotate-2 self-start mb-4 shadow-[4px_4px_0px_0px_#000]">
                <Text className="font-bold text-xs tracking-widest">
                  CHECK YOUR DMs
                </Text>
              </View>
              <Text className="text-4xl font-black uppercase text-black leading-tight tracking-tighter mb-2">
                Verify{" "}
                <Text className="text-neo-blue underline decoration-4 decoration-black">
                  Identity
                </Text>
              </Text>
              <Text className="text-base font-medium text-black/60 uppercase">
                Code sent to{" "}
                <Text className="font-bold text-black">{email}</Text>
              </Text>
            </View>

            {/* OTP Input Group */}
            <View className="flex-row justify-between gap-2 mb-12">
              {code.map((digit, index) => (
                <View key={index} className="relative w-12 h-14">
                  <View className="absolute inset-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000]" />
                  <TextInput
                    ref={(el) => (inputs.current[index] = el)}
                    value={digit}
                    onChangeText={(text) => handleInputChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    className="bg-transparent text-center font-black text-2xl w-full h-full pb-1" // minimal styling needed since view is absolute
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>

            <View className="bg-neo-yellow border-4 border-black p-4 -rotate-1 shadow-[8px_8px_0px_0px_#000] mb-8">
              <Text className="font-bold text-center uppercase text-xs tracking-widest">
                Don't share this code with anyone. seriously.
              </Text>
            </View>
          </View>

          {/* Resend Link */}
          <View className="items-center mb-10">
            <Text className="uppercase font-medium mb-4">Didn't fetch it?</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Hold up", "Wait 30s before asking again.")
              }
            >
              <Text className="font-black underline decoration-4 decoration-neo-red text-lg uppercase pl-1">
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isLoading && (
          <View className="absolute inset-0 bg-white/80 justify-center items-center z-50">
            <View className="bg-neo-bg border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
              <NeoButtonLoader color="black" />
              <Text className="mt-4 font-black uppercase tracking-widest">
                Verifying...
              </Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
