import React, { useState, useMemo, useEffect } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobileNav from "@/components/mobile-nav";
import { CommunityProps, TopicProps } from "@/utils/types";
import { getTopics, getCommunities, getCommunitiesByTopic } from "@/lib/api";

const { width } = Dimensions.get("window");

// Remove hardcoded categories - will fetch from API

export default function BrowseCommunitiesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  // States for topics and communities
  const [topics, setTopics] = useState<TopicProps[]>([]);
  const [allCommunities, setAllCommunities] = useState<CommunityProps[]>([]);
  const [topicCommunities, setTopicCommunities] = useState<CommunityProps[]>(
    []
  );
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [topicCommunitiesLoading, setTopicCommunitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setTopicsLoading(true);
        const data = await getTopics();
        setTopics(Array.isArray(data) ? data : data?.topics || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load topics");
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Fetch all communities on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setCommunitiesLoading(true);
        const data = await getCommunities();
        setAllCommunities(Array.isArray(data) ? data : data?.communities || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load communities");
      } finally {
        setCommunitiesLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  // Fetch communities for selected topic
  useEffect(() => {
    if (selectedTopicId === null) {
      setTopicCommunities([]);
      return;
    }

    const fetchTopicCommunities = async () => {
      try {
        setTopicCommunitiesLoading(true);
        const data = await getCommunitiesByTopic(selectedTopicId);
        setTopicCommunities(
          Array.isArray(data) ? data : data?.communities || []
        );
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load topic communities");
        setTopicCommunities([]);
      } finally {
        setTopicCommunitiesLoading(false);
      }
    };

    fetchTopicCommunities();
  }, [selectedTopicId]);

  // Search results based on query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allCommunities.filter(
      (community) =>
        community.name.toLowerCase().includes(query) ||
        (community.description &&
          community.description.toLowerCase().includes(query))
    );
  }, [searchQuery, allCommunities]);

  // If searching, show search results
  if (searchQuery.trim()) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["top"]}
      >
        <LinearGradient colors={["#09090b", "#1a1a1a"]} style={{ flex: 1 }}>
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

  // If topic selected, show communities in that topic
  if (selectedTopicId !== null) {
    const selectedTopic = topics.find((t) => t.id === selectedTopicId);

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
        edges={["top"]}
      >
        <LinearGradient colors={["#09090b", "#1a1a1a"]} style={{ flex: 1 }}>
          {/* Header */}
          <View className="px-6 py-4 flex-row items-center gap-3">
            <TouchableOpacity onPress={() => setSelectedTopicId(null)}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">
              {selectedTopic?.name}
            </Text>
          </View>

          {/* Description */}
          {selectedTopic?.description && (
            <View className="px-6 pb-4">
              <Text className="text-white/60 text-sm">
                {selectedTopic.description}
              </Text>
            </View>
          )}

          {/* Communities List */}
          <ScrollView className="flex-1 px-6">
            {topicCommunitiesLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : topicCommunities.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-white/50 text-lg">
                  No communities found in this topic
                </Text>
              </View>
            ) : (
              <View className="gap-4 pb-6">
                {topicCommunities.map((community) => (
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
                        <Text className="text-4xl">👥</Text>
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
            )}
          </ScrollView>
        </LinearGradient>
        <MobileNav active="home" />
      </SafeAreaView>
    );
  }

  // Main browse view with categories
  return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "transparent" }}
      edges={["top"]}
    >
        <LinearGradient colors={["#09090b", "#1a1a1a"]} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold capitalize">
            Active communities
          </Text>
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

        {/* Topics Grid */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-6">
            {topicsLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#4f46e5" />
              </View>
            ) : topics.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Text className="text-white/50 text-lg">
                  No topics available
                </Text>
              </View>
            ) : (
              <FlatList
                data={topics}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={{ gap: 14, marginBottom: 14 }}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedTopicId(item.id)}
                    className="flex-1"
                  >
                    <LinearGradient
                      colors={["#4f46e5", "#6366f1"]}
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
                      <Text className="text-white font-bold text-center text-base leading-tight mb-2">
                        {item.name}
                      </Text>
                      {item.description && (
                        <Text className="text-white/70 text-xs text-center leading-tight">
                          {item.description.substring(0, 60)}
                          {item.description.length > 60 ? "..." : ""}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </ScrollView>
      </LinearGradient>
      <View style={{ height: 60 }} />
      <MobileNav active="home" />
    </SafeAreaView>
  );
}
