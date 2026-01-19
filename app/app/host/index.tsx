import MobileNav from "@/components/mobile-nav";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
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

type Template = {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
};

export default function HostScreen() {
  const router = useRouter();
  const { groupId, groupName } = useLocalSearchParams();

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

  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "t1",
      name: "Study Group — Cozy Cafe",
      description: "2-4 people, bring notes",
      thumbnail: "https://placehold.co/160x100",
    },
    {
      id: "t2",
      name: "Morning Run — ECP",
      description: "Casual 5K run",
      thumbnail: "https://placehold.co/160x100",
    },
    {
      id: "t3",
      name: "Thrift Shop Crawl",
      description: "Explore Bugis vintage finds",
      thumbnail: "https://placehold.co/160x100",
    },
    {
      id: "t4",
      name: "Night Study Sesh",
      description: "Quiet study meetup",
      thumbnail: "https://placehold.co/160x100",
    },
  ]);

  const [mode, setMode] = useState<"browse" | "editor">("browse");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  // Form fields for event creation
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");

  const chooseTemplate = (t?: Template) => {
    if (t) {
      setActiveTemplate(t);
      // prefill form with template name
      setTitle(t.name);
      setDetails(t.description || "");
    } else {
      setActiveTemplate(null);
      setTitle("");
      setDetails("");
    }
    setMode("editor");
  };

  const addTemplate = () => {
    const id = "t" + (templates.length + 1 + Math.floor(Math.random() * 1000));
    const newT: Template = {
      id,
      name: `Custom template ${templates.length + 1}`,
      description: "",
      thumbnail: "https://placehold.co/160x100",
    };
    setTemplates((p) => [newT, ...p]);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((p) => p.filter((x) => x.id !== id));
  };

  const publishEvent = () => {
    const payload = {
      title,
      date,
      time,
      location,
      details,
      template: activeTemplate,
    };
    console.log("Publishing event:", payload);
    Alert.alert("Event hosted", "Your event was published (mock).", [
      { text: "OK", onPress: () => router.replace("/home" as any) },
    ]);
  };

  if (mode === "browse") {
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
          <View
            style={{
              padding: 18,
              paddingTop: 20,
              backgroundColor: PALETTE.white,
              borderBottomWidth: 1,
              borderColor: PALETTE.babyPink,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
              <ArrowLeft size={24} color={PALETTE.graphite} />
            </TouchableOpacity> */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: PALETTE.graphite,
                }}
              >
                Host an event
              </Text>
              <Text style={{ color: "#6b7280", marginTop: 4 }}>
                Choose a template to start, or create your own
              </Text>
              {groupName && (
                <Text
                  style={{
                    color: PALETTE.coral,
                    marginTop: 8,
                    fontWeight: "700",
                  }}
                >
                  Hosting in: {groupName}
                </Text>
              )}
            </View>
          </View>

          <View
            style={{
              padding: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "700" }}>Templates</Text>
            <TouchableOpacity
              onPress={addTemplate}
              style={{
                backgroundColor: PALETTE.coral,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: PALETTE.white, fontWeight: "700" }}>
                Add template
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={templates}
            keyExtractor={(i) => i.id}
            numColumns={2}
            contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
            renderItem={({ item }) => (
              <View style={{ flex: 1, margin: 6 }}>
                <TouchableOpacity
                  onPress={() => chooseTemplate(item)}
                  style={{
                    backgroundColor: PALETTE.white,
                    borderRadius: 12,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: PALETTE.babyPink,
                  }}
                >
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={{ width: "100%", height: 100 }}
                  />
                  <View style={{ padding: 10 }}>
                    <Text
                      style={{ fontWeight: "800", color: PALETTE.graphite }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 6 }}>
                      {item.description}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => chooseTemplate(item)}
                    style={{
                      flex: 1,
                      marginRight: 6,
                      backgroundColor: PALETTE.apricot,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ textAlign: "center", fontWeight: "700" }}>
                      Use
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteTemplate(item.id)}
                    style={{
                      flex: 1,
                      marginLeft: 6,
                      backgroundColor: PALETTE.babyPink,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ textAlign: "center", fontWeight: "700" }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </Animated.View>
        <MobileNav active="host" />
      </SafeAreaView>
    );
  }

  // Editor mode
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: PALETTE.white,
          transform: [{ translateX: screenSlideAnim }],
          opacity: screenOpacityAnim,
        }}
      >
        <View
          style={{
            padding: 18,
            paddingTop: 20,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={PALETTE.graphite} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: PALETTE.graphite,
              }}
            >
              {activeTemplate
                ? `Using: ${activeTemplate.name}`
                : "Create new event"}
            </Text>
            <Text style={{ color: "#6b7280", marginTop: 4 }}>
              Fill in the event details below.
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{
            padding: 18,
            paddingBottom: 140,
          }}
        >

        <Text style={{ marginBottom: 6 }}>Event title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Late Night Study"
          style={{
            borderWidth: 1,
            borderColor: PALETTE.babyPink,
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
          }}
        />

        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 6 }}>Date</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2025-12-10"
              style={{
                borderWidth: 1,
                borderColor: PALETTE.babyPink,
                padding: 10,
                borderRadius: 10,
                marginBottom: 12,
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ marginBottom: 6 }}>Time</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="20:00"
              style={{
                borderWidth: 1,
                borderColor: PALETTE.babyPink,
                padding: 10,
                borderRadius: 10,
                marginBottom: 12,
              }}
            />
          </View>
        </View>

        <Text style={{ marginBottom: 6 }}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="Central Library"
          style={{
            borderWidth: 1,
            borderColor: PALETTE.babyPink,
            padding: 10,
            borderRadius: 10,
            marginBottom: 12,
          }}
        />

        <Text style={{ marginBottom: 6 }}>Details</Text>
        <TextInput
          value={details}
          onChangeText={setDetails}
          placeholder="Bring your notes, snacks, etc."
          multiline
          numberOfLines={4}
          style={{
            borderWidth: 1,
            borderColor: PALETTE.babyPink,
            padding: 10,
            borderRadius: 10,
            marginBottom: 18,
          }}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => setMode("browse")}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#6b7280" }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={publishEvent}
            style={{
              backgroundColor: PALETTE.coral,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: PALETTE.white, fontWeight: "700" }}>
              Host event
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </Animated.View>
      <MobileNav active="host" />
    </SafeAreaView>
  );
}
