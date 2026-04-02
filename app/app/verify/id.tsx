import { NeoButtonLoader } from "@/components/ui/neo-loader";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Camera,
    Check,
    FileText
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

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (side: "front" | "back") => {
    // In a real app, maybe show ActionSheet to choose Camera vs Gallery
    // For now, launch gallery for simplicity
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      if (side === "front") setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!frontImage || !backImage) {
      Alert.alert(
        "Incomplete",
        "Please provide both front and back of your ID.",
      );
      return;
    }
    setIsLoading(true);
    // Mock API Upload
    setTimeout(() => {
      setIsLoading(false);
      router.push("/verify/success" as any);
    }, 2000);
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
          <View className="items-center opacity-40">
            <Camera size={32} color="black" />
            <Text className="font-black text-xs uppercase mt-2">
              Tap to Capture
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter">
            ID Upload
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
