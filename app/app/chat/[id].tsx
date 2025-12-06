import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Menu, Plus, Send, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    Modal,
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

const mockMessages = [
  {
    id: "1",
    sender: "Sarah",
    avatar: "https://placehold.co/40x40",
    text: "Hey everyone! Let's study together tonight",
    time: "10:30 AM",
  },
  {
    id: "2",
    sender: "You",
    avatar: "https://placehold.co/40x40",
    text: "Sounds good! When and where?",
    time: "10:32 AM",
  },
  {
    id: "3",
    sender: "Alex",
    avatar: "https://placehold.co/40x40",
    text: "Central Library Level 7 at 8pm?",
    time: "10:35 AM",
  },
];

const mockMembers = [
  { id: "1", name: "Sarah Lee", avatar: "https://placehold.co/60x60" },
  { id: "2", name: "Alex Chen", avatar: "https://placehold.co/60x60" },
  { id: "3", name: "Jamie Tan", avatar: "https://placehold.co/60x60" },
  { id: "4", name: "You", avatar: "https://placehold.co/60x60" },
];

const mockEvents = [
  {
    id: "e1",
    name: "Night Study Sesh",
    time: "Tonight 8pm",
    location: "Central Library",
  },
  {
    id: "e2",
    name: "Study Review",
    time: "Tomorrow 6pm",
    location: "NUS Library",
  },
];

export default function ChatRoomScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams();
  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubgroupName, setNewSubgroupName] = useState("");
  const [newSubgroupDescription, setNewSubgroupDescription] = useState("");
  const [subgroups, setSubgroups] = useState<Array<{ id: string; name: string; description: string }>>([
    { id: "sg1", name: "Morning Study", description: "Early birds meet up" },
    { id: "sg2", name: "Night Owls", description: "Late night sessions" },
  ]);
  const drawerAnim = useRef(new Animated.Value(-280)).current;

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    Animated.timing(drawerAnim, {
      toValue: drawerOpen ? -280 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const goBack = () => {
    router.back();
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      setMessages([
        ...messages,
        {
          id: String(messages.length + 1),
          sender: "You",
          avatar: "https://placehold.co/40x40",
          text: inputText,
          time: "Now",
        },
      ]);
      setInputText("");
    }
  };

  const goToHost = () => {
    router.push(`/host?groupId=${id}&groupName=${name}` as any);
  };

  const createSubgroup = () => {
    if (newSubgroupName.trim()) {
      const newSubgroup = {
        id: `sg_${Date.now()}`,
        name: newSubgroupName,
        description: newSubgroupDescription,
      };
      setSubgroups([...subgroups, newSubgroup]);
      setNewSubgroupName("");
      setNewSubgroupDescription("");
      setShowCreateModal(false);
    }
  };

  const navigateToSubgroup = (subgroupId: string, subgroupName: string) => {
    // Navigate to the subgroup as a new chat
    router.push(`/chat/${subgroupId}?name=${subgroupName}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.lightGrey }}>
      <View style={{ flex: 1, backgroundColor: PALETTE.white }}>
        {/* HEADER */}
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: PALETTE.white,
            borderBottomWidth: 1,
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 20,
          }}
        >
          <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
            <ArrowLeft size={24} color={PALETTE.graphite} />
          </TouchableOpacity>

          <Text
            style={{ fontSize: 18, fontWeight: "700", color: PALETTE.graphite }}
          >
            {name || "Chat"}
          </Text>

          {/* <TouchableOpacity
            onPress={goToHost}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: PALETTE.coral,
              borderRadius: 8,
            }}
          >
            <Text
              style={{ color: PALETTE.white, fontWeight: "700", fontSize: 12 }}
            >
              Create Event
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity onPress={toggleDrawer} style={{ padding: 8 }}>
            <Menu size={24} color={PALETTE.graphite} />
          </TouchableOpacity>
        </View>

        {/* LEFT DRAWER */}
        <Animated.View
          style={{
            position: "absolute",
            left: drawerAnim,
            top: 56,
            width: 280,
            height: "100%",
            backgroundColor: PALETTE.lightGrey,
            zIndex: 100,
            borderRightWidth: 1,
            borderColor: PALETTE.babyPink,
          }}
        >
          {/* Drawer Header with Plus Button */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: PALETTE.white,
              borderBottomWidth: 1,
              borderColor: PALETTE.babyPink,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 14,
                color: PALETTE.graphite,
              }}
            >
              {name || "Group"}
            </Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                padding: 6,
                backgroundColor: PALETTE.coral,
                borderRadius: 6,
              }}
            >
              <Plus size={16} color={PALETTE.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingVertical: 12 }}>
            {/* Subgroups Section */}
            {subgroups.length > 0 && (
              <View style={{ paddingHorizontal: 12, marginBottom: 16 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 14,
                    color: PALETTE.graphite,
                    marginBottom: 8,
                  }}
                >
                  Subgroups ({subgroups.length})
                </Text>
                <FlatList
                  data={subgroups}
                  keyExtractor={(i) => i.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => navigateToSubgroup(item.id, item.name)}
                      style={{
                        backgroundColor: PALETTE.white,
                        padding: 10,
                        borderRadius: 10,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: PALETTE.babyPink,
                      }}
                    >
                      <Text
                        style={{ fontWeight: "700", color: PALETTE.graphite }}
                      >
                        {item.name}
                      </Text>
                      <Text style={{ color: "#6b7280", fontSize: 12 }}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Members Section */}
            <View style={{ paddingHorizontal: 12, marginBottom: 16 }}>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 14,
                  color: PALETTE.graphite,
                  marginBottom: 8,
                }}
              >
                Members ({mockMembers.length})
              </Text>
              <FlatList
                data={mockMembers}
                keyExtractor={(i) => i.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                      paddingVertical: 6,
                    }}
                  >
                    <Image
                      source={{ uri: item.avatar }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{ color: PALETTE.graphite, fontWeight: "600" }}
                    >
                      {item.name}
                    </Text>
                  </View>
                )}
              />
            </View>

            {/* Events Section */}
            <View
              style={{
                paddingHorizontal: 12,
                borderTopWidth: 1,
                borderColor: PALETTE.babyPink,
                paddingTop: 12,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 14,
                  color: PALETTE.graphite,
                  marginBottom: 8,
                }}
              >
                Events in {name}
              </Text>
              <FlatList
                data={mockEvents}
                keyExtractor={(i) => i.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: PALETTE.white,
                      padding: 10,
                      borderRadius: 10,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: PALETTE.babyPink,
                    }}
                  >
                    <Text
                      style={{ fontWeight: "700", color: PALETTE.graphite }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: "#6b7280", fontSize: 12 }}>
                      {item.time}
                    </Text>
                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                      {item.location}
                    </Text>
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </Animated.View>

        {/* CHAT MESSAGES */}
        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            paddingBottom: 80,
          }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12, flexDirection: "row" }}>
              <Image
                source={{ uri: item.avatar }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
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
                  <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>
                    {item.sender}
                  </Text>
                  <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                    {item.time}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: PALETTE.babyPink,
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    marginTop: 4,
                  }}
                >
                  <Text style={{ color: PALETTE.graphite }}>{item.text}</Text>
                </View>
              </View>
            </View>
          )}
        />

        {/* INPUT */}
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: PALETTE.white,
            borderTopWidth: 1,
            borderColor: PALETTE.babyPink,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: PALETTE.lightGrey,
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: PALETTE.babyPink,
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={{
              backgroundColor: PALETTE.coral,
              borderRadius: 999,
              paddingVertical: 10,
              paddingHorizontal: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Send size={20} color={PALETTE.white} />
          </TouchableOpacity>
        </View>

        {/* CREATE SUBGROUP MODAL */}
        <Modal
          transparent
          visible={showCreateModal}
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: PALETTE.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                paddingBottom: 40,
                maxHeight: "80%",
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: PALETTE.graphite,
                  }}
                >
                  Create Subgroup
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={{ padding: 8 }}
                >
                  <X size={24} color={PALETTE.graphite} />
                </TouchableOpacity>
              </View>

              <Text style={{ color: "#6b7280", marginBottom: 16 }}>
                Create a new subgroup within "{name}"
              </Text>

              {/* Subgroup Name Input */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    color: PALETTE.graphite,
                    marginBottom: 6,
                  }}
                >
                  Subgroup Name
                </Text>
                <TextInput
                  value={newSubgroupName}
                  onChangeText={setNewSubgroupName}
                  placeholder="e.g., Morning Study, Night Owls"
                  style={{
                    borderWidth: 1,
                    borderColor: PALETTE.babyPink,
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: PALETTE.graphite,
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Description Input */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontWeight: "700",
                    color: PALETTE.graphite,
                    marginBottom: 6,
                  }}
                >
                  Description (optional)
                </Text>
                <TextInput
                  value={newSubgroupDescription}
                  onChangeText={setNewSubgroupDescription}
                  placeholder="e.g., For early birds who prefer morning sessions"
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1,
                    borderColor: PALETTE.babyPink,
                    borderRadius: 10,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    fontSize: 14,
                    color: PALETTE.graphite,
                    textAlignVertical: "top",
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: PALETTE.babyPink,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={createSubgroup}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 10,
                    backgroundColor: PALETTE.coral,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontWeight: "700", color: PALETTE.white }}>
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
