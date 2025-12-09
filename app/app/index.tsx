import HorizontalCarousel from "@/components/horizontal-carousel";
import VerticalList from "@/components/vertical-scroll-section";
import MobileNav from "@/components/mobile-nav";

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
      <ScrollView>
        <View
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
        </View>

        <View className="gap-y-6 mt-6 mb-28">
          {/* Your Events */}
          <HorizontalCarousel heading="Your Events" eventChunks={eventChunks} />

          {/* Your Communities */}
          <VerticalList
            heading="Your Communities"
            communities={usersCommunities}
          />
        </View>
      </ScrollView>
      <MobileNav active="home" />
    </SafeAreaView>
  );
}
