/**
 * EventsListModal — clay-styled bottom sheet showing all events.
 */

import { C } from "@/theme/clay";
import { EventProps } from "@/utils/types";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock, MapPin, Search, X, Zap } from "lucide-react-native";
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

const CARD_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
  C.Gradients.coral,
];

const DATE_CHIPS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "weekend", label: "Weekend" },
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
    const now = new Date();
    let list = events;

    // Date filter
    if (dateFilter === "upcoming") {
      list = list.filter((e) => !e.end_at || new Date(e.end_at) >= now);
    } else if (dateFilter === "today") {
      list = list.filter((e) => {
        if (!e.startDate) return false;
        const d = new Date(e.startDate);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "week") {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      list = list.filter((e) => {
        if (!e.startDate) return false;
        const d = new Date(e.startDate);
        return d >= now && d <= end;
      });
    } else if (dateFilter === "weekend") {
      list = list.filter((e) => {
        if (!e.startDate) return false;
        const day = new Date(e.startDate).getDay();
        return day === 0 || day === 6;
      });
    }

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.location_text?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [events, dateFilter, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Activities</Text>
              <Text style={styles.sub}>{filtered.length} found</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Search size={16} color={C.textSecondary} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search activities…"
              placeholderTextColor={C.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
            />
          </View>

          {/* Date filter chips */}
          <FlatList
            data={DATE_CHIPS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => {
              const isActive = item.id === dateFilter;
              return (
                <TouchableOpacity
                  onPress={() => setDateFilter(item.id)}
                  style={[styles.chip, isActive && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, isActive && styles.chipTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Event list */}
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Zap size={24} color={C.accent} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle}>No activities found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item, index }) => {
                const grad = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
                return (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      setTimeout(() => onEventPress(item), 350);
                    }}
                    style={styles.card}
                    activeOpacity={0.85}
                  >
                    {/* Gradient thumbnail */}
                    <View style={styles.cardThumb}>
                      {item.cover_image ? (
                        <Image
                          source={{ uri: item.cover_image }}
                          style={styles.cardThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <LinearGradient
                          colors={grad}
                          style={styles.cardThumbImg}
                        >
                          <Text style={styles.cardThumbInitial}>
                            {item.name?.charAt(0)?.toUpperCase() ?? "E"}
                          </Text>
                        </LinearGradient>
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.cardMetaRow}>
                        {item.startDate && (
                          <View style={styles.cardMeta}>
                            <Calendar
                              size={10}
                              color={C.accent}
                              strokeWidth={2.5}
                            />
                            <Text style={styles.cardMetaText}>
                              {fmtDate(item.startDate)}
                            </Text>
                          </View>
                        )}
                        {!item.startAnytime && item.startTime && (
                          <View style={styles.cardMeta}>
                            <Clock
                              size={10}
                              color={C.accent}
                              strokeWidth={2.5}
                            />
                            <Text style={styles.cardMetaText}>
                              {fmtTime(item.startTime)}
                            </Text>
                          </View>
                        )}
                      </View>
                      {item.location_text && (
                        <View style={styles.cardMeta}>
                          <MapPin
                            size={10}
                            color={C.accentPink}
                            strokeWidth={2.5}
                          />
                          <Text
                            style={[styles.cardMetaText, { flex: 1 }]}
                            numberOfLines={1}
                          >
                            {item.location_text}
                          </Text>
                        </View>
                      )}
                    </View>

                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
  },
  sheet: {
    backgroundColor: C.canvas,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    maxHeight: SCREEN_HEIGHT * 0.92,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.85)",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(124,58,237,0.20)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: C.Space.xl,
    paddingVertical: C.Space.lg,
  },
  title: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
  },
  sub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: C.Radii.full,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.sm,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    height: 46,
    marginHorizontal: C.Space.xl,
    marginBottom: C.Space.lg,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  chipsRow: {
    paddingHorizontal: C.Space.xl,
    gap: 8,
    paddingBottom: C.Space.lg,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: C.Radii.full,
    backgroundColor: C.surface,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: C.accent,
    shadowOpacity: 0.22,
  },
  chipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  chipTextActive: { color: "#fff" },
  list: {
    paddingHorizontal: C.Space.xl,
    paddingBottom: 20,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  emptySub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    height: 82,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  cardThumb: {
    width: 82,
  },
  cardThumbImg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cardThumbInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 24,
    color: "rgba(255,255,255,0.8)",
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: C.Space.lg,
    paddingVertical: C.Space.md,
    gap: 3,
    justifyContent: "center",
    overflow: "hidden",
  },
  cardName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardMetaText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  priceBadge: {
    borderRadius: C.Radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: C.Space.lg,
  },
  priceText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
  },
});
