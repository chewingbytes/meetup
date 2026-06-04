import { EventProps } from "@/utils/types";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type DateFilter = "all" | "upcoming" | "today" | "week" | "weekend";

const ACCENT_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#C4B5FD",
  "#6EE7B7",
  "#93C5FD",
  "#F472B6",
];

function fmtDate(iso?: string) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-SG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(iso?: string) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

function isWeekend(iso?: string) {
  if (!iso) return false;
  const day = new Date(iso).getDay();
  return day === 0 || day === 6;
}

interface Props {
  visible: boolean;
  events: EventProps[];
  onClose: () => void;
  onEventPress: (event: EventProps) => void;
}

export default function EventsListModal({
  visible,
  events,
  onClose,
  onEventPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const filtered = useMemo(() => {
    // "all" shows every event — no date gate so past events are still visible
    let list = [...events];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.location_text?.toLowerCase().includes(q)
      );
    }

    if (dateFilter === "upcoming")
      list = list.filter((e) => !e.end_at || new Date(e.end_at) >= new Date());
    if (dateFilter === "today") list = list.filter((e) => isToday(e.start_at));
    if (dateFilter === "week") list = list.filter((e) => isThisWeek(e.start_at));
    if (dateFilter === "weekend")
      list = list.filter(
        (e) => isThisWeek(e.start_at) && isWeekend(e.start_at)
      );

    return list.sort(
      (a, b) =>
        new Date(a.start_at || 0).getTime() -
        new Date(b.start_at || 0).getTime()
    );
  }, [events, query, dateFilter]);

  const DATE_CHIPS: { id: DateFilter; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "upcoming", label: "UPCOMING" },
    { id: "today", label: "TODAY" },
    { id: "week", label: "THIS WEEK" },
    { id: "weekend", label: "WEEKEND" },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>ALL DROPS</Text>
              <Text style={styles.headerSub}>
                {filtered.length} EVENT{filtered.length !== 1 ? "S" : ""} FOUND
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}
            >
              <X size={20} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Search size={16} color="#000" strokeWidth={3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="SEARCH BY NAME OR LOCATION..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <X size={14} color="#666" strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>

          {/* Date filter chips */}
          <View style={styles.chipRow}>
            <SlidersHorizontal
              size={14}
              color="#000"
              strokeWidth={3}
              style={{ marginRight: 6 }}
            />
            {DATE_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setDateFilter(chip.id)}
                style={[
                  styles.chip,
                  dateFilter === chip.id && styles.chipActive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    dateFilter === chip.id && styles.chipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Zap size={28} color="#000" strokeWidth={3} />
              </View>
              <Text style={styles.emptyTitle}>NOTHING HERE</Text>
              <Text style={styles.emptyBody}>
                {query
                  ? `No events match "${query}"`
                  : "No events found for this filter. Try a different date range."}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item, index }) => {
              const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
              return (
                <TouchableOpacity
                  onPress={() => {
                    onEventPress(item);
                    onClose();
                  }}
                  style={styles.card}
                  activeOpacity={0.85}
                >
                  {/* Cover */}
                  <View style={styles.cardImageWrap}>
                    {item.cover_image ? (
                      <Image
                        source={{ uri: item.cover_image }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[styles.cardImageFallback, { backgroundColor: color }]}
                      >
                        <Text style={styles.cardInitial}>
                          {item.name?.charAt(0)?.toUpperCase() ?? "E"}
                        </Text>
                      </View>
                    )}
                    {item.is_paid && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidText}>${item.price ?? "?"}</Text>
                      </View>
                    )}
                    {item.location_lat != null && (
                      <View style={styles.mapPinBadge}>
                        <MapPin size={8} color="#000" strokeWidth={3} />
                        <Text style={styles.mapPinText}>MAP</Text>
                      </View>
                    )}
                  </View>

                  {/* Body */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName} numberOfLines={2}>
                      {item.name}
                    </Text>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Calendar size={10} color="#555" strokeWidth={2.5} />
                        <Text style={styles.metaText}>
                          {fmtDate(item.start_at)}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={10} color="#555" strokeWidth={2.5} />
                        <Text style={styles.metaText}>
                          {fmtTime(item.start_at)}
                        </Text>
                      </View>
                    </View>

                    {item.location_text && (
                      <View style={styles.metaItem}>
                        <MapPin size={10} color="#FF6B6B" strokeWidth={2.5} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {item.location_text}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      {item.capacity != null && (
                        <View style={styles.capacityChip}>
                          <Users size={9} color="#000" strokeWidth={2.5} />
                          <Text style={styles.capacityText}>
                            {item.capacity} spots
                          </Text>
                        </View>
                      )}
                      <View
                        style={[styles.viewBtn, { backgroundColor: color }]}
                      >
                        <Text style={styles.viewBtnText}>VIEW →</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFDF5",
  },

  // Header
  header: {
    backgroundColor: "#FFD93D",
    borderBottomWidth: 4,
    borderColor: "#000",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -1,
    lineHeight: 40,
    textTransform: "uppercase",
  },
  headerSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.65,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#000",
  },
  chipText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: "#FFD93D",
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "#000",
    padding: 28,
    alignItems: "center",
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    gap: 10,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  emptyBody: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    lineHeight: 18,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#000",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: "hidden",
  },
  cardImageWrap: {
    width: 90,
    borderRightWidth: 3,
    borderColor: "#000",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImageFallback: {
    width: "100%",
    height: "100%",
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInitial: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000",
  },
  paidBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFD93D",
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  paidText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
  },
  mapPinBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#6EE7B7",
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  mapPinText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#000",
  },
  cardBody: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
  },
  locationText: {
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  capacityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#FFFDF5",
  },
  capacityText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
  },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: "#000",
  },
  viewBtnText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
