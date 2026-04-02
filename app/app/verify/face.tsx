import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ScanFace
} from "lucide-react-native";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// In real app, import Camera from expo-camera

export default function FaceStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [hasPermission, setHasPermission] = useState<boolean | null>(true); // Mock permission
  const [scanning, setScanning] = useState(false);
  const [step, setStep] = useState<"intro" | "scan" | "success">("intro");

  const startScan = () => {
    setStep("scan");
    // Simulate scan process
    setTimeout(() => {
      setScanning(true);
      setTimeout(() => {
        setScanning(false);
        setStep("success");
      }, 2000);
    }, 1000);
  };

  const handleContinue = () => {
    router.push("/verify/id" as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black top-0 left-0 right-0 absolute"
      >
        <View className="flex-row items-center justify-between mt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter">
            Step 3 of 3
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        {step === "intro" && (
          <View className="items-center">
            <View className="bg-neo-blue border-4 border-black p-8 rounded-full mb-8 shadow-[8px_8px_0px_0px_#000]">
              <ScanFace size={64} color="black" />
            </View>
            <Text className="text-3xl font-black uppercase text-center mb-4">
              Liveness Check
            </Text>
            <Text className="text-center font-bold text-gray-500 mb-8 max-w-[280px]">
              We need to make sure you're a real person. Please center your face
              in the frame.
            </Text>
            <TouchableOpacity
              onPress={startScan}
              className="bg-[#4ADE80] border-4 border-black px-8 py-4 flex-row items-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              <Camera size={24} color="black" strokeWidth={3} />
              <Text className="font-black text-xl uppercase">Start Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "scan" && (
          <View className="items-center w-full">
            <View className="w-64 h-64 border-4 border-black rounded-full overflow-hidden bg-gray-200 relative mb-8 shadow-[8px_8px_0px_0px_#000]">
              {/* Mock Camera Feed */}
              <View className="absolute inset-0 items-center justify-center">
                <ScanFace size={100} color="#999" opacity={0.5} />
              </View>
              {scanning && (
                <View className="absolute inset-0 border-b-4 border-neo-red w-full h-full animate-spin bg-neo-accent/20" />
              )}
            </View>
            <Text className="font-black text-xl uppercase animate-pulse">
              {scanning ? "Scanning..." : "Position Face..."}
            </Text>
          </View>
        )}

        {step === "success" && (
          <View className="items-center">
            <View className="bg-neo-green border-4 border-black p-6 rotate-6 mb-8 shadow-[8px_8px_0px_0px_#000]">
              <Text className="text-4xl text-black">😎</Text>
            </View>
            <Text className="text-3xl font-black uppercase text-center mb-4">
              Face Verified!
            </Text>
            <Text className="text-center font-bold text-gray-500 mb-8">
              Looking good. One last step to go.
            </Text>

            <TouchableOpacity
              onPress={handleContinue}
              className="bg-neo-accent border-4 border-black px-8 py-4 flex-row items-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none bg-[#FF6B6B]"
            >
              <Text className="font-black text-xl uppercase text-white">
                Next Step
              </Text>
              <ArrowRight size={24} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
