import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Mail,
  ScanFace,
  ShieldCheck,
} from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerificationIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const steps = [
    {
      icon: Mail,
      label: "Confirm Email",
      desc: "Verify your school email address",
    },
    {
      icon: ScanFace,
      label: "Face Scan",
      desc: "Quick selfie to prove you're human",
    },
    {
      icon: FileText,
      label: "ID Check",
      desc: "Upload student ID for validation",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1 active:shadow-none"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter">
            Verification
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View className="items-center mb-8 mt-4">
          <View className="bg-neo-red border-4 border-black p-6 rotate-3 shadow-[8px_8px_0px_0px_#000] mb-6">
            <ShieldCheck size={64} color="white" strokeWidth={2} />
          </View>
          <Text className="text-4xl font-black uppercase text-center mb-2 leading-9">
            Get{"\n"}Verified
          </Text>
          <Text className="font-bold text-center text-gray-600 max-w-[250px]">
            Unlock creating events, private groups, and the "Verified" badge on
            your profile.
          </Text>
        </View>

        <View className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] space-y-6 mb-8">
          <Text className="font-black text-xl uppercase border-b-4 border-black pb-2 mb-4">
            Process Overview
          </Text>

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <View
                key={idx}
                className="flex-row items-center gap-4 mb-4 last:mb-0"
              >
                <View className="bg-neo-bg border-2 border-black p-3 shadow-[2px_2px_0px_0px_#000]">
                  <Icon size={24} color="black" />
                </View>
                <View className="flex-1">
                  <Text className="font-black text-lg uppercase">
                    {idx + 1}. {step.label}
                  </Text>
                  <Text className="font-bold text-xs text-gray-500">
                    {step.desc}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/verify/email" as any)}
          className="bg-neo-green border-4 border-black p-4 flex-row items-center justify-center gap-3 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          <Text className="font-black text-xl uppercase">Start Now</Text>
          <ArrowRight size={24} color="black" strokeWidth={3} />
        </TouchableOpacity>

        <Text className="text-center font-bold text-xs text-gray-400 mt-6 uppercase">
          Takes about 2 minutes
        </Text>
      </ScrollView>
    </View>
  );
}
