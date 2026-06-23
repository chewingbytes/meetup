import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Calendar,
  Users,
  UserPlus,
  ChevronLeft,
  X,
  Check,
  Bell
} from "lucide-react-native";

type NotificationType = "event" | "community" | "friend";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  unread?: boolean;
  refId?: string;
};

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "event",
    title: "EVENT REMINDER",
    message: "Game Night starts tomorrow at 7:30pm — don't forget to bring snacks!",
    time: "2H",
    unread: true,
    refId: "e1",
  },
  {
    id: "n2",
    type: "community",
    title: "NEW POST IN MUSIC",
    message: "Someone posted a playlist you might like.",
    time: "6H",
    unread: true,
    refId: "c4",
  },
  {
    id: "n3",
    type: "friend",
    title: "FRIEND REQUEST",
    message: "Alex Lee sent you a friend request.",
    time: "1D",
    unread: false,
    refId: "u42",
  },
  {
    id: "n4",
    type: "event",
    title: "EVENT CANCELLED",
    message: "The host cancelled the upcoming Study Group session.",
    time: "3D",
    unread: false,
    refId: "e2",
  },
];

export default function NotificationsIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const unread = items.filter((i) => i.unread);
  const earlier = items.filter((i) => !i.unread);

  function iconFor(type: NotificationType) {
    if (type === "event") return <Calendar size={20} color="#000" />;
    if (type === "community") return <Users size={20} color="#000" />;
    return <UserPlus size={20} color="#000" />;
  }

  function getBgColor(type: NotificationType) {
    if (type === "event") return "bg-[#FFD93D]"; // Yellow
    if (type === "community") return "bg-[#C4B5FD]"; // Violet
    if (type === "friend") return "bg-[#FF6B6B]"; // Red
    return "bg-white";
  }

  function openNotification(n: NotificationItem) {
    if (n.type === "event" && n.refId) {
      router.push(`/events/${n.refId}` as any);
    } else if (n.type === "community" && n.refId) {
      router.push(`/community/${n.refId}` as any);
    } else if (n.type === "friend" && n.refId) {
      // router.push(`/profile/${n.refId}` as any);
      // Profile path might need adjustment
    } else {
      router.push("/");
    }

    setItems((prev) =>
      prev.map((p) => (p.id === n.id ? { ...p, unread: false } : p))
    );
  }

  function acceptFriend(id: string) {
    Alert.alert("FRIEND REQUEST ACCEPTED");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function declineFriend(id: string) {
    Alert.alert("FRIEND REQUEST DECLINED");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  const NotificationCard = ({ n }: { n: NotificationItem }) => (
    <TouchableOpacity
      key={n.id}
      onPress={() => openNotification(n)}
      activeOpacity={0.9}
      className={`
        mb-3 flex-row border-[3px] border-black p-3
        ${n.unread ? "bg-white shadow-[4px_4px_0px_0px_#000]" : "bg-gray-100 opacity-90"}
      `}
    >
      {/* Icon Box */}
      <View className={`w-10 h-10 border-[2px] border-black items-center justify-center mr-3 ${getBgColor(n.type)}`}>
        {iconFor(n.type)}
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-start">
          <Text className="font-black text-sm uppercase text-black flex-1 mr-2 leading-tight">
            {n.title}
          </Text>
          <Text className="text-xs font-bold text-gray-500 bg-white border border-black px-1">
            {n.time}
          </Text>
        </View>
        
        <Text className="text-black font-medium mt-1 text-sm leading-tight">
          {n.message}
        </Text>

        {n.type === "friend" && (
          <View className="flex-row mt-3 gap-2">
            <TouchableOpacity
              onPress={() => acceptFriend(n.id)}
              className="bg-[#A7F3D0] border-[2px] border-black px-3 py-1 flex-row items-center active:translate-y-1"
            >
              <Check size={14} color="#000" strokeWidth={3} />
              <Text className="ml-1 font-bold text-xs uppercase">Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => declineFriend(n.id)}
              className="bg-white border-[2px] border-black px-3 py-1 flex-row items-center active:translate-y-1"
            >
              <X size={14} color="#000" strokeWidth={3} />
              <Text className="ml-1 font-bold text-xs uppercase">Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {n.unread && (
        <View className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B6B] border border-black" />
      )}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FFFDF5]">
      {/* Sticky Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 bg-[#FF6B6B] border-b-[3px] border-black px-4 pb-3"
      >
        <View className="flex-row items-center justify-between mt-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white border-[2px] border-black items-center justify-center active:translate-y-1"
            >
              <ChevronLeft size={24} color="#000" strokeWidth={3} />
            </TouchableOpacity>

            <Text className="font-black text-xl text-white uppercase tracking-wider drop-shadow-md">
              Notifications
            </Text>

            <TouchableOpacity
              onPress={clearAll}
              className="bg-white border-[2px] border-black px-2 py-1 active:translate-y-1"
            >
              <Text className="font-bold text-xs uppercase">Clear</Text>
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView
         contentContainerStyle={{
           paddingTop: insets.top + 80,
           paddingBottom: 100,
           paddingHorizontal: 16
         }}
      >
        {items.length === 0 ? (
          <View className="mt-20 items-center justify-center p-6 border-[3px] border-black bg-white shadow-[4px_4px_0px_0px_#000]">
            <Bell size={48} color="#000" className="mb-4" />
            <Text className="font-black text-xl text-center uppercase mb-2">
              All Change!
            </Text>
            <Text className="font-medium text-center text-gray-800">
              No new notifications. You're all caught up!
            </Text>
          </View>
        ) : (
          <>
            {unread.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <View className="bg-[#FF6B6B] border-[2px] border-black px-3 py-1 transform -rotate-1">
                    <Text className="font-black text-white text-xs uppercase">New Stuff</Text>
                  </View>
                </View>
                {unread.map((n) => (
                  <NotificationCard key={n.id} n={n} />
                ))}
              </View>
            )}

            {earlier.length > 0 && (
              <View className="mb-20">
                 <View className="flex-row items-center mb-3">
                  <View className="bg-[#C4B5FD] border-[2px] border-black px-3 py-1 transform rotate-1">
                    <Text className="font-black text-white text-xs uppercase">Old News</Text>
                  </View>
                </View>
                {earlier.map((n) => (
                  <NotificationCard key={n.id} n={n} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
