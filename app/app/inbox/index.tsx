import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Search, Plus, MessageSquare } from "lucide-react-native";
import MobileNav from "@/components/mobile-nav";

const chats = [
  {
    id: "1",
    name: "ALYA",
    avatar: "https://placehold.co/80x80/FF6B6B/000000.png?text=A",
    last: "Loved the study session last night! The vibe was immaculate.",
    time: "2H",
    unread: 2,
    color: "#FF6B6B"
  },
  {
    id: "2",
    name: "BEN",
    avatar: "https://placehold.co/80x80/FFD93D/000000.png?text=B",
    last: "Where's the meetup point? I'm lost lol.",
    time: "1D",
    unread: 0,
    color: "#FFD93D"
  },
  {
    id: "3",
    name: "CHLOE",
    avatar: "https://placehold.co/80x80/C4B5FD/000000.png?text=C",
    last: "Can I join your group next week?",
    time: "3D",
    unread: 1,
    color: "#C4B5FD"
  },
  {
    id: "4",
    name: "DAVID",
    avatar: "https://placehold.co/80x80/6EE7B7/000000.png?text=D",
    last: "Sounds good, see you there!",
    time: "4D",
    unread: 0,
    color: "#6EE7B7"
  },
  {
    id: "5",
    name: "ELLA",
    avatar: "https://placehold.co/80x80/F472B6/000000.png?text=E",
    last: "Sent you the photos!",
    time: "1W",
    unread: 0,
    color: "#F472B6"
  }
];

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }: { item: typeof chats[0] }) => (
    <TouchableOpacity
      // onPress={() => router.push(`/chat/${item.id}`)} // Assuming chat detail route
      onPress={() => router.push(`/chat/${item.id}` as any)}
      activeOpacity={0.9}
      className={`
        mb-4 flex-row items-center bg-white border-[3px] border-black p-3
        active:translate-x-1 active:translate-y-1
        shadow-[4px_4px_0px_0px_#000]
      `}
    >
      {/* Avatar with heavy border */}
      <View className={`w-14 h-14 border-[3px] border-black mr-4 bg-[${item.color}]`}>
        <Image
          source={{ uri: item.avatar }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-black text-lg uppercase">{item.name}</Text>
          <Text className="font-bold text-xs bg-black text-white px-1">
            {item.time}
          </Text>
        </View>
        <Text 
          className="font-medium text-black leading-tight" 
          numberOfLines={1}
        >
          {item.unread > 0 ? (
            <Text className="font-bold">{item.last}</Text>
          ) : (
            item.last
          )}
        </Text>
      </View>

      {item.unread > 0 && (
        <View className="w-6 h-6 bg-[#FF6B6B] border-[2px] border-black items-center justify-center transform rotate-12">
          <Text className="font-black text-xs text-white">{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FFFDF5]">
      {/* Sticky Header & Search */}
      <View
         style={{ paddingTop: insets.top, zIndex: 50 }}
         className="absolute top-0 left-0 right-0 bg-white"
      >
          {/* Header */}
          <View className="px-4 py-4 border-b-[4px] border-black bg-white flex-row justify-between items-center">
            <Text className="font-black text-3xl italic uppercase tracking-tighter">
              INBOX
            </Text>
            <TouchableOpacity
              className="w-10 h-10 bg-[#FFD93D] border-[3px] border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
            >
              <Plus size={24} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="px-4 py-4 bg-[#C4B5FD] border-b-[4px] border-black">
            <View className="flex-row items-center bg-white border-[3px] border-black px-3 py-2 shadow-[4px_4px_0px_0px_#000]">
              <Search size={24} color="#000" strokeWidth={3} className="mr-2" />
              <TextInput
                placeholder="FIND CONVERSATION..."
                placeholderTextColor="#666"
                className="flex-1 font-bold text-lg text-black uppercase"
              />
            </View>
          </View>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{
          paddingTop: insets.top + 160,
          paddingBottom: 100,
          paddingHorizontal: 16
        }}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <MessageSquare size={48} color="#000" />
            <Text className="font-black text-xl mt-4 uppercase">So Quiet...</Text>
            <Text className="font-medium">Start a conversation!</Text>
          </View>
        }
      />
      
      <MobileNav active="chat" />
    </View>
  );
}
