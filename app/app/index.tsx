import MobileNav from "@/components/mobile-nav";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowDownRight, MoveDownRight } from "lucide-react-native";
import EventCard from "@/components/event-components";
import { sampleEvents } from "@/data/event";

const PALETTE = {
  background: "#120E0B",
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View
          style={{
            padding: 18,
            borderBottomWidth: 1,
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            Home
          </Text>
        </View>

        <View className="flex-row w-full px-5 mt-6 gap-x-1.5 items-center">
          <Text className="text-white font-medium text-3xl">Your Events</Text>
          <ArrowDownRight color="grey" size={18} />
        </View>

        <ScrollView
          className=""
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
        >
          {sampleEvents.map((group) => (
            <EventCard
              event={group}
              onPress={() => console.log("WHASTTUP bigga")}
            />
          ))}
        </ScrollView>

        {/* Pinned */}
        <Text
          style={{
            marginLeft: 18,
            marginTop: 32,
            fontWeight: "700",
            fontSize: 18,
          }}
        >
          Your Pinned
        </Text>
        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12, marginLeft: 18 }}
        >
          {sampleEvents.map((group) => (
            <EventCard event={group} onPress={() => console.log("Niga")} />
          ))}
        </ScrollView> */}

        {/* Current Events */}
        <Text
          style={{
            marginLeft: 18,
            marginTop: 32,
            fontWeight: "700",
            fontSize: 18,
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
                borderRadius: 32,
                padding: 18,
                marginRight: 16,
                alignItems: "center",
                minWidth: 160,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{event.name}</Text>
              <Text style={{ color: "#6b7280", marginTop: 6 }}>
                {event.group}
              </Text>
              <Text style={{ marginTop: 6 }}>{event.time}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
      <MobileNav active="groups" />
    </SafeAreaView>
  );
}
