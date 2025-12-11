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
  background: "#000000",
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
  const [tab, setTab] = useState<"chats" | "alerts">("chats");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.background }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: PALETTE.background,
        }}
      >
        {/* Header */}
        <View
          style={{
            padding: 18,
            paddingTop: 20,
            borderBottomWidth: 1,
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
              style={{
                fontSize: 22,
                fontWeight: "700",
              }}
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
            borderBottomWidth: 1,
          }}
        >
          <TextInput
            placeholder="Search inbox..."
            style={{
              flex: 1,
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
            borderBottomWidth: 1,
          }}
        >
          <TouchableOpacity
            onPress={() => setTab("chats")}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
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
            }}
          >
            <Text
              style={{
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
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
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
                    <Text>{item.name}</Text>
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
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 999,
                      marginLeft: 8,
                    }}
                  >
                    <Text>{item.unread}</Text>
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
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 10,
                  borderWidth: 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>{item.title}</Text>
                  <Text style={{ color: "#9CA3AF" }}>{item.time}</Text>
                </View>
                <Text style={{ color: "#6B7280", marginTop: 6 }}>
                  {item.body}
                </Text>

                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ fontWeight: "700" }}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontWeight: "700" }}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </Animated.View>
      <MobileNav active="chat" />
    </SafeAreaView>
  );
}
