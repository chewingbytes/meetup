import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { usersCommunities } from "@/data/communities";
import {
  ArrowLeft,
  MapPin,
  Users,
  Shield,
  HelpCircle,
  Share,
  Heart,
} from "lucide-react-native";
// import ImageColors from 'react-native-image-colors';
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gradientColors, setGradientColors] = useState(["#000000", "#333333"]);

  const communityId = Array.isArray(id) ? id[0] : id;
  const community = usersCommunities.find((c) => c.id === communityId);

  useEffect(() => {
    if (community) {
      // Static gradients based on community name or type
      const gradients = {
        "Gaming Hub": ["#2d1b69", "#11998e", "#38ef7d"],
        "Study Groups": ["#667eea", "#764ba2", "#f093fb"],
        "Book Lovers": ["#f093fb", "#f5576c", "#4facfe"],
      };
      const name = community.name.split(" ")[0]; // First word
      setGradientColors(
        gradients[name as keyof typeof gradients] || ["#000000", "#333333"]
      );
    }
  }, [community]);

  if (!community) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Community not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView stickyHeaderIndices={[0]}>
          <BlurView
            intensity={50}
            tint="default"
            style={{
              paddingBottom: 24,
            }}
          >
            {/* Header with back button */}
            <View className="flex-row items-center px-5 py-4">
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold ml-4">
                Community Details
              </Text>
            </View>
          </BlurView>

          {/* Big Image */}
          <View className="px-5 mb-6">
            <Image
              source={{ uri: community.profileImage }}
              style={{ width: width - 40, height: 250, borderRadius: 12 }}
              resizeMode="cover"
            />
          </View>

          {/* Name and Description */}
          <View className="px-5 mb-4">
            <Text className="text-white text-3xl font-bold leading-tight">
              {community.name}
            </Text>
            <Text className="text-white/80 text-lg mt-2 leading-relaxed">
              {community.description}
            </Text>
          </View>

          {/* CTA Buttons */}
          <View className="flex-row px-5 mb-6 gap-3">
            <TouchableOpacity className="flex-1 bg-blue-600 py-3 rounded-lg items-center">
              <Text className="text-white font-semibold">Join Community</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-700 py-3 px-4 rounded-lg">
              <Heart color="white" size={20} />
            </TouchableOpacity>
            <TouchableOpacity className="bg-gray-700 py-3 px-4 rounded-lg">
              <Share color="white" size={20} />
            </TouchableOpacity>
          </View>

          {/* Details Section */}
          <View className="px-5 mb-6">
            <Text className="text-white text-2xl font-semibold mb-4">
              Community Info
            </Text>

            {/* Location */}
            <View className="flex-row items-center mb-3">
              <MapPin color="white" size={20} />
              <Text className="text-white ml-3">{community.location}</Text>
            </View>

            {/* Privacy */}
            <View className="flex-row items-center mb-3">
              <Shield color="white" size={20} />
              <Text className="text-white ml-3">
                {community.privacyMode
                  ? "Private Community"
                  : "Public Community"}
              </Text>
            </View>

            {/* Members (placeholder) */}
            <View className="flex-row items-center mb-3">
              <Users color="white" size={20} />
              <Text className="text-white ml-3">Members: 1,234</Text>
            </View>
          </View>

          {/* Rules */}
          {community.rules.length > 0 && (
            <View className="px-5 mb-6">
              <Text className="text-white text-2xl font-semibold mb-4">
                Community Rules
              </Text>
              {community.rules.map((rule, index) => (
                <Text key={index} className="text-white/80 text-lg mb-2">
                  • {rule}
                </Text>
              ))}
            </View>
          )}

          {/* FAQ */}
          {community.faq.length > 0 && (
            <View className="px-5">
              <Text className="text-white text-2xl font-semibold mb-4">
                Frequently Asked Questions
              </Text>
              {community.faq.map((item, index) => (
                <View key={index} className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <HelpCircle color="white" size={18} />
                    <Text className="text-white font-semibold ml-2">
                      {item.question}
                    </Text>
                  </View>
                  <Text className="text-white/80 text-lg ml-6">
                    {item.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
