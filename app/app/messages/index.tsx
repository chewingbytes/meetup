import MobileNav from "@/components/mobile-nav";
import React from "react";
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";

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

export default function MessagesScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <View style={{ padding: 18, paddingTop: 36, backgroundColor: PALETTE.white, borderBottomWidth: 1, borderColor: PALETTE.babyPink }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: PALETTE.graphite }}>Chats</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>Messages from communities & friends</Text>

        <View style={{ marginTop: 12 }}>
          <TextInput
            placeholder="Search messages..."
            style={{ backgroundColor: PALETTE.lightGrey, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}
          />
        </View>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ backgroundColor: PALETTE.white, marginBottom: 10, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.03, borderWidth: 1, borderColor: PALETTE.babyPink }}>
            <Image source={{ uri: item.avatar }} style={{ width: 56, height: 56, borderRadius: 14, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>{item.name}</Text>
                <Text style={{ color: "#9CA3AF" }}>{item.time}</Text>
              </View>
              <Text style={{ color: "#6B7280", marginTop: 6 }} numberOfLines={1}>{item.last}</Text>
            </View>

            {item.unread > 0 && (
              <View style={{ backgroundColor: PALETTE.coral, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginLeft: 8 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <MobileNav active="inbox" />
    </View>
  );
}
