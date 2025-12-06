import MobileNav from "@/components/mobile-nav";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
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

const interests = ["Study", "Sports", "Thrifting", "Food", "Gaming", "Art"];

const testimonies = [
  {
    id: "t1",
    name: "Samantha",
    avatar: "https://placehold.co/64x64",
    rating: 5,
    text: "Amazing event! Met so many people and learned a ton.",
  },
  {
    id: "t2",
    name: "Marcus",
    avatar: "https://placehold.co/64x64",
    rating: 4,
    text: "Well organised — would join again.",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
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

  const goBack = () => {
    router.back();
  };

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
        {/* Header with Back Button */}
        <View
          style={{
            padding: 20,
            paddingTop: 16,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          {/* <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={PALETTE.graphite} />
          </TouchableOpacity> */}
        </View>

        {/* Profile Info */}
        <View
          style={{
            padding: 20,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: "https://placehold.co/100x100" }}
              style={{
                width: 92,
                height: 92,
                borderRadius: 20,
                marginRight: 14,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: PALETTE.graphite,
                }}
              >
                Jamie Tan
              </Text>
              <Text style={{ color: "#6B7280", marginTop: 4 }}>
                VSCO enthusiast • Coffee & coding
              </Text>

              <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: PALETTE.coral,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: PALETTE.white, fontWeight: "700" }}>
                    Message
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: PALETTE.babyPink,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: PALETTE.graphite, fontWeight: "700" }}>
                    Follow
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <FlatList
          contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
          data={[{ key: "profile" }, { key: "testimonies" }]}
          renderItem={({ item }) => {
            if (item.key === "profile") {
              return (
                <View
                  style={{
                    backgroundColor: PALETTE.white,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: PALETTE.babyPink,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color: PALETTE.graphite,
                      marginBottom: 8,
                    }}
                  >
                    Interests
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {interests.map((i) => (
                      <View
                        key={i}
                        style={{
                          backgroundColor: PALETTE.babyPink,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderRadius: 999,
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{ color: PALETTE.graphite, fontWeight: "700" }}
                        >
                          {i}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ marginTop: 14 }}>
                    <Text
                      style={{
                        fontWeight: "800",
                        color: PALETTE.graphite,
                        marginBottom: 8,
                      }}
                    >
                      Personality
                    </Text>
                    <Text style={{ color: "#6B7280" }}>
                      Outgoing • Supportive • Curious
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                style={{
                  backgroundColor: PALETTE.white,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: PALETTE.babyPink,
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    color: PALETTE.graphite,
                    marginBottom: 8,
                  }}
                >
                  Testimonies
                </Text>
                {testimonies.map((t) => (
                  <View
                    key={t.id}
                    style={{ flexDirection: "row", marginBottom: 12 }}
                  >
                    <Image
                      source={{ uri: t.avatar }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        marginRight: 10,
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text
                          style={{ fontWeight: "700", color: PALETTE.graphite }}
                        >
                          {t.name}
                        </Text>
                        <Text style={{ color: PALETTE.coral }}>
                          {"★".repeat(t.rating)}
                        </Text>
                      </View>
                      <Text style={{ color: "#6B7280", marginTop: 6 }}>
                        {t.text}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          }}
        />

        </Animated.View>
        <MobileNav active="profile" />
      </SafeAreaView>
    );
  }
