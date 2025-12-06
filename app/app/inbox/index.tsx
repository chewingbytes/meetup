import MobileNav from "@/components/mobile-nav";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

const chats = [
  {
    id: "1",
    name: "Alya",
    avatar: "https://placehold.co/80x80",
    last: "Loved the study session last night!",
    time: "2h",
    unread: 2,
  },
  {
    id: "2",
    name: "Ben",
    avatar: "https://placehold.co/80x80",
    last: "Where's the meetup point?",
    time: "1d",
    unread: 0,
  },
  {
    id: "3",
    name: "Chloe",
    avatar: "https://placehold.co/80x80",
    last: "Can I join your group next week?",
    time: "3d",
    unread: 1,
  },
];

const alerts = [
  {
    id: "a1",
    title: "Event reminder: Night Study",
    body: "Starts in 2 hours",
    time: "2h",
  },
  {
    id: "a2",
    title: "New members joined",
    body: "3 people joined your community",
    time: "1d",
  },
  { id: "a3", title: "Message from Chloe", body: "Can I join?", time: "3d" },
];

export default function InboxScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<"chats" | "alerts">("chats");

  const screenSlideAnim = useRef(new Animated.Value(20)).current;
  const screenOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(screenSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(screenOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: PALETTE.lightGrey,
          transform: [{ translateX: screenSlideAnim }],
          opacity: screenOpacityAnim,
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: 18,
            paddingTop: 20,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={PALETTE.graphite} />
          </TouchableOpacity> */}
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 22, fontWeight: "700", color: PALETTE.graphite }}
            >
              Inbox
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>
              Chats and activity in one place
            </Text>
          </View>
        </View>

        {/* Search and Tabs */}
        <View
          style={{
            padding: 12,
            flexDirection: "row",
            gap: 8,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
          }}
        >
          <TextInput
            placeholder="Search inbox..."
            style={{
              flex: 1,
              backgroundColor: PALETTE.lightGrey,
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
          }}
        >
          <TouchableOpacity
            onPress={() => setTab("chats")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor:
                tab === "chats" ? PALETTE.coral : PALETTE.babyPink,
            }}
          >
            <Text
              style={{
                color: tab === "chats" ? PALETTE.white : PALETTE.graphite,
                fontWeight: "700",
              }}
            >
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab("alerts")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor:
                tab === "alerts" ? PALETTE.coral : PALETTE.babyPink,
            }}
          >
            <Text
              style={{
                color: tab === "alerts" ? PALETTE.white : PALETTE.graphite,
                fontWeight: "700",
              }}
            >
              Alerts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {tab === "chats" ? (
          <FlatList
            data={chats}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: PALETTE.white,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: PALETTE.babyPink,
                }}
              >
                <Image
                  source={{ uri: item.avatar }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                      {item.time}
                    </Text>
                  </View>
                  <Text style={{ color: "#6B7280", marginTop: 6 }}>
                    {item.last}
                  </Text>
                </View>
                {item.unread > 0 && (
                  <View
                    style={{
                      backgroundColor: PALETTE.coral,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ color: PALETTE.white, fontWeight: "700" }}>
                      {item.unread}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: PALETTE.white,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: PALETTE.babyPink,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: "#9CA3AF" }}>{item.time}</Text>
                </View>
                <Text style={{ color: "#6B7280", marginTop: 6 }}>
                  {item.body}
                </Text>

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: PALETTE.coral,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: PALETTE.white, fontWeight: "700" }}>
                      View
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: PALETTE.babyPink,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{ color: PALETTE.graphite, fontWeight: "700" }}
                    >
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </Animated.View>
      <MobileNav active="inbox" />
    </SafeAreaView>
  );
}
