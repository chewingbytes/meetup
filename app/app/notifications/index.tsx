import MobileNav from "@/components/mobile-nav";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

const alerts = [
  { id: "a1", title: "Event reminder: Night Study", body: "Starts in 2 hours", time: "2h" },
  { id: "a2", title: "New members joined", body: "3 people joined your community", time: "1d" },
  { id: "a3", title: "Message from Chloe", body: "Can I join?", time: "3d" },
];

export default function NotificationsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <View style={{ padding: 18, paddingTop: 36, backgroundColor: PALETTE.white, borderBottomWidth: 1, borderColor: PALETTE.babyPink }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: PALETTE.graphite }}>Alerts</Text>
        <Text style={{ color: "#6b7280", marginTop: 4 }}>Activity & reminders</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: PALETTE.white, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: PALETTE.babyPink }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>{item.title}</Text>
              <Text style={{ color: "#9CA3AF" }}>{item.time}</Text>
            </View>
            <Text style={{ color: "#6B7280", marginTop: 6 }}>{item.body}</Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity style={{ backgroundColor: PALETTE.coral, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginRight: 8 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: PALETTE.babyPink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}>
                <Text style={{ color: PALETTE.graphite, fontWeight: "700" }}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <MobileNav active="inbox" />
    </View>
  );
}
