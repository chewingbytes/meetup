import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Users,
  Heart,
  MessageCircle,
  Lock,
  Globe,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { CommunityProps } from "@/utils/types";

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [gradientColors, setGradientColors] = useState(["#000000", "#333333"]);
  const [joined, setJoined] = useState(false);

  // Use Zustand store to fetch community
  const { communityDetails, fetchCommunityById } = useCommunityStore();
  const community = id ? communityDetails[id as string] : null;
  const [isLoading, setIsLoading] = useState(true);

  // Fetch community if not in cache
  useEffect(() => {
    let mounted = true;

    async function loadCommunity() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("📡 Fetching community with ID:", id);
        await fetchCommunityById(id as string);
        if (mounted) {
          console.log("✅ Community loaded");
          // Set gradient based on community topics or default
          setGradientColors(["#0c0c0c", "#1a1a1a", "#2d2d2d"]);
        }
      } catch (err) {
        console.error("❌ Failed to load community:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadCommunity();
    return () => {
      mounted = false;
    };
  }, [id, fetchCommunityById]);

  const handleJoinCommunity = async () => {
    try {
      setJoined(true);
      // TODO: Call API to join community
      console.log("🎉 Joined community:", community?.id);
    } catch (err) {
      console.error("Failed to join community:", err);
      setJoined(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient colors={["#000000", "#333333"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state
  if (!community) {
    return (
      <LinearGradient colors={["#000000", "#333333"]} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Community Details</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Community not found</Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView stickyHeaderIndices={[0]} showsVerticalScrollIndicator={false}>
          <BlurView intensity={50} tint="default" style={styles.blurHeader}>
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Community</Text>
              <View style={{ width: 24 }} />
            </View>
          </BlurView>

          {/* Hero Image */}
          <View style={styles.imageContainer}>
            {community.profile_image ? (
              <Image
                source={{ uri: community.profile_image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImage, styles.placeholderImage]}>
                <Text style={styles.placeholderEmoji}>👥</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>{community.name}</Text>

            {/* Privacy Badge */}
            <View style={styles.privacyBadge}>
              {community.privacy_mode ? (
                <>
                  <Lock size={14} color="#f59e0b" />
                  <Text style={styles.privacyText}>Private Community</Text>
                </>
              ) : (
                <>
                  <Globe size={14} color="#10b981" />
                  <Text style={[styles.privacyText, { color: "#10b981" }]}>
                    Public Community
                  </Text>
                </>
              )}
            </View>

            {/* CTA Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.joinButton,
                  joined && styles.joinedButton
                ]}
                onPress={handleJoinCommunity}
              >
                <Text style={styles.joinButtonText}>
                  {joined ? "✓ Joined" : "Join Community"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.favoriteButton}>
                <Heart color="white" size={20} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            {joined && (
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => router.push(`/chat/${community.id}?name=${community.name}`)}
              >
                <MessageCircle size={18} color="#fff" />
                <Text style={styles.chatButtonText}>Open Group Chat</Text>
              </TouchableOpacity>
            )}

            {/* Topics */}
            {community.topics && community.topics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Topics</Text>
                <View style={styles.topicsContainer}>
                  {community.topics.map((topic, idx) => (
                    <View key={idx} style={styles.topicPill}>
                      <Text style={styles.topicText}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* About */}
            {community.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.descriptionText}>
                  {community.description}
                </Text>
              </View>
            )}

            {/* Community Rules */}
            {community.rules && community.rules.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Community Rules</Text>
                <View style={styles.rulesContainer}>
                  {community.rules.map((rule, idx) => (
                    <View key={idx} style={styles.ruleRow}>
                      <Text style={styles.ruleNumber}>{idx + 1}.</Text>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* FAQ */}
            {community.faq && community.faq.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                {community.faq.map((item, idx) => (
                  <View key={idx} style={styles.faqItem}>
                    <Text style={styles.faqQuestion}>Q: {item.question}</Text>
                    <Text style={styles.faqAnswer}>A: {item.answer}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Meta Info */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Users size={16} color="#999" />
                <Text style={styles.metaText}>
                  Created {new Date(community.created_at || "").toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              {community.slug && (
                <Text style={styles.slugText}>@{community.slug}</Text>
              )}
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  blurHeader: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
    gap: 6,
  },
  privacyText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  joinButton: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  joinedButton: {
    backgroundColor: "#10b981",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  favoriteButton: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicPill: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  topicText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  rulesContainer: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 16,
  },
  ruleRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  ruleNumber: {
    color: "#4f46e5",
    fontWeight: "700",
    fontSize: 14,
  },
  ruleText: {
    flex: 1,
    color: "#ccc",
    fontSize: 14,
    lineHeight: 20,
  },
  faqItem: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqQuestion: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  faqAnswer: {
    color: "#999",
    fontSize: 14,
    lineHeight: 20,
  },
  metaSection: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  metaText: {
    color: "#999",
    fontSize: 13,
  },
  slugText: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "600",
  },
});