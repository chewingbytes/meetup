import MobileNav from "@/components/mobile-nav";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

const interestGroups = [
  {
    id: "study",
    name: "Study Group",
    avatar: "https://placehold.co/80x80",
    unread: 3,
  },
  {
    id: "sports",
    name: "Sports Buddies",
    avatar: "https://placehold.co/80x80",
    unread: 0,
  },
  {
    id: "thrift",
    name: "Thrift Enthusiasts",
    avatar: "https://placehold.co/80x80",
    unread: 7,
  },
];

const pinnedGroups = [
  {
    id: "sg1",
    name: "Finals Prep",
    avatar: "https://placehold.co/80x80",
    unread: 2,
  },
  {
    id: "sp1",
    name: "Morning Runners",
    avatar: "https://placehold.co/80x80",
    unread: 1,
  },
];

const currentEvents = [
  {
    id: "e1",
    name: "Night Study Sesh",
    group: "Study Group",
    time: "Tonight 8pm",
  },
  {
    id: "e2",
    name: "Morning Run @ ECP",
    group: "Sports Buddies",
    time: "Tomorrow 6:30am",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const openChat = (groupId: string, groupName: string) => {
    router.push(`/chat/${groupId}?name=${groupName}` as any);
  };

  const GroupCardBlob = ({ group }: { group: any }) => (
    <TouchableOpacity
      onPress={() => openChat(group.id, group.name)}
      style={{
        backgroundColor: PALETTE.white,
        borderRadius: 32,
        padding: 18,
        marginRight: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: PALETTE.babyPink,
        minWidth: 140,
      }}
    >
      <Image
        source={{ uri: group.avatar }}
        style={{ width: 56, height: 56, borderRadius: 28, marginBottom: 8 }}
      />
      <Text
        style={{
          fontWeight: "700",
          color: PALETTE.graphite,
          textAlign: "center",
        }}
      >
        {group.name}
      </Text>
      {group.unread > 0 && (
        <View
          style={{
            backgroundColor: PALETTE.coral,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginTop: 8,
          }}
        >
          <Text
            style={{ color: PALETTE.white, fontWeight: "700", fontSize: 12 }}
          >
            {group.unread} unread
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <View style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View
            style={{
              padding: 18,
              paddingTop: 36,
              backgroundColor: PALETTE.white,
              borderBottomWidth: 1,
              borderColor: PALETTE.babyPink,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: PALETTE.graphite,
              }}
            >
              Home
            </Text>
          </View>

          {/* Your Interests */}
          <Text
            style={{
              marginLeft: 18,
              marginTop: 24,
              fontWeight: "700",
              fontSize: 18,
              color: PALETTE.graphite,
            }}
          >
            Your Interests
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12, marginLeft: 18 }}
          >
            {interestGroups.map((group) => (
              <GroupCardBlob key={group.id} group={group} />
            ))}
          </ScrollView>

          {/* Pinned */}
          <Text
            style={{
              marginLeft: 18,
              marginTop: 32,
              fontWeight: "700",
              fontSize: 18,
              color: PALETTE.graphite,
            }}
          >
            Your Pinned
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12, marginLeft: 18 }}
          >
            {pinnedGroups.map((group) => (
              <GroupCardBlob key={group.id} group={group} />
            ))}
          </ScrollView>

          {/* Current Events */}
          <Text
            style={{
              marginLeft: 18,
              marginTop: 32,
              fontWeight: "700",
              fontSize: 18,
              color: PALETTE.graphite,
            }}
          >
            Current Events
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12, marginLeft: 18, marginRight: 18 }}
          >
            {currentEvents.map((event) => (
              <View
                key={event.id}
                style={{
                  backgroundColor: PALETTE.babyPink,
                  borderRadius: 32,
                  padding: 18,
                  marginRight: 16,
                  alignItems: "center",
                  minWidth: 160,
                }}
              >
                <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>
                  {event.name}
                </Text>
                <Text style={{ color: "#6b7280", marginTop: 6 }}>
                  {event.group}
                </Text>
                <Text style={{ color: PALETTE.coral, marginTop: 6 }}>
                  {event.time}
                </Text>
              </View>
            ))}
          </ScrollView>
        </ScrollView>
        <MobileNav active="groups" />
      </View>
    </SafeAreaView>
  );
}
