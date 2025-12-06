import MobileNav from "@/components/mobile-nav";
import { useState } from "react";
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

const interestGroups = [
  {
    id: "study",
    name: "Study Group",
    avatar: "https://placehold.co/80x80",
    miniGroups: [
      { id: "sg1", name: "Finals Prep", members: 12 },
      { id: "sg2", name: "Math Wizards", members: 8 },
    ],
  },
  {
    id: "sports",
    name: "Sports Buddies",
    avatar: "https://placehold.co/80x80",
    miniGroups: [
      { id: "sp1", name: "Morning Runners", members: 15 },
      { id: "sp2", name: "Weekend Football", members: 10 },
    ],
  },
  {
    id: "thrift",
    name: "Thrift Enthusiasts",
    avatar: "https://placehold.co/80x80",
    miniGroups: [
      { id: "th1", name: "Bugis Vintage", members: 7 },
      { id: "th2", name: "Y2K Finds", members: 5 },
    ],
  },
];

export default function GroupsScreen() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [joinedMiniGroups, setJoinedMiniGroups] = useState<string[]>(["sg1", "sp1"]);

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ padding: 18, paddingTop: 36, backgroundColor: PALETTE.white, borderBottomWidth: 1, borderColor: PALETTE.babyPink }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: PALETTE.graphite }}>Your Interest Groups</Text>
          <Text style={{ color: "#6b7280", marginTop: 4 }}>Join mini-groups, chat, and host events</Text>
        </View>

        {interestGroups.map((group) => (
          <View key={group.id} style={{ margin: 16, backgroundColor: PALETTE.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: PALETTE.babyPink }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: group.avatar }} style={{ width: 56, height: 56, borderRadius: 14, marginRight: 12 }} />
              <Text style={{ fontWeight: "800", fontSize: 18, color: PALETTE.graphite }}>{group.name}</Text>
            </View>
            <Text style={{ color: "#6b7280", marginTop: 6 }}>Mini-groups:</Text>
            <FlatList
              data={group.miniGroups}
              keyExtractor={(i) => i.id}
              horizontal
              style={{ marginTop: 8 }}
              renderItem={({ item }) => (
                <View style={{ backgroundColor: PALETTE.babyPink, borderRadius: 12, padding: 10, marginRight: 10, minWidth: 120 }}>
                  <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>{item.name}</Text>
                  <Text style={{ color: "#6b7280", fontSize: 12 }}>{item.members} members</Text>
                  {joinedMiniGroups.includes(item.id) ? (
                    <TouchableOpacity style={{ marginTop: 8, backgroundColor: PALETTE.coral, borderRadius: 8, paddingVertical: 6 }}>
                      <Text style={{ color: PALETTE.white, textAlign: "center" }}>Chat</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={{ marginTop: 8, backgroundColor: PALETTE.apricot, borderRadius: 8, paddingVertical: 6 }} onPress={() => setJoinedMiniGroups([...joinedMiniGroups, item.id])}>
                      <Text style={{ color: PALETTE.graphite, textAlign: "center" }}>Join</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
            <TouchableOpacity style={{ marginTop: 12, backgroundColor: PALETTE.coral, borderRadius: 10, paddingVertical: 10 }}>
              <Text style={{ color: PALETTE.white, textAlign: "center", fontWeight: "700" }}>Host Event in {group.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <MobileNav active="groups" />
    </View>
  );
}
