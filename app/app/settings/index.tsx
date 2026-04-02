import MobileNav from "@/components/mobile-nav";
import { NeoButtonLoader, NeoLoader } from "@/components/ui/neo-loader";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Camera,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    userProfile,
    userSettings,
    updateUserSettings,
    signOut,
    session,
    updateUserProfile,
  } = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!session) {
      router.replace("/login");
    }
  }, [session]);

  useEffect(() => {
    if (userProfile) {
      console.log("USERPROFILE:", userProfile);
      setForm({
        username: userProfile.username || "",
        bio: userProfile.bio || "",
        school: userProfile.school || "",
        year_of_study: userProfile.year_of_study || "",
        interests: Array.isArray(userProfile.interests)
          ? userProfile.interests.join(", ")
          : userProfile.interests || "",
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await updateUserProfile({
        username: form.username,
        bio: form.bio,
        school: form.school,
        year_of_study: form.year_of_study,
        interests: form.interests
          ? form.interests
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      });
      setIsEditing(false);
      Alert.alert("Success", "ID Card Updated!");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Abandon your post?", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleVerify = () => {
    router.push("/verify/singpass" as any);
  };

  const toggleNotification = async () => {
    if (!userSettings) return;
    try {
      await updateUserSettings({
        push_notifications: !userSettings.push_notifications,
      });
    } catch (e) {}
  };

  const needsQuiz =
    !userProfile?.personality_answers || !userProfile?.personality_type;

  const goToQuiz = () => {
    router.push("/settings/personality-quiz" as any);
  };

  if (!userProfile) {
    return (
      <View className="flex-1 bg-neo-bg items-center justify-center">
        <NeoLoader />
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-neo-red border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          <LogOut size={20} color="#000" strokeWidth={3} />
          <Text className="font-black text-lg uppercase">Log Out</Text>
        </TouchableOpacity>
      </View>
      //   <TouchableOpacity
      //     onPress={handleLogout}
      //     className="bg-neo-red border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
      //   >
      //     <LogOut size={20} color="#000" strokeWidth={3} />
      //     <Text className="font-black text-lg uppercase">Log Out</Text>
      //   </TouchableOpacity>
    );
  }

  const displayName = userProfile.username || "Unnamed";
  const displaySchool = userProfile.school?.trim() || "Not provided";
  const displayYear =
    userProfile.year_of_study?.toString().trim() || "Not provided";
  const displayBio = userProfile.bio?.trim() || "No bio yet.";
  const interestList = Array.isArray(userProfile.interests)
    ? userProfile.interests.filter(Boolean)
    : [];
  const displayInterests = interestList.length
    ? interestList.join(", ")
    : "No interests added.";

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Sticky Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 bg-[#FFD93D] px-5 pb-4 border-b-4 border-black"
      >
        <View className="flex-row items-center justify-between mt-4">
          <Text className="text-5xl font-black uppercase tracking-tighter">
            My ID
          </Text>

          {isEditing ? (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
              >
                <X size={20} color="#000" strokeWidth={3} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isUpdating}
                className="bg-green-500 border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000]"
              >
                {isUpdating ? (
                  <NeoButtonLoader color="#000" />
                ) : (
                  <Save size={20} color="#000" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="border-2 bg-white border-black p-2 shadow-[2px_2px_0px_0px_#000] rotate-2"
            >
              <Pencil size={20} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
              {userProfile.avatar_url ? (
                <Image
                  source={{ uri: userProfile.avatar_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <User size={40} color="#000" />
                </View>
              )}
              {isEditing && (
                <View className="absolute inset-0 bg-black/30 items-center justify-center">
                  <Camera size={24} color="#fff" />
                </View>
              )}
              {/* Personality badge */}
              <View
                className="absolute -top-4 -right-4 bg-[#FF6B6B] border-3 border-black px-2 py-1 rotate-12 shadow-[4px_4px_0px_0px_#000]"
                style={{ zIndex: 99 }}
              >
                <Text className="font-black text-[10px] uppercase tracking-tight text-white">
                  {userProfile.personality_type || "Take Quiz"}
                </Text>
              </View>
              {userProfile.verified ? (
                <View className="absolute bottom-0 w-full bg-neo-yellow border-t-2 border-black py-1 flex-row items-center justify-center gap-1">
                  <BadgeCheck size={10} color="black" />
                  <Text className="text-[8px] font-black text-center uppercase">
                    Verified
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleVerify}
                  className="absolute bottom-0 w-full bg-neo-red border-t-2 border-black py-1 flex-row items-center justify-center gap-1"
                >
                  <AlertTriangle size={10} color="white" />
                  <Text className="text-[8px] font-black text-center uppercase text-white">
                    Verify Now
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-1 gap-3">
              <View>
                <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Name
                </Text>
                {isEditing ? (
                  <TextInput
                    value={form.username}
                    onChangeText={(t) => setForm({ ...form, username: t })}
                    className="border-b-2 border-black font-black text-xl py-0"
                  />
                ) : (
                  <Text className="text-xl font-black uppercase leading-5">
                    {displayName}
                  </Text>
                )}
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                  School
                </Text>
                {isEditing ? (
                  <TextInput
                    value={form.school}
                    onChangeText={(t) => setForm({ ...form, school: t })}
                    className="border-b-2 border-black font-bold text-base py-0"
                  />
                ) : (
                  <Text className="text-base font-bold uppercase leading-5">
                    {displaySchool}
                  </Text>
                )}
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Year
                </Text>
                {isEditing ? (
                  <TextInput
                    value={form.year_of_study}
                    onChangeText={(t) => setForm({ ...form, year_of_study: t })}
                    className="border-b-2 border-black font-bold text-base py-0"
                  />
                ) : (
                  <Text className="text-base font-bold uppercase leading-5">
                    {displayYear}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View className="bg-neo-bg border-2 border-black p-2 relative">
            <Text className="absolute -top-3 left-2 bg-black text-white px-1 text-[10px] font-bold uppercase">
              Notes
            </Text>
            {isEditing ? (
              <TextInput
                value={form.bio}
                onChangeText={(t) => setForm({ ...form, bio: t })}
                multiline
                className="font-medium text-sm pt-2"
              />
            ) : (
              <Text className="font-medium text-sm text-black pt-1">
                {displayBio}
              </Text>
            )}
          </View>

          {/* Interests */}
          <View className="bg-white border-2 border-black p-3 mt-4 shadow-[4px_4px_0px_0px_#000]">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-black uppercase">Interests</Text>
              <Text className="text-[10px] font-bold uppercase text-gray-500">
                {interestList.length} saved
              </Text>
            </View>
            {isEditing ? (
              <TextInput
                value={form.interests}
                onChangeText={(t) => setForm({ ...form, interests: t })}
                placeholder="e.g. Art, Food, Tech"
                className="border-b-2 border-black font-medium text-sm py-1"
              />
            ) : interestList.length ? (
              <View className="flex-row flex-wrap gap-2">
                {interestList.map((tag) => (
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
                {displayInterests}
              </Text>
            )}
          </View>

          {/* Footer Barcode */}
          <View className="mt-4 pt-2 border-t-2 border-dashed border-black items-center">
            <View
              className="h-8 w-full bg-black mask-image-linear-gradient"
              style={{ opacity: 0.8 }}
            />
            <Text className="text-[8px] font-mono tracking-[4px] mt-1">
              {session?.user?.id.substring(0, 12).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Verification Banner */}
        {!userProfile.verified && (
          <TouchableOpacity
            onPress={handleVerify}
            className="mb-8 bg-neo-red border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            activeOpacity={1}
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <ShieldCheck size={24} color="white" fill="black" />
                  <Text className="text-xl font-black uppercase text-white">
                    Unverified
                  </Text>
                </View>
                <Text className="font-bold text-xs text-white/90 uppercase mb-3">
                  Verification is required to join communities and events.
                </Text>
                <View className="bg-white px-3 py-1 self-start border-2 border-black rotate-1">
                  <Text className="font-black text-xs uppercase">
                    Verify Identity &rarr;
                  </Text>
                </View>
              </View>

              <View className="bg-black/20 p-2 rounded border-2 border-white/50 rotate-3">
                <AlertTriangle size={36} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        )}

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

            <TouchableOpacity
              onPress={() => router.push("/host/dashboard" as any)}
              className="w-full bg-[#4ADE80] border-[3px] border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
            >
              <Text className="font-black text-lg uppercase mb-1">
                Host Dashboard
              </Text>
              <Text className="font-bold text-xs uppercase bg-white px-1">
                Manage Events & Guests
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Control Panel */}
        <View>
          <Text className="text-2xl font-black uppercase mb-4">
            Control Panel
          </Text>
          {needsQuiz && (
            <TouchableOpacity
              onPress={goToQuiz}
              className="bg-[#FF6B6B] border-4 border-black p-4 flex-row items-center justify-between shadow-[6px_6px_0px_0px_#000] active:translate-y-1 active:shadow-none mb-4"
            >
              <View className="flex-1 pr-3">
                <Text className="font-black text-lg uppercase">
                  Complete Vibe Quiz
                </Text>
                <Text className="font-bold text-xs uppercase text-black/70">
                  Unlock personality type and social preference.
                </Text>
              </View>
              <View className="bg-white border-2 border-black px-3 py-2">
                <Text className="font-black text-sm uppercase">Start</Text>
              </View>
            </TouchableOpacity>
          )}

          <View className="bg-white border-2 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_#000]">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="bg-neo-violet p-2 border-2 border-black">
                  <Bell size={20} color="#fff" />
                </View>
                <Text className="font-bold text-lg uppercase">
                  Notifications
                </Text>
              </View>
              <Switch
                value={userSettings?.push_notifications ?? false}
                onValueChange={toggleNotification}
                trackColor={{ false: "#eee", true: "#000" }}
                thumbColor={userSettings?.push_notifications ? "#fff" : "#000"}
              />
            </View>
            <View className="h-2 bg-gray-100 w-full mb-2">
              <View className="h-full bg-neo-green" style={{ width: "75%" }} />
            </View>
            <Text className="text-xs font-bold uppercase text-gray-400">
              System Status: Nominal
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-neo-red border-4 border-black p-4 flex-row items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
          >
            <LogOut size={20} color="#000" strokeWidth={3} />
            <Text className="font-black text-lg uppercase">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <MobileNav active="profile" />
    </View>
  );
}
