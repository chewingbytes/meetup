import { Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SearchModal({
  searchSheetOpen,
  setSearchSheetOpen,
  events,
  communities,
  router,
}: {
  searchSheetOpen: boolean;
  setSearchSheetOpen: (open: boolean) => void;
  events: any[];
  communities: any[];
  router: any;
}) {
  const [searchTab, setSearchTab] = useState<"events" | "communities">(
    "events",
  );
  const [modalQuery, setModalQuery] = useState("");
  const insets = useSafeAreaInsets();

  const filteredModalEvents = useMemo(() => {
    const q = modalQuery.toLowerCase();
    return events.filter(
      (ev) =>
        ev.name?.toLowerCase().includes(q) ||
        ev.location_text?.toLowerCase().includes(q),
    );
  }, [events, modalQuery]);

  const filteredModalCommunities = useMemo(() => {
    const q = modalQuery.toLowerCase();
    return communities.filter((c) => c.name?.toLowerCase().includes(q));
  }, [communities, modalQuery]);
  return (
    <Modal
      animationType="slide"
      transparent
      visible={searchSheetOpen}
      onRequestClose={() => setSearchSheetOpen(false)}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={() => setSearchSheetOpen(false)}
        />
        <View
          className="bg-neo-bg border-t-4 border-x-4 border-black"
          style={{ flex: 1, paddingTop: insets.top }}
        >
          <View className="flex-row items-center justify-between px-4 py-3 border-b-2 border-black">
            <Text className="font-black text-xl uppercase">Find Something</Text>
            <TouchableOpacity
              onPress={() => setSearchSheetOpen(false)}
              className="bg-[#FF6B6B] border-2 border-black px-3 py-1 shadow-[3px_3px_0px_0px_#000] active:translate-y-[1px] active:shadow-none"
              activeOpacity={1}
            >
              <Text className="text-black font-black uppercase text-sm">
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row border-b-2 border-black">
            {["events", "communities"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSearchTab(tab as any)}
                className={`flex-1 items-center py-3 border-r-2 border-black ${
                  searchTab === tab ? "bg-[#FFD93D]" : "bg-white"
                } ${tab === "communities" ? "border-r-0" : ""}`}
              >
                <Text className="font-black uppercase">
                  {tab === "events" ? "Events" : "Communities"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="px-4 py-3 border-b-2 border-black">
            <View className="flex-row items-center bg-white border-2 border-black px-3 py-2">
              <Search size={20} color="#000" strokeWidth={3} />
              <TextInput
                autoFocus
                value={modalQuery}
                onChangeText={setModalQuery}
                placeholder={`Search ${searchTab}...`}
                placeholderTextColor="#999"
                className="flex-1 ml-2 font-bold text-base"
              />
            </View>
          </View>

          <ScrollView className="px-4 pt-3">
            {searchTab === "events" &&
              filteredModalEvents.map((ev, idx) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => {
                    setSearchSheetOpen(false);
                    router.push(`/events/${ev.id}` as any);
                  }}
                  className={`mb-6 p-3 border-2 border-black bg-white ${
                    idx % 2 === 0 ? "-rotate-1" : "rotate-1"
                  } shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none`}
                >
                  <Text
                    className="font-black text-lg uppercase mb-1"
                    numberOfLines={1}
                  >
                    {ev.name}
                  </Text>
                  <Text
                    className="font-bold text-xs uppercase text-gray-600"
                    numberOfLines={2}
                  >
                    {ev.location_text || "No location"}
                  </Text>
                </TouchableOpacity>
              ))}

            {searchTab === "communities" &&
              filteredModalCommunities.map((comm, idx) => (
                <TouchableOpacity
                  key={comm.id}
                  onPress={() => {
                    setSearchSheetOpen(false);
                    router.push(`/community/${comm.id}` as any);
                  }}
                  className={`mb-6 p-3 border-2 border-black bg-white ${
                    idx % 2 === 0 ? "rotate-1" : "-rotate-1"
                  } shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none`}
                >
                  <Text
                    className="font-black text-lg uppercase mb-1"
                    numberOfLines={1}
                  >
                    {comm.name}
                  </Text>
                  <Text className="font-bold text-xs uppercase text-gray-600">
                    {comm._count?.members || 0} member(s)
                  </Text>
                </TouchableOpacity>
              ))}

            {(searchTab === "events"
              ? filteredModalEvents
              : filteredModalCommunities
            ).length === 0 && (
              <View className="items-center py-8">
                <Text className="font-black uppercase text-gray-500">
                  Nothing yet. Try another vibe.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
