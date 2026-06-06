import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Users,
  Heart,
  MessageCircle,
  Lock,
  Globe,
  Share2,
  Plus,
  Info,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useCommunityStore } from "@/lib/stores/communityStore";
import { useAuth } from "@/lib/authContext";
import { joinCommunity, leaveCommunity, checkMembership } from "@/lib/api";
import MobileNav from "@/components/mobile-nav";
import { NeoLoader, NeoButtonLoader } from "@/components/ui/neo-loader";

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { communityDetails, fetchCommunityById } = useCommunityStore();
  const community = id ? communityDetails[id as string] : null;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadCommunity() {
      if (!id || !user) {
        setIsLoading(false);
        return;
      }
      try {
        await fetchCommunityById(id as string);
        if (mounted) {
          try {
            const membershipCheck = await checkMembership(
              user.id,
              id as string,
            );
            setJoined(membershipCheck?.isMember || false);
          } catch (err) {
            setJoined(false);
          }
        }
      } catch (err) {
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadCommunity();
    return () => {
      mounted = false;
    };
  }, [id, user, fetchCommunityById]);

  const handleJoinCommunity = async () => {
    if (!user || !community) return;
    try {
      setIsJoining(true);
      await joinCommunity(user.id, community.id);
      setJoined(true);
      Alert.alert("WELCOME!", "You have joined the community.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to join");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user || !community) return;
    Alert.alert("LEAVE COMMUNITY?", "Are you sure?", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        onPress: async () => {
          try {
            setIsLeaving(true);
            await leaveCommunity(user.id, community.id);
            setJoined(false);
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          } finally {
            setIsLeaving(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `Check out ${community?.name} on Meetup!` });
    } catch (error) {}
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <NeoLoader />
      </View>
    );
  }

  if (!community) {
    return (
      <View className="flex-1 bg-neo-bg pt-12 px-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mb-4 w-12 h-12 bg-white border-2 border-black items-center justify-center shadow-[4px_4px_0px_0px_#000]"
        >
          <ArrowLeft color="black" size={24} strokeWidth={3} />
        </TouchableOpacity>
        <View className="bg-neo-red border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <Text className="font-black text-2xl uppercase text-white">
            Community not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neo-bg">
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="px-4 py-4 pt-12 bg-neo-bg border-b-4 border-black flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft color="black" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <Text
            className="font-black uppercase text-xl truncate max-w-[200px]"
            numberOfLines={1}
          >
            {community.name}
          </Text>
          <TouchableOpacity
            onPress={onShare}
            className="bg-neo-yellow border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <Share2 color="black" size={24} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* HERO IMAGE */}
        <View className="h-64 w-full border-b-4 border-black bg-black">
          {community.profile_image ? (
            <Image
              source={{ uri: community.profile_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-neo-violet flex items-center justify-center">
              <Text className="text-6xl">👾</Text>
            </View>
          )}
          <View className="absolute bottom-4 left-4 bg-white border-4 border-black px-4 py-2 rotate-2 shadow-[4px_4px_0px_0px_#000]">
            <Text className="font-black uppercase">
              {joined ? "MEMBER" : "GVEST"}
            </Text>
          </View>
        </View>

        <View className="p-4">
          {/* TITLE & BADGES */}
          <View className="mb-6">
            <Text className="text-4xl font-black uppercase leading-none mb-2">
              {community.name}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <View className="bg-neo-yellow border-2 border-black px-2 py-1 flex-row items-center gap-1">
                {community.privacy_mode ? (
                  <Lock size={14} color="black" />
                ) : (
                  <Globe size={14} color="black" />
                )}
                <Text className="font-bold text-xs uppercase">
                  {community.privacy_mode ? "Private" : "Public"}
                </Text>
              </View>
              <View className="bg-white border-2 border-black px-2 py-1 flex-row items-center gap-1">
                <Users size={14} color="black" />
                <Text className="font-bold text-xs uppercase">12 Members</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View className="flex-row gap-4 mb-8">
            {!joined ? (
              <TouchableOpacity
                onPress={handleJoinCommunity}
                disabled={isJoining}
                className="flex-1 bg-neo-red border-4 border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
              >
                {isJoining ? (
                  <NeoButtonLoader color="white" />
                ) : (
                  <Text className="font-black text-xl text-white uppercase">
                    Join Now
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleLeaveCommunity}
                disabled={isLeaving}
                className="flex-1 bg-black border-4 border-black p-4 items-center shadow-[4px_4px_0px_0px_#888] active:translate-y-1 active:shadow-none"
              >
                {isLeaving ? (
                  <NeoButtonLoader color="white" />
                ) : (
                  <Text className="font-black text-xl text-white uppercase">
                    Joined ✓
                  </Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity className="bg-white border-4 border-black p-4 items-center justify-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none">
              <Heart color="black" size={24} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* CHAT/ACTIONS FOR MEMBERS */}
          {joined && (
            <TouchableOpacity
              onPress={() =>
                router.push(`/chat/${community.id}?name=${community.name}`)
              }
              className="mb-8 bg-neo-violet border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1"
            >
              <MessageCircle size={24} color="black" strokeWidth={3} />
              <Text className="font-black text-lg uppercase">
                Open Group Chat
              </Text>
            </TouchableOpacity>
          )}

          {/* TOPICS */}
          {community.topics && community.topics.length > 0 && (
            <View className="mb-8">
              <Text className="font-black text-xl uppercase mb-3 border-l-4 border-neo-yellow pl-3">
                Topics
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {community.topics.map((t, i) => (
                  <View
                    key={i}
                    className="bg-white border-2 border-black px-3 py-1 rounded-full"
                  >
                    <Text className="font-bold uppercase text-xs">{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ABOUT */}
          {community.description && (
            <View className="mb-8 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000]">
              <Text className="font-black text-xl uppercase mb-3 border-b-4 border-black pb-1 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
                About
              </Text>
              <Text className="font-bold text-lg leading-6">
                {community.description}
              </Text>
            </View>
          )}

          {/* ADMIN TOOLS */}
          {user && community.owner_id === user.id && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/community/create-template",
                  params: { community_id: community.id },
                })
              }
              className="mb-8 bg-black border-4 border-black p-4 flex-row items-center gap-4 shadow-[6px_6px_0px_0px_#888] active:translate-y-1"
            >
              <View className="bg-neo-yellow border-2 border-white p-2">
                <Plus size={24} color="black" strokeWidth={4} />
              </View>
              <View className="flex-1">
                <Text className="font-black text-white uppercase text-lg">
                  Create Template
                </Text>
                <Text className="text-gray-400 font-bold text-xs">
                  For recurring events
                </Text>
              </View>
              <Text className="text-white text-2xl font-black">→</Text>
            </TouchableOpacity>
          )}

          {/* RULES */}
          {community.rules && community.rules.length > 0 && (
            <View className="mb-8 bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_#000] rotate-1">
              <Text className="font-black text-xl uppercase mb-3 border-b-4 border-black pb-1 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
                House Rules
              </Text>
              {community.rules.map((rule, idx) => (
                <View key={idx} className="flex-row gap-3 mb-2">
                  <Text className="font-black text-neo-red">{idx + 1}.</Text>
                  <Text className="font-bold flex-1">{rule}</Text>
                </View>
              ))}
            </View>
          )}

          {/* FAQs */}
          {community.faq && community.faq.length > 0 && (
            <View className="mb-8">
              <Text className="font-black text-xl uppercase mb-3 border-l-4 border-neo-yellow pl-3">
                FAQs
              </Text>
              {community.faq.map((item, idx) => (
                <View
                  key={idx}
                  className="mb-4 bg-neo-bg border-2 border-black p-3"
                >
                  <Text className="font-black uppercase mb-1">
                    Q: {item.question}
                  </Text>
                  <Text className="font-medium text-gray-600">
                    A: {item.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* FOOTER */}
          <View className="items-center py-8">
            <Text className="font-bold text-gray-400 uppercase text-xs">
              Created{" "}
              {new Date(community.created_at || "").toLocaleDateString()}
            </Text>
          </View>
        </View>
      </ScrollView>
      <MobileNav />
    </View>
  );
}
