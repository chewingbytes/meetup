import { View, Text, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

export default function SingpassLogin() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neo-bg px-6 py-6">
      
      <TouchableOpacity onPress={() => router.back()} className="self-start mb-10">
         <View className="bg-white border-4 border-black p-2 shadow-[4px_4px_0px_0px_#000]">
           <ArrowLeft size={24} color="#000" strokeWidth={3} />
         </View>
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center -mt-20">
        <View className="bg-white border-4 border-black p-8 items-center shadow-[8px_8px_0px_0px_#000] rotate-1">
            <Image
                source={{ uri: "https://www.singpass.gov.sg/images/singpass-icon.svg" }} // Ideally local asset
                className="w-24 h-24 mb-6 border-4 border-black rounded-full"
            />

            <Text className="text-3xl font-black uppercase text-center mb-4 leading-none tracking-tighter">
                Singpass <Text className="text-neo-red">ID</Text>
            </Text>
            
            <Text className="text-black font-bold text-center mb-8 px-4 border-l-4 border-neo-yellow py-2 bg-neo-bg">
                Authenticate using the official Singpass app for verification.
            </Text>

            <Button 
                variant="default" 
                className="w-full mb-4 bg-neo-red"
                onPress={() => { /* Open App Logic */ }}
            >
                Launch App
            </Button>

            <Link href="/singpass-face" asChild>
                <Button variant="outline" className="w-full">
                    Face Verification
                </Button>
            </Link>
        </View>

        <Link href="/login" asChild>
            <TouchableOpacity className="mt-12 bg-neo-yellow border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000] -rotate-2">
                <Text className="font-bold uppercase tracking-widest text-sm">Cancel Login</Text>
            </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}
