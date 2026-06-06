import { NeoLoader } from "@/components/ui/neo-loader";
import { getProfile } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Camera, MessageSquare, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    console.log("FINDING PROFILE", id);
    getProfile(id as string)
      .then((data) => {
        const userProfile = data.user || data;
        setProfile(userProfile);

        console.log("PROFILE DATA:", userProfile);
      })
      .catch((err: any) => {
        console.error(err);
        setError("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  //   const displayName = profile.username || "Unnamed";
  //   const displaySchool = profile.school?.trim() || "Not provided";
  //   const displayYear =
  //     profile.year_of_study?.toString().trim() || "Not provided";
  //   const displayBio = profile.bio?.trim() || "No bio yet.";
  //   const interestList = Array.isArray(profile.interests)
  //     ? profile.interests.filter(Boolean)
  //     : [];
  //   const displayInterests = interestList.length
  //     ? interestList.join(", ")
  //     : "No interests added.";

  //   const personalityType = profile.personality_type || "Unknown";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neo-bg">
        <NeoLoader />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-neo-bg p-6">
        <View className="bg-neo-red border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] rotate-2">
          <Text className="text-4xl font-black uppercase text-center mb-4 text-white">
            404
          </Text>
          <Text className="text-xl font-bold text-center mb-8 text-white uppercase">
            {error || "Profile not found"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-12 bg-white border-4 border-black px-8 py-4 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
        >
          <Text className="font-black text-xl text-black uppercase">
            ← Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Determine avatar background color randomly based on username or id length
  const colors = [
    "bg-neo-blue",
    "bg-neo-red",
    "bg-neo-green",
    "bg-neo-violet",
    "bg-neo-pink",
    "bg-neo-yellow",
  ];
  const bgColor = colors[(profile.id?.length || 0) % colors.length];

  return (
    <View className="flex-1 bg-neo-bg">
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 px-4 py-4 pt-12 bg-neo-bg border-b-4 border-black flex-row items-center justify-between z-10 sticky top-0"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000] mr-4"
          >
            <ArrowLeft color="black" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-4xl font-black uppercase tracking-tighter">
            Member File
          </Text>
        </View>
        <View className="bg-black px-2 py-1 -rotate-2">
          <Text className="text-neo-yellow font-bold text-xs uppercase">
            CONFIDENTIAL
          </Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}

        {/* --- MAIN CARD SECTION --- */}
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 100,
            paddingBottom: 180,
            paddingHorizontal: 20,
          }}
        >
          {/* ID Card */}
          <View className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] relative mb-8">
            {/* Hole Punch Visual */}
            <View className="absolute -top-6 left-[45%] w-8 h-8 bg-neo-bg rounded-full border-4 border-black z-10" />

            <View className="border-b-4 border-black pb-4 mb-4 flex-row justify-between items-end">
              <Text className="text-3xl font-black uppercase text-neo-blue tracking-widest">
                STUDENT
              </Text>
              <Text className="font-bold text-xs uppercase opacity-50">
                Valid thru 2026
              </Text>
            </View>

            <View className="flex-row gap-6 mb-6">
              <View
                className="w-24 h-32 bg-gray-200 border-2 border-black relative"
                style={{ overflow: "visible" }}
              >
                <View className="flex-1 items-center justify-center">
                  <User size={40} color="#000" />
                </View>
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                  <Camera size={24} color="#fff" />
                </View>
                {/* Personality badge */}
                <View
                  className="absolute -top-4 -right-4 bg-[#FF6B6B] border-3 border-black px-2 py-1 rotate-12 shadow-[4px_4px_0px_0px_#000]"
                  style={{ zIndex: 99 }}
                >
                  <Text className="font-black text-[10px] uppercase tracking-tight text-white">
                    {profile.personalityType || "Unknown"}
                  </Text>
                </View>
                <View className="absolute bottom-0 w-full bg-neo-yellow border-t-2 border-black py-1">
                  <Text className="text-[8px] font-black text-center uppercase">
                    Verified
                  </Text>
                </View>
              </View>

              <View className="flex-1 gap-3">
                <View>
                  <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Name
                  </Text>
                  <Text className="text-xl font-black uppercase leading-5">
                    {profile.username}
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    School
                  </Text>
                  <Text className="text-base font-bold uppercase leading-5">
                    {profile.school || "Not provided"}
                  </Text>
                </View>
                <View>
                  <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    Year
                  </Text>
                  <Text className="text-base font-bold uppercase leading-5">
                    {profile.yearOfStudy || "Not provided"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Bio Section */}
            <View className="bg-neo-bg border-2 border-black p-2 relative">
              <Text className="absolute -top-3 left-2 bg-black text-white px-1 text-[10px] font-bold uppercase">
                Notes
              </Text>
              <Text className="font-medium text-sm text-black pt-1">
                {profile.bio}
              </Text>
            </View>

            {/* Interests */}
            <View className="bg-white border-2 border-black p-3 mt-4 shadow-[4px_4px_0px_0px_#000]">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-black uppercase">Interests</Text>
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  {profile.interests.length} saved
                </Text>
              </View>
              {profile.interests.length ? (
                <View className="flex-row flex-wrap gap-2">
                  {profile.interests.map((tag: any) => (
                    <View
                      key={tag}
                      className="px-3 py-1 border-2 border-black bg-[#E0F2FE]"
                    >
                      <Text className="font-bold text-xs uppercase">{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="font-medium text-sm text-gray-600">
                  No interests added.
                </Text>
              )}
            </View>
          </View>

          {/* My Stuff Section */}
          <View className="mb-8">
            <Text className="text-2xl font-black uppercase mb-4">Archives</Text>

            <View className="flex-row flex-wrap gap-4">
              <TouchableOpacity
                onPress={() => router.push("/my-events")}
                className="flex-1 bg-[#FFD93D] border-[3px] border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none min-w-[45%]"
              >
                <Text className="font-black text-lg uppercase mb-1">
                  My Events
                </Text>
                <Text className="font-bold text-xs uppercase bg-white px-1">
                  42 Records
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Coming Soon", "Testimonials module loading...")
                }
                className="flex-1 bg-[#C4B5FD] border-[3px] border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none min-w-[45%]"
              >
                <Text className="font-black text-lg uppercase mb-1">
                  Testimonials
                </Text>
                <Text className="font-bold text-xs uppercase bg-white px-1">
                  5 Stars
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Settings Control Panel */}
          <View>
            <TouchableOpacity
              className="bg-red-500 border-4 border-black p-4 flex-row items-center justify-center shadow-[4px_4px_0px_0px_#888] active:translate-y-[2px] active:shadow-none"
              onPress={() => {}}
              activeOpacity={1}
            >
              <MessageSquare color="white" size={20} strokeWidth={3} />
              <Text className="ml-2 font-black text-white text-lg uppercase tracking-widest">
                Add friend
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
