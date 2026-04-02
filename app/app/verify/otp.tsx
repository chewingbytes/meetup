import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react-native";
import { useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OtpStep() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      Alert.alert("Error", "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);
    // Mimic API Verification
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to next Step
      router.push("/verify/face" as any);
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter">
            Step 2 of 3
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <View className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] mb-8">
            <View className="absolute -top-8 left-1/2 -translate-x-8 bg-[#C4B5FD] border-4 border-black p-4 -rotate-3 shadow-[4px_4px_0px_0px_#000]">
              <KeyRound size={32} color="black" />
            </View>

            <Text className="text-3xl font-black uppercase text-center mt-8 mb-2">
              Enter Code
            </Text>
            <Text className="font-bold text-center text-gray-500 mb-8">
              We sent a 6-digit code to {email || "your email"}.
            </Text>

            <View className="flex-row justify-between gap-1 mb-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  className="w-11 h-14 border-4 border-black bg-gray-50 text-center font-black text-2xl"
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              disabled={isLoading}
              className="bg-neo-accent border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none bg-[#FF6B6B]"
            >
              {isLoading ? (
                <NeoButtonLoader color="black" />
              ) : (
                <>
                  <Text className="font-black text-lg uppercase text-white">
                    Verify Code
                  </Text>
                  <ArrowRight size={24} color="white" strokeWidth={3} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} className="mt-4">
              <Text className="text-center font-bold text-xs uppercase underline">
                Wrong Email? Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
