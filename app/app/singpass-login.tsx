import { View, Text, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";

export default function SingpassLogin() {
  return (
    <View className="flex-1 bg-white px-6 justify-center items-center">

      <Image
        source={{ uri: "https://www.singpass.gov.sg/images/singpass-icon.svg" }}
        className="w-20 h-20 mb-6"
      />

      <Text className="text-2xl font-bold mb-2">Continue with Singpass</Text>
      <Text className="text-gray-500 text-center mb-8 px-4">
        Authenticate using the official Singpass app for fast and secure login.
      </Text>

      <TouchableOpacity className="bg-red-600 py-4 px-6 rounded-xl w-full mb-4">
        <Text className="text-white text-center font-semibold">
          Open Singpass App
        </Text>
      </TouchableOpacity>

      <Link href="/singpass-face" asChild>
        <TouchableOpacity className="bg-gray-100 rounded-xl w-full py-4">
          <Text className="text-center font-medium">Use Face Verification</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/login" asChild>
        <TouchableOpacity className="mt-8">
          <Text className="text-blue-600">Back to Login</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
