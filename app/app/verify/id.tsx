import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { useAuth } from "@/lib/authContext";
import { uploadVerificationImages } from "@/lib/supabaseStorage";
import { submitVerification } from "@/lib/api";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Camera,
    Check,
    FileText,
    Image as ImageIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IdStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  // selfieUri is passed from face.tsx via router params
  const { selfieUri } = useLocalSearchParams<{ selfieUri?: string }>();

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = (side: "front" | "back") => {
    Alert.alert(
      side === "front" ? "ID Front" : "ID Back",
      "Choose how to add your image",
      [
        {
          text: "Take Photo",
          onPress: () => launchCamera(side),
        },
        {
          text: "Choose from Library",
          onPress: () => launchGallery(side),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const launchCamera = async (side: "front" | "back") => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Camera Access Required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      if (side === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const launchGallery = async (side: "front" | "back") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Photo Library Access Required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      if (side === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage || !backImage) {
      Alert.alert("Incomplete", "Please provide both front and back of your ID.");
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert("Error", "No active session. Please log in again.");
      return;
    }

    setIsLoading(true);
    try {
      await uploadVerificationImages({
        userId,
        idFrontUri: frontImage,
        idBackUri: backImage,
        selfieUri: selfieUri ?? null,
      });

      // Mark profile as pending verification
      await submitVerification(userId);

      router.push("/verify/success" as any);
    } catch (err: any) {
      Alert.alert("Upload Failed", err?.message || "Could not upload verification documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderSide = (side: "front" | "back", image: string | null) => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="font-black text-sm uppercase">{side} of ID</Text>
        {image && (
          <TouchableOpacity onPress={() => pickImage(side)}>
            <Text className="font-bold text-xs text-red-500 uppercase underline">
              Retake
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={() => pickImage(side)}
        className={`w-full h-48 border-4 border-black border-dashed ${image ? "border-solid bg-black" : "bg-gray-100"} items-center justify-center shadow-[4px_4px_0px_0px_#000]`}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center gap-2 opacity-40">
            <Camera size={32} color="black" />
            <ImageIcon size={24} color="black" />
            <Text className="font-black text-xs uppercase mt-1">
              Tap to Capture or Upload
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-xl font-black uppercase tracking-tighter">
            Step 3 of 3
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] mb-8">
          <View className="flex-row items-center gap-4 mb-6">
            <View className="bg-neo-blue p-3 border-2 border-black">
              <FileText size={24} color="black" />
            </View>
            <View className="flex-1">
              <Text className="font-black text-lg uppercase">
                Student ID Card
              </Text>
              <Text className="text-xs font-bold text-gray-500">
                Ensure details are legible and clear.
              </Text>
            </View>
          </View>

          {renderSide("front", frontImage)}
          {renderSide("back", backImage)}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none ${frontImage && backImage ? "bg-neo-green" : "bg-gray-300"}`}
          >
            {isLoading ? (
              <NeoButtonLoader color="black" />
            ) : (
              <>
                <Text className="font-black text-lg uppercase">
                  Submit for Review
                </Text>
                <Check size={24} color="black" strokeWidth={3} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
