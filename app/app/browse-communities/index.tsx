import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileNav from "@/components/mobile-nav";
import { CommunityProps } from "@/utils/types";

const { width } = Dimensions.get("window");

// Sample categories
const COMMUNITY_CATEGORIES = [
  {
    id: "sports",
    name: "Sports & Fitness",
    icon: "⚽",
    color: ["#dc2626", "#991b1b"],
  },
  {
    id: "location",
    name: "Based on Location",
    icon: "📍",
    color: ["#2563eb", "#1e40af"],
  },
  {
    id: "tech",
    name: "Technology & Dev",
    icon: "💻",
    color: ["#7c3aed", "#5b21b6"],
  },
  {
    id: "arts",
    name: "Arts & Culture",
    icon: "🎨",
    color: ["#ec4899", "#be185d"],
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: "🎮",
    color: ["#06b6d4", "#0369a1"],
  },
  {
    id: "study",
    name: "Study & Learning",
    icon: "📚",
    color: ["#10b981", "#065f46"],
  },
  {
    id: "food",
    name: "Food & Dining",
    icon: "🍔",
    color: ["#f59e0b", "#b45309"],
  },
  {
    id: "music",
    name: "Music & Concerts",
    icon: "🎵",
    color: ["#f43f5e", "#be123c"],
  },
];

// Sample communities by category
const SAMPLE_COMMUNITIES_BY_CATEGORY: Record<string, CommunityProps[]> = {
  sports: [
    {
      id: "1",
      name: "Basketball Enthusiasts",
      description: "Love basketball? Join us for pickup games and discussions",
      profile_image: "https://picsum.photos/seed/basketball/180/180",
      privacy_mode: false,
      created_at: "2025-06-15",
    },
    {
      id: "2",
      name: "Tennis Players Club",
      description: "Weekly tennis matches and coaching sessions",
      profile_image: "https://picsum.photos/seed/tennis/180/180",
      privacy_mode: false,
      created_at: "2025-07-10",
    },
    {
      id: "3",
      name: "Fitness & Wellness",
      description: "Gym buddies and fitness tips",
      profile_image: "https://picsum.photos/seed/fitness/180/180",
      privacy_mode: false,
      created_at: "2025-08-01",
    },
  ],
  location: [
    {
      id: "4",
      name: "Singapore Marina Bay",
      description: "Community in Marina Bay area",
      profile_image: "https://picsum.photos/seed/marina/180/180",
      privacy_mode: false,
      created_at: "2025-05-20",
    },
    {
      id: "5",
      name: "Bukit Merah Neighborhood",
      description: "Bukit Merah residents meetup group",
      profile_image: "https://picsum.photos/seed/bukit/180/180",
      privacy_mode: false,
      created_at: "2025-06-05",
    },
    {
      id: "6",
      name: "Bishan Community Hub",
      description: "Connect with locals in Bishan",
      profile_image: "https://picsum.photos/seed/bishan/180/180",
      privacy_mode: false,
      created_at: "2025-07-15",
    },
  ],
  tech: [
    {
      id: "7",
      name: "React Native Developers",
      description: "Building mobile apps with React Native",
      profile_image: "https://picsum.photos/seed/react/180/180",
      privacy_mode: false,
      created_at: "2025-04-10",
    },
    {
      id: "8",
      name: "Web3 & Blockchain",
      description: "Exploring Web3 and blockchain technology",
      profile_image: "https://picsum.photos/seed/blockchain/180/180",
      privacy_mode: false,
      created_at: "2025-05-05",
    },
    {
      id: "9",
      name: "AI & Machine Learning",
      description: "Discuss AI/ML projects and ideas",
      profile_image: "https://picsum.photos/seed/ai/180/180",
      privacy_mode: false,
      created_at: "2025-06-20",
    },
  ],
  study: [
    {
      id: "10",
      name: "STEM Study Group",
      description: "Collaborative learning for STEM subjects",
      profile_image: "https://picsum.photos/seed/stem/180/180",
      privacy_mode: false,
      created_at: "2025-07-01",
    },
    {
      id: "11",
      name: "Language Exchange",
      description: "Learn new languages with peers",
      profile_image: "https://picsum.photos/seed/language/180/180",
      privacy_mode: false,
      created_at: "2025-08-10",
    },
  ],
};

export default function BrowseCommunitiesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter all communities by search query
  const allCommunities = Object.values(SAMPLE_COMMUNITIES_BY_CATEGORY).flat();
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allCommunities.filter((community) =>
      community.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // If searching, show search results
  if (searchQuery.trim()) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000000" }}
        edges={["top"]}
      >
        <LinearGradient colors={["#000000", "#1a1a1a"]} style={{ flex: 1 }}>
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">Browse</Text>
          </View>

          {/* Search Bar */}
          <View className="px-6 pb-4">
            <View className="flex-row items-center bg-zinc-900 rounded-lg px-4 py-3">
              <Search size={18} color="#999" />
              <TextInput
                placeholder="Search communities..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-white"
              />
            </View>
          </View>

          {/* Search Results */}
          <ScrollView className="flex-1 px-6">
            {searchResults.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-white/50 text-lg">
                  No communities found
                </Text>
              </View>
            ) : (
              <View className="gap-3 pb-6">
                {searchResults.map((community) => (
                  <TouchableOpacity
                    key={community.id}
                    onPress={() =>
                      router.push(`/community/${community.id}` as any)
                    }
                    className="bg-zinc-900 rounded-2xl p-5 flex-row items-center gap-4"
                  >
                    {community.profile_image ? (
                      <Image
                        source={{ uri: community.profile_image }}
                        className="w-20 h-20 rounded-xl"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-xl bg-indigo-600 items-center justify-center">
                        <Text className="text-2xl">👥</Text>
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        {community.name}
                      </Text>
                      <Text className="text-white/60 text-sm mt-1">
                        {community.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </LinearGradient>
        <MobileNav active="home" />
      </SafeAreaView>
    );
  }

  // If category selected, show communities in that category
  if (selectedCategory) {
    const categoryData = COMMUNITY_CATEGORIES.find(
      (c) => c.id === selectedCategory
    );
    const categoryCommunities =
      SAMPLE_COMMUNITIES_BY_CATEGORY[selectedCategory] || [];

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#000000" }}
        edges={["top"]}
      >
        <LinearGradient colors={["#000000", "#1a1a1a"]} style={{ flex: 1 }}>
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">
              {categoryData?.name}
            </Text>
          </View>

          {/* Communities List */}
          <ScrollView className="flex-1 px-6">
            <View className="gap-4 pb-6">
              {categoryCommunities.map((community) => (
                <TouchableOpacity
                  key={community.id}
                  onPress={() =>
                    router.push(`/community/${community.id}` as any)
                  }
                  className="bg-zinc-900 rounded-2xl p-5 flex-row items-center gap-4"
                  style={{ minHeight: 140 }}
                >
                  {community.profile_image ? (
                    <Image
                      source={{ uri: community.profile_image }}
                      className="w-24 h-24 rounded-xl"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-xl bg-indigo-600 items-center justify-center">
                      <Text className="text-4xl">{categoryData?.icon}</Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">
                      {community.name}
                    </Text>
                    <Text className="text-white/60 text-sm mt-2">
                      {community.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </LinearGradient>
        <MobileNav active="home" />
      </SafeAreaView>
    );
  }

  // Main browse view with categories
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#000000" }}
      edges={["top"]}
    >
      <LinearGradient colors={["#000000", "#1a1a1a"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold capitalize">Active communities</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center bg-zinc-900 rounded-lg px-4 py-3">
            <Search size={18} color="#999" />
            <TextInput
              placeholder="Search communities..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white"
            />
          </View>
        </View>

        {/* Categories Grid */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-6">
            <FlatList
              data={COMMUNITY_CATEGORIES}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ gap: 14, marginBottom: 14 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item.id)}
                  className="flex-1"
                >
                  <LinearGradient
                    colors={item.color}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 12,
                      padding: 24,
                      justifyContent: "center",
                      alignItems: "center",
                      height: 200,
                    }}
                  >
                    <Text className="text-6xl mb-4">{item.icon}</Text>
                    <Text className="text-white font-bold text-center text-base leading-tight">
                      {item.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            />
          </View>
        </ScrollView>
      </LinearGradient>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}