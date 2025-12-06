import { View, Text, TouchableOpacity, Image } from "react-native";

export default function SingpassFaceVerify() {
  return (
    <View className="flex-1 bg-white px-6 justify-center items-center">
      <Image
        source={{
          uri: "https://cdn-icons-png.flaticon.com/512/2922/2922656.png",
        }}
        className="w-40 h-40 mb-6 opacity-80"
      />

      <Text className="text-2xl font-bold mb-2">Face Verification</Text>
      <Text className="text-gray-500 text-center mb-8 px-4">
        Align your face within the frame. Remove masks and keep your eyes open.
      </Text>

      <TouchableOpacity className="bg-blue-600 py-4 px-6 rounded-xl w-full">
        <Text className="text-white text-center font-semibold">
          Start Verification
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-8">
        <Text className="text-blue-600">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
