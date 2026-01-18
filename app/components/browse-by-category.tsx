import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Home,
  Hash,
  User,
  Users,
  Book,
  Music,
  AlertCircle,
} from "lucide-react-native";
import { CommunityProps } from "@/utils/types";

interface CommunityCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

const categories: CommunityCategory[] = [
  { id: "gaming", name: "Gaming", icon: Home },
  { id: "study", name: "Study Groups", icon: Book },
  { id: "music", name: "Music", icon: Music },
  { id: "social", name: "Social", icon: Users },
  { id: "art", name: "Art", icon: Hash },
  { id: "alert", name: "Announcements", icon: AlertCircle },
  { id: "profile", name: "Profile‑Centric", icon: User },
];

const chunkArray = (arr: CommunityCategory[], itemsPerPage: number) => {
  const chunks: CommunityCategory[][] = [];
  for (let i = 0; i < arr.length; i += itemsPerPage) {
    chunks.push(arr.slice(i, i + itemsPerPage));
  }
  return chunks;
};

interface BrowseByCommunityProps {
  communities?: CommunityProps[];
}

export default function BrowseByCommunity({ communities = [] }: BrowseByCommunityProps) {
  const router = useRouter();
  const rowsPerPage = 2;
  const itemsPerPage = rowsPerPage * 3; // 3 columns * 2 rows
  const pages = chunkArray(categories, itemsPerPage);

  // Get unique topics from communities
  const uniqueTopics = useMemo(() => {
    const topics = new Set<string>();
    communities.forEach(community => {
      if (community.topics && Array.isArray(community.topics)) {
        community.topics.forEach(topic => {
          topics.add(topic);
        });
      }
    });
    return Array.from(topics);
  }, [communities]);

  const handleCategoryPress = (categoryId: string) => {
    // Navigate to categories page with the selected category
    router.push(`/categories/${categoryId}` as any);
  };

  return (
    <View>
      <View className="w-full">
        <Text
          className="mb-6 px-5"
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          Browse by Community
        </Text>

        <FlatList
          data={pages}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          pagingEnabled
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item: page }) => (
            <View
              style={{
                flexDirection: "column",
              }}
            >
              {[0, 1].map((rowIdx) => {
                const start = rowIdx * 3;
                const rowItems = page.slice(start, start + 3);
                return (
                  <View
                    key={rowIdx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {rowItems.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => handleCategoryPress(cat.id)}
                          className="flex-row justify-center gap-x-1.5 items-center mr-3 mb-3 rounded-xl border-2 border-[#232323]"
                          style={{
                            width: "auto",
                            alignItems: "center",
                            padding: 10,
                          }}
                        >
                          <Icon size={20} color="#fff" />
                          <Text
                            style={{
                              color: "#fff",
                              textAlign: "center",
                              fontSize: 16,
                              fontWeight: "500",
                            }}
                          >
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}
        />
      </View>
    </View>
  );
}
