import { View, Text, TextInput, TouchableOpacity } from "react-native";

export default function VerifyOTP() {
  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold mb-2">Verify Email</Text>
      <Text className="text-gray-500 mb-8">
        A 6-digit code has been sent to your email.
      </Text>

      <View className="flex-row justify-between mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextInput
            key={i}
            maxLength={1}
            keyboardType="numeric"
            className="border rounded-xl w-12 h-14 text-center text-xl"
          />
        ))}
      </View>

      <TouchableOpacity className="bg-blue-600 py-4 rounded-xl mb-4">
        <Text className="text-white text-center font-semibold">Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text className="text-blue-600 text-center">Resend Code</Text>
      </TouchableOpacity>
    </View>
  );
}
