import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Camera,
  RotateCcw,
  ScanFace,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function FaceStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert(
        "Camera Access Required",
        "Please allow camera access to take a selfie.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.length) {
      setSelfieUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    router.push({
      pathname: "/verify/id" as any,
      params: { selfieUri: selfieUri ?? "" },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black top-0 left-0 right-0 absolute"
      >
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-xl font-black uppercase tracking-tighter">
            Step 2 of 3
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="flex-1 justify-center items-center px-6">
        {!selfieUri ? (
          <View className="items-center">
            <View className="bg-neo-blue border-4 border-black p-8 rounded-full mb-8 shadow-[8px_8px_0px_0px_#000]">
              <ScanFace size={64} color="black" />
            </View>
            <Text className="text-3xl font-black uppercase text-center mb-4">
              Selfie Check
            </Text>
            <Text className="text-center font-bold text-gray-500 mb-8 max-w-[280px]">
              We need to confirm you're a real person. Take a quick selfie using
              your front camera.
            </Text>
            <TouchableOpacity
              onPress={takeSelfie}
              className="bg-[#4ADE80] border-4 border-black px-8 py-4 flex-row items-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              <Camera size={24} color="black" strokeWidth={3} />
              <Text className="font-black text-xl uppercase">Take Selfie</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center w-full">
            <View className="w-64 h-64 border-4 border-black rounded-full overflow-hidden mb-8 shadow-[8px_8px_0px_0px_#000]">
              <Image
                source={{ uri: selfieUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <Text className="text-3xl font-black uppercase text-center mb-2">
              Looking Good!
            </Text>
            <Text className="text-center font-bold text-gray-500 mb-8">
              One last step — upload your student ID.
            </Text>

            <TouchableOpacity
              onPress={takeSelfie}
              className="border-2 border-black px-6 py-3 flex-row items-center gap-2 mb-4 bg-white shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              <RotateCcw size={18} color="black" strokeWidth={3} />
              <Text className="font-black text-sm uppercase">Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleContinue}
              className="bg-[#FF6B6B] border-4 border-black px-8 py-4 flex-row items-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
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
