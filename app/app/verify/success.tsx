import { useRouter } from "expo-router";
import { Check, Home, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuccessStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (confettiRef.current) {
      confettiRef.current.start();
    }
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FFFDF5",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Confetti */}
      <ConfettiCannon
        count={200}
        origin={{ x: -10, y: 0 }}
        autoStart={true}
        ref={confettiRef}
        fadeOut={true}
      />

      <View className="bg-white border-4 border-black p-8 items-center shadow-[16px_16px_0px_0px_#000] w-full max-w-sm rotate-1">
        <View className="bg-neo-green border-4 border-black p-6 rounded-full mb-6 relative">
          <Check size={64} color="black" strokeWidth={3} />
          <View className="absolute -top-2 -right-2 bg-neo-yellow border-2 border-black px-2 py-1 rotate-12">
            <Text className="font-black text-xs uppercase">Yeah!</Text>
          </View>
        </View>

        <Text className="text-4xl font-black uppercase text-center mb-2">
          We Got It!
        </Text>
        <Text className="font-bold text-center text-gray-500 mb-8 text-lg">
          Your verification is currently pending review.
        </Text>

        <View className="bg-neo-bg border-2 border-black p-4 w-full mb-8">
          <View className="flex-row gap-3 mb-2">
            <ShieldCheck size={20} color="black" />
            <Text className="font-black uppercase text-sm">
              ETA: &lt; 24 Hours
            </Text>
          </View>
          <Text className="font-medium text-xs text-gray-600">
            Our team of robot hamsters is reviewing your documents. You'll get a
            notification when approved.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/home" as any)}
          className="bg-neo-blue border-4 border-black w-full p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          <Home size={20} color="white" strokeWidth={3} />
          <Text className="font-black text-lg uppercase text-white">
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
