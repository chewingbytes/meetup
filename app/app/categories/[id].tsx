import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Home,
  Book,
  Music,
  Users,
  Hash,
  AlertCircle,
  Gamepad,
  ArrowLeft,
  User,
  PenBoxIcon,
  Map,
} from "lucide-react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import CommunityCard from "@/components/community-card";
import { BlurView } from "expo-blur";
import { useCommunities } from "@/hooks/useCommunities";
import { PullToRefresh } from "@/components/pull-to-refresh";

const categoryData = {
  gaming: {
    name: "Gaming",
    icon: Gamepad,
    description:
      "Connect with fellow gamers, join gaming communities, and discover gaming events in your area.",
    gradient: ["#2d1b69", "#11998e", "#38ef7d"],
  },
  study: {
    name: "Study Groups",
    icon: Book,
    description:
      "Find study partners, join academic communities, and participate in study sessions and workshops.",
    gradient: ["#667eea", "#764ba2", "#f093fb"],
  },
  music: {
    name: "Music",
    icon: Music,
    description:
      "Discover music lovers, join music communities, and attend concerts and music events.",
    gradient: ["#f093fb", "#f5576c", "#4facfe"],
  },
  social: {
    name: "Social",
    icon: Users,
    description:
      "Meet new people, join social communities, and participate in social gatherings and events.",
    gradient: ["#4facfe", "#00f2fe", "#43e97b"],
  },
  art: {
    name: "Art",
    icon: PenBoxIcon,
    description:
      "Connect with artists, join creative communities, and explore art exhibitions and workshops.",
    gradient: ["#fa709a", "#fee140", "#a8edea"],
  },
  alert: {
    name: "Announcements",
    icon: AlertCircle,
    description:
      "Stay updated with important announcements, news, and community updates.",
    gradient: ["#ff9a9e", "#fecfef", "#fecfef"],
  },
  profile: {
    name: "Profile-Centric",
    icon: User,
    description:
      "Personal development communities focused on career growth and self-improvement.",
    gradient: ["#a8edea", "#fed6e3", "#d299c2"],
  },
};

export default function CategoryDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gradientColors, setGradientColors] = useState(["#09090b", "#333333"]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Get communities from Zustand store
  const { communities, isRefreshing, refresh } = useCommunities();

  const categoryId = Array.isArray(id) ? id[0] : id;
  const category = categoryData[categoryId as keyof typeof categoryData];

  // Filter communities by topic - check if categoryId is in the community's topics array
  const categoryCommunities = communities.filter((community) => {
    if (!community.topics || !Array.isArray(community.topics)) {
      return false;
    }
    return community.topics.includes(categoryId as string);
  });

  useEffect(() => {
    if (category) {
      setGradientColors(category.gradient);
    }
  }, [category]);

    useEffect(() => {
      console.log("CATEOGRY:", categoryId, categoryCommunities);

  }, [categoryId, categoryCommunities]);

  if (!category) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-xl">Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSubscribe = () => {
    console.log("Subscribe button pressed for category:", categoryId);
    setIsSubscribed(!isSubscribed);
  };

  const handleMapPress = () => {
    console.log("Map button pressed for category:", categoryId);
  };

  const Icon = category.icon;

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          stickyHeaderIndices={[0]}
          refreshControl={
            <PullToRefresh isRefreshing={isRefreshing} onRefresh={refresh} />
          }
        >
          <BlurView
            intensity={50}
            tint="default"
            style={{
              paddingBottom: 24,
            }}
          >
            <View className="flex-row items-center px-5 py-4">
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text className="text-white text-xl font-semibold ml-4">
                {category.name}
              </Text>
            </View>
          </BlurView>

          <View className="px-5 mb-3 items-start">
            {Icon && (
              <View className="">
                <Icon size={82} color="white" />
              </View>
            )}

            <Text className="text-white text-4xl font-medium text-center">
              {category.name}
            </Text>
          </View>

          <View className="px-5 mb-3">
            <View className="flex-row justify-start gap-x-4">
              <View className="flex-row items-center gap-x-1">
                <Text className="text-white font-semibold">
                  {categoryCommunities.length}
                </Text>
                <Text className="text-white/70 text-sm">Communities</Text>
              </View>
              <View className="flex-row items-center gap-x-1">
                <Text className="text-white font-semibold">
                  {categoryCommunities.length}
                </Text>
                <Text className="text-white/70 text-sm">Members</Text>
              </View>
              <View className="flex-row items-center gap-x-1">
                <Text className="text-white font-semibold">1.2K</Text>
                <Text className="text-white/70 text-sm">Subscribers</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="px-5 mb-6">
            <Text className="text-white/90 text-lg leading-relaxed">
              {category.description}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="px-5 mb-6">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSubscribe}
                className={`flex-1 py-3 rounded-lg items-center ${isSubscribed ? "bg-gray-600" : "bg-blue-600"}`}
              >
                <Text className="text-white font-semibold">
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMapPress}
                className="bg-gray-700 py-3 px-6 rounded-lg items-center"
              >
                <Map color="white" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Separator */}
          <View className="px-5 mb-6">
            <View className="h-px bg-white/20" />
          </View>

          {/* Communities Section */}
          {categoryCommunities.length > 0 && (
            <View className="px-5 mb-8">
              <Text className="text-white text-2xl font-semibold mb-4">
                Communities
              </Text>
              <View className="gap-y-4">
                {categoryCommunities.map((community, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() =>
                      router.push(`/community/${community.id}` as any)
                    }
                  >
                    <CommunityCard community={community} onPress={() => {}} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
