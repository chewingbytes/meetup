import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import {
  Home,
  Hash,
  User,
  Users,
  Book,
  Music,
  AlertCircle,
} from "lucide-react-native";

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

export default function BrowseByCommunity() {
  const rowsPerPage = 2;
  const itemsPerPage = rowsPerPage * 3; // 3 columns * 2 rows
  const pages = chunkArray(categories, itemsPerPage);

  return (
    <View className="px-5">
      <Text
        className="mb-6"
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
        showsHorizontalScrollIndicator={false}
        renderItem={({ item: page }) => (
          <View
            style={{
              flexDirection: "column",
            }}
          >
            {/* Split into two rows */}
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
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() =>
                          console.log("Selected category:", cat.id)
                        }
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
                            fontWeight: 500,
                          }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}
