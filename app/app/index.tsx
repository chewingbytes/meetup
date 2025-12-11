import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";

import CommunityCard from "@/components/community-card";
import EventCard from "@/components/event-card";

import { Plus, Bell, User } from "lucide-react-native";

import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { sampleEvents } from "@/data/event";
import { usersCommunities } from "@/data/communities";

import chunkArray from "@/scripts/chunkArray";

const PALETTE = {
  background: "#000000",
};

export default function HomeScreen() {
  const router = useRouter();

  const openChat = (groupId: string, groupName: string) => {
    router.push(`/chat/${groupId}?name=${groupName}` as any);
  };

  const eventChunks = chunkArray(sampleEvents, 3);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: PALETTE.background }}
      edges={["top"]}
    >
      <Header
        title="Welcome"
        actions={[
          {
            icon: Plus,
            onPress: () => console.log("Drawer opened"),
          },
          { icon: Bell, link: "/notifications" },
        ]}
      />
      <ScrollView>
        {/* <View
          style={{
            padding: 18,
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Home
          </Text>
        </View> */}

        <View className="container">
          {/* Your Events */}
          <HorizontalCarousel
            heading="Your Events"
            chunks={eventChunks}
            cardComponent={EventCard}
            dataKey="event"
          />

          {/* Your Communities */}
          <VerticalList
            heading="Your Communities"
            items={usersCommunities}
            cardComponent={CommunityCard}
            dataKey="community"
          />
          {/* <VerticalList
            heading="Your Communities"
            items={sampleEvents}
            cardComponent={EventCard}
            dataKey="event"
          /> */}
        </View>
      </ScrollView>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}
