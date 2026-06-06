import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react-native";
import { useState } from "react";
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

export default function EmailStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid school email address.");
      return;
    }

    setIsLoading(true);
    // Mimic API call
    setTimeout(() => {
      setIsLoading(false);
      // Pass email to next step via params
      router.push({ pathname: "/verify/otp", params: { email } });
    }, 1500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          {/* <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity> */}
          <Text className="text-xl font-black uppercase tracking-tighter">
            Step 1 of 3
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
            <View className="absolute -top-8 left-1/2 -translate-x-8 bg-[#A0D2EB] border-4 border-black p-4 rotate-6 shadow-[4px_4px_0px_0px_#000]">
              <Mail size={32} color="black" />
            </View>

            <Text className="text-3xl font-black uppercase text-center mt-8 mb-2">
              School Email
            </Text>
            <Text className="font-bold text-center text-gray-500 mb-8">
              We need to verify you are a student. Please enter your .edu email.
            </Text>

            <View className="mb-6">
              <Text className="font-black text-sm uppercase mb-2 ml-1">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="student@university.edu.sg"
                className="bg-gray-50 border-4 border-black p-4 font-bold text-lg"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              className="bg-[#FF6B6B] border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              {isLoading ? (
                <NeoButtonLoader color="black" />
              ) : (
                <>
                  <Text className="font-black text-lg uppercase text-white">
                    Send Code
                  </Text>
                  <ArrowRight size={24} color="white" strokeWidth={3} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
