import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import {
  Calendar,
  Users,
  UserPlus,
  Bell,
  ChevronLeft,
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
    title: "Event reminder: Game Night",
    message:
      "Game Night starts tomorrow at 7:30pm — don't forget to bring snacks!",
    time: "2h",
    unread: true,
    refId: "e1",
  },
  {
    id: "n2",
    type: "community",
    title: "New post in Music",
    message: "Someone posted a playlist you might like.",
    time: "6h",
    unread: true,
    refId: "c4",
  },
  {
    id: "n3",
    type: "friend",
    title: "Friend request",
    message: "Alex Lee sent you a friend request.",
    time: "1d",
    unread: false,
    refId: "u42",
  },
  {
    id: "n4",
    type: "event",
    title: "Event cancelled: Study Group",
    message: "The host cancelled the upcoming Study Group session.",
    time: "3d",
    unread: false,
    refId: "e2",
  },
];

export default function NotificationsIndex() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);

  const unread = items.filter((i) => i.unread);
  const earlier = items.filter((i) => !i.unread);

  function iconFor(type: NotificationType, size = 20, color = "#fff") {
    if (type === "event") return <Calendar size={size} color={color} />;
    if (type === "community") return <Users size={size} color={color} />;
    return <UserPlus size={size} color={color} />;
  }

  function openNotification(n: NotificationItem) {
    if (n.type === "event" && n.refId) {
      router.push(`/events/${n.refId}` as any);
    } else if (n.type === "community" && n.refId) {
      router.push(`/community/${n.refId}` as any);
    } else if (n.type === "friend" && n.refId) {
      router.push(`/profile/${n.refId}` as any);
    } else {
      router.push("/");
    }

    setItems((prev) =>
      prev.map((p) => (p.id === n.id ? { ...p, unread: false } : p))
    );
  }

  function acceptFriend(id: string) {
    Alert.alert("Friend request accepted");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function declineFriend(id: string) {
    Alert.alert("Friend request declined");
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearAll() {
    setItems([]);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.centerTitle}>Notifications</Text>

        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View className="flex flex-col gap-y-1 mt-5">
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>
                Notifications about your events and communities will show up
                here.
              </Text>
            </View>
          ) : (
            <>
              {unread.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.sectionHeading}>New</Text>
                  {unread.map((n) => (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.item, n.unread && styles.unread]}
                      onPress={() => openNotification(n)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.icon}>{iconFor(n.type)}</View>

                      <View style={styles.body}>
                        <View style={styles.row}>
                          <Text style={styles.title}>{n.title}</Text>
                          <Text style={styles.time}>{n.time}</Text>
                        </View>
                        <Text style={styles.message}>{n.message}</Text>

                        {n.type === "friend" && (
                          <View style={styles.friendActions}>
                            <TouchableOpacity
                              style={styles.accept}
                              onPress={() => acceptFriend(n.id)}
                            >
                              <Text style={styles.acceptText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.decline}
                              onPress={() => declineFriend(n.id)}
                            >
                              <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {earlier.length > 0 && (
                <View>
                  <Text style={styles.sectionHeading}>Earlier</Text>
                  {earlier.map((n) => (
                    <TouchableOpacity
                      key={n.id}
                      style={styles.item}
                      onPress={() => openNotification(n)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.icon}>{iconFor(n.type)}</View>

                      <View style={styles.body}>
                        <View style={styles.row}>
                          <Text style={styles.title}>{n.title}</Text>
                          <Text style={styles.time}>{n.time}</Text>
                        </View>
                        <Text style={styles.message}>{n.message}</Text>

                        {n.type === "friend" && (
                          <View style={styles.friendActions}>
                            <TouchableOpacity
                              style={styles.accept}
                              onPress={() => acceptFriend(n.id)}
                            >
                              <Text style={styles.acceptText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.decline}
                              onPress={() => declineFriend(n.id)}
                            >
                              <Text style={styles.declineText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 6,
  },
  pageTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  clearText: { color: "#888" },
  sectionHeading: {
    color: "#999",
    marginBottom: 8,
    marginTop: 6,
    fontWeight: "600",
  },
  empty: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtitle: { color: "#999", textAlign: "center" },
  item: {
    flexDirection: "row",
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  unread: {
    borderColor: "#4f46e5",
    borderWidth: 1,
  },
  icon: {
    width: 40,
    alignItems: "center",
    justifyContent: "flex-start",
    marginRight: 12,
  },
  body: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#fff", fontWeight: "600", flex: 1, marginRight: 8 },
  time: { color: "#777", fontSize: 12 },
  message: { color: "#ccc", marginTop: 6 },
  friendActions: { flexDirection: "row", marginTop: 10 },
  accept: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  acceptText: { color: "#fff", fontWeight: "600" },
  decline: {
    borderColor: "#444",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  declineText: { color: "#fff" },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  centerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
});
