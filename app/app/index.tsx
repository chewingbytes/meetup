/**
 * Home screen — full-screen map with clay chrome.
 *
 * Map stays full-screen underneath everything.
 * All UI elements (top bar, sheet, FAB, nav) float ABOVE the map
 * as clay-styled surfaces with appropriate shadows.
 *
 * Clay event pins: rounded squares that feel like soft clay stickers
 * pressed onto the map surface.
 */

import CreateEventWizard from "@/components/create-event-wizard";
import CreateFavouriteWizard from "@/components/create-favourite-wizard";
import { FavouritePlaceMarker } from "@/components/favourite-place-marker";
import EventsListModal from "@/components/events-list-modal";
import MobileNav from "@/components/mobile-nav";
import { NeoLoader } from "@/components/ui/neo-loader";
import { useEvents } from "@/hooks/useEvents";
import { useEventStore } from "@/lib/stores/eventStore";
import {
  checkEventMembership,
  deleteEvent,
  getEvent,
  joinEvent,
  leaveEvent,
} from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { getAvatarPublicUrl, listFavouriteImages } from "@/lib/supabaseStorage";
import { supabase } from "@/lib/supabase";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { EventProps } from "@/utils/types";
import { getCategoryConfig, CATEGORIES } from "@/utils/categories";
import { useFavouritePlaces } from "@/lib/useFavouritePlaces";
import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Bell,
  Calendar,
  Clock,
  BadgeCheck,
  GraduationCap,
  Layers,
  LocateFixed,
  MapPin,
  Plus,
  SlidersHorizontal,
  Star,
  Trash2,
  Users,
  UserPlus,
  X,
  Zap,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// TEMP(expo-go): real map stubbed so the app runs in Expo Go. Restore before building.
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps"; // PROD
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "@/components/maps-stub"; // DEV (Expo Go)
// import MapView, { Marker, PROVIDER_GOOGLE, Region } from "@/components/maps-stub";
import Supercluster from "supercluster";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_WIDTH = SCREEN_WIDTH * 0.88;
const SHEET_LEFT = SCREEN_WIDTH * 0.06;

// ── Time label helper ──────────────────────────────────────────────────────
// Returns {day, countdown} joined in the UI as "day  ·  countdown" (countdown may be "")
// "No time set" = midnight (00:00) meaning the user only picked a date in the wizard.
function combineEventDateTime(
  startDate?: string,
  startTime?: string,
  startAnytime?: boolean,
): string | undefined {
  if (!startDate) return undefined;
  if (startAnytime || !startTime) return startDate;
  const d = new Date(startDate);
  const t = new Date(startTime);
  d.setHours(t.getHours(), t.getMinutes(), 0, 0);
  return d.toISOString();
}

function getEventTimeLabel(startAt?: string): {
  day: string;
  countdown: string;
} {
  if (!startAt) return { day: "", countdown: "" };

  const now = new Date();
  const start = new Date(startAt);
  const hasTime = start.getHours() !== 0 || start.getMinutes() !== 0;

  const isToday = start.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  const dayName = isToday
    ? "today"
    : isTomorrow
      ? "tomorrow"
      : start.toLocaleDateString("en-SG", { weekday: "long" }).toLowerCase();

  if (!hasTime) {
    // Date only — just say when, no time breakdown
    return { day: isToday ? "today" : `on ${dayName}`, countdown: "" };
  }

  if (isToday) {
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return { day: "now", countdown: "" };
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return { day: "today", countdown: `starts in ${mins}m` };
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return {
      day: "today",
      countdown: `starts in ${hrs}h${remMins > 0 ? ` ${remMins}m` : ""}`,
    };
  }

  // Another day with a specific time set
  const timeStr = start.toLocaleTimeString("en-SG", {
    hour: "numeric",
    minute: "2-digit",
  });
  return { day: `${dayName}`, countdown: `at ${timeStr}` };
}

// ── MBTI helpers ──────────────────────────────────────────────────────────
const MBTI_NAMES: Record<string, string> = {
  INTJ: "The Architect",
  INTP: "The Logician",
  ENTJ: "The Commander",
  ENTP: "The Debater",
  INFJ: "The Advocate",
  INFP: "The Mediator",
  ENFJ: "The Protagonist",
  ENFP: "The Campaigner",
  ISTJ: "The Logistician",
  ISFJ: "The Defender",
  ESTJ: "The Executive",
  ESFJ: "The Consul",
  ISTP: "The Virtuoso",
  ISFP: "The Adventurer",
  ESTP: "The Entrepreneur",
  ESFP: "The Entertainer",
};
const SINGAPORE = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Hard ceiling on how many native markers (clusters + pins) may be on the map at
// once. react-native-maps — especially Apple Maps in Expo Go — crashes/OOMs when
// hundreds of annotations are created in one go (which happens when you zoom out
// and the whole accumulated event set floods into view). We clamp by clustering
// more aggressively until the count is under this number.
// Google Maps custom markers (each pin is a snapshotted native view) are heavier
// to pan than Apple's annotations, so we keep the on-screen count lean. Above
// ~45 image-pins, panning on the Google provider starts to stutter.
const MAX_MARKERS = 30;

// Clay gradient palette for event pins
const PIN_GRADIENTS: Array<readonly [string, string]> = [
  C.Gradients.primary,
  C.Gradients.pink,
  C.Gradients.blue,
  C.Gradients.green,
  C.Gradients.amber,
  C.Gradients.coral,
];

const FILTER_ITEMS: {
  id: string;
  label: string;
  IconComp: React.ComponentType<any>;
  grad: readonly [string, string];
}[] = [
  { id: "all", label: "All", IconComp: Layers, grad: C.Gradients.primary },
  { id: "spots", label: "My Spots", IconComp: Star, grad: C.Gradients.amber },
  {
    id: "students",
    label: "Students",
    IconComp: GraduationCap,
    grad: C.Gradients.blue,
  },
  ...CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    IconComp: c.Icon,
    grad: c.gradient,
  })),
];

function formatEventDate(iso?: string) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-SG", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

function formatEventTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveAvatar(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  try {
    return getAvatarPublicUrl(url);
  } catch {
    return null;
  }
}

// ── People nearby ──
// Real profiles pulled from the `profiles` table. Ranking / true distance /
// premium-tier filtering will be layered on later; for now we render everyone.
type NearbyPerson = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  main_interest: string | null;
  interests: string[];
  verified: string | null;
  occupation: string | null;
  personality_type: string | null;
  location: string | null;
};

// Filter ranges. Distance + age are UI scaffolding for now: profiles have no
// stored coordinates yet, and age (from date_of_birth) isn't wired until sign-in
// providers return it — so neither is applied to the result list. The chips /
// toggles (verified, interests, occupation, personality, country) do filter.
const DIST_MIN = 1;
const DIST_MAX = 50; // top of the range = "Any"
const AGE_MIN = 18;
const AGE_MAX = 60; // top of the range = "60+"

const COUNTRIES = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Australia",
  "United Kingdom",
  "United States",
  "Canada",
];

const toggleInList = (list: string[], item: string) =>
  list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

// Maps a free-text interest to a single emoji so it can be shown as a compact,
// never-overflowing badge over an avatar (full text stays as a caption). Keyword
// match with a friendly ✨ fallback.
// Exact matches first (checked case-insensitively), then keyword fallbacks.
const INTEREST_EMOJI: [string, string][] = [
  // Sports & Fitness
  ["running", "🏃"], ["gym", "🏋️"], ["swimming", "🏊"], ["cycling", "🚴"],
  ["yoga", "🧘"], ["hiking", "🥾"], ["rock climbing", "🧗"], ["martial arts", "🥋"],
  ["tennis", "🎾"], ["basketball", "🏀"], ["football", "⚽"], ["volleyball", "🏐"],
  ["badminton", "🏸"], ["soccer", "⚽"], ["boxing", "🥊"], ["skiing", "⛷️"],
  ["surfing", "🏄"], ["dancing", "💃"],
  // Arts & Creativity
  ["drawing", "✏️"], ["painting", "🖌️"], ["photography", "📸"],
  ["filmmaking", "🎬"], ["writing", "✍️"], ["music production", "🎛️"],
  ["graphic design", "🎨"], ["fashion", "👗"], ["diy & crafts", "🔨"],
  ["sculpting", "🗿"], ["pottery", "🏺"], ["architecture", "🏛️"],
  // Music
  ["live music", "🎶"], ["guitar", "🎸"], ["piano", "🎹"], ["singing", "🎤"],
  ["djing", "🎧"], ["hip-hop", "🎤"], ["electronic", "🎛️"], ["classical", "🎻"],
  ["jazz", "🎷"], ["k-pop", "🌟"], ["indie", "🎵"], ["r&b", "🎵"],
  ["rap", "🎤"], ["pop", "🎵"],
  // Food & Drink
  ["cooking", "🍳"], ["baking", "🧁"], ["coffee", "☕"], ["tea", "🍵"],
  ["street food", "🍜"], ["restaurant hopping", "🍽️"], ["wine", "🍷"],
  ["brunch", "🥞"], ["cocktails", "🍹"], ["vegan food", "🥗"], ["boba", "🧋"],
  // Tech & Gaming
  ["gaming", "🎮"], ["coding", "💻"], ["ai", "🤖"], ["cybersecurity", "🔐"],
  ["mobile apps", "📱"], ["esports", "🏆"], ["board games", "🎲"],
  ["vr/ar", "🥽"], ["robotics", "🤖"], ["3d printing", "🖨️"], ["crypto", "₿"],
  // Outdoors & Travel
  ["camping", "🏕️"], ["backpacking", "🎒"], ["road trips", "🚗"],
  ["beach", "🏖️"], ["nature", "🌿"], ["sightseeing", "🗺️"],
  ["skydiving", "🪂"], ["scuba diving", "🤿"], ["fishing", "🎣"],
  ["bouldering", "🧗"],
  // Culture & Learning
  ["movies", "🍿"], ["anime", "🎌"], ["k-drama", "📺"], ["reading", "📚"],
  ["podcasts", "🎙️"], ["history", "🏛️"], ["philosophy", "🤔"],
  ["psychology", "🧠"], ["languages", "🗣️"], ["science", "🔬"],
  ["astronomy", "🔭"], ["true crime", "🔍"],
  // Lifestyle
  ["meditation", "🧘"], ["journaling", "📓"], ["thrifting", "🛍️"],
  ["astrology", "🔮"], ["pets", "🐾"], ["skincare", "✨"],
  ["interior design", "🛋️"], ["gardening", "🌱"], ["minimalism", "⬜"],
  ["sustainability", "♻️"],
  // Community
  ["volunteering", "🤝"], ["entrepreneurship", "🚀"], ["networking", "🤝"],
  ["social justice", "✊"], ["politics", "🗳️"], ["public speaking", "🎤"],
  ["mentoring", "🌟"],
];
function interestEmoji(interest?: string | null): string {
  if (!interest) return "✨";
  const s = interest.toLowerCase();
  for (const [k, e] of INTEREST_EMOJI) if (s.includes(k)) return e;
  return "✨";
}

// ── Reusable range slider ──
// Pure-JS (PanResponder) so it works in Expo Go with no native dependency.
// Pass one value for a single-thumb slider, two for a min/max range.
const SLIDER_THUMB = 28;
function RangeSlider({
  min,
  max,
  step = 1,
  values,
  onChange,
  format,
}: {
  min: number;
  max: number;
  step?: number;
  values: number[];
  onChange: (v: number[]) => void;
  format?: (v: number) => string;
}) {
  const dual = values.length === 2;
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  trackWRef.current = trackW;
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const startX = useRef([0, 0]);

  const usable = () => Math.max(trackWRef.current - SLIDER_THUMB, 1);
  const valToX = (v: number) => ((v - min) / (max - min)) * usable();
  const xToVal = (x: number) => {
    const r = Math.min(Math.max(x / usable(), 0), 1);
    const raw = min + r * (max - min);
    return Math.min(Math.max(Math.round(raw / step) * step, min), max);
  };

  const responders = useRef(
    [0, 1].map((index) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startX.current[index] = valToX(valuesRef.current[index] ?? min);
        },
        onPanResponderMove: (_e, g) => {
          let nv = xToVal(startX.current[index] + g.dx);
          const cur = [...valuesRef.current];
          if (cur.length === 2) {
            if (index === 0) nv = Math.min(nv, cur[1]);
            else nv = Math.max(nv, cur[0]);
          }
          cur[index] = nv;
          onChangeRef.current(cur);
        },
      }),
    ),
  ).current;

  const lowX = dual ? valToX(values[0]) : 0;
  const highX = valToX(values[dual ? 1 : 0]);

  return (
    <View>
      <View
        style={sliderStyles.track}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
      >
        <View style={sliderStyles.bar} />
        <View
          style={[
            sliderStyles.fill,
            {
              left: dual ? lowX + SLIDER_THUMB / 2 : 0,
              width: dual
                ? Math.max(highX - lowX, 0)
                : highX + SLIDER_THUMB / 2,
            },
          ]}
        />
        {dual && (
          <View
            style={[sliderStyles.thumb, { left: lowX }]}
            {...responders[0].panHandlers}
          />
        )}
        <View
          style={[sliderStyles.thumb, { left: highX }]}
          {...responders[dual ? 1 : 0].panHandlers}
        />
      </View>
      <View style={sliderStyles.labelRow}>
        <Text style={sliderStyles.labelText}>
          {format ? format(values[0]) : values[0]}
        </Text>
        {dual && (
          <Text style={sliderStyles.labelText}>
            {format ? format(values[1]) : values[1]}
          </Text>
        )}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  track: { height: 36, justifyContent: "center" },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E0F0",
  },
  fill: {
    position: "absolute",
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  thumb: {
    position: "absolute",
    top: 4,
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    backgroundColor: "#fff",
    borderWidth: 2.5,
    borderColor: C.accent,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  labelText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },
});

// ── Reusable multi-select chip group (interests / occupation / etc.) ──
function FilterChips({
  options,
  selected,
  onToggle,
  empty,
}: {
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
  empty: string;
}) {
  return (
    <View style={peopleStyles.chipsRow}>
      {options.map((it) => {
        const on = selected.includes(it);
        return (
          <TouchableOpacity
            key={it}
            activeOpacity={0.8}
            onPress={() => onToggle(it)}
            style={[peopleStyles.filterChip, on && peopleStyles.filterChipActive]}
          >
            <Text
              style={[
                peopleStyles.filterChipText,
                on && peopleStyles.filterChipTextActive,
              ]}
            >
              {it}
            </Text>
          </TouchableOpacity>
        );
      })}
      {options.length === 0 && (
        <Text style={peopleStyles.emptyText}>{empty}</Text>
      )}
    </View>
  );
}

const STRIP_W = 64;
const STRIP_W_EXPANDED = 170; // fallback expanded width until labels are measured
const STRIP_RIGHT = 10;
const ADD_BTN_H = 44;
const POPUP_W = 128;
const POPUP_OPT_H = 46;

// Expanded-strip sizing. Rather than a fixed width (which truncates long labels
// on some devices / font scales), the strip measures the widest label at runtime
// and sizes itself to fit it plus a gap — see FilterStrip's measurer.
const LABEL_GAP = 20; // breathing room to the left of the longest label
const MIN_EXPANDED = 150; // never look cramped, even with short labels
const MEASURE_LABELS = Array.from(
  new Set([...FILTER_ITEMS.map((i) => i.label), "New"]),
);

// Scroll-wheel filter constants
const SLOT_H = 40;
const VISIBLE_COUNT = 5;
const FILTER_H = SLOT_H * VISIBLE_COUNT; // 200
const STRIP_H = ADD_BTN_H + 1 + FILTER_H; // 245
const MAX_SCROLL_PX = Math.max(0, (FILTER_ITEMS.length - 1) * SLOT_H);

// Padded items: trailing nulls only so the last items can reach the top slot
const PADDED_ITEMS: ((typeof FILTER_ITEMS)[0] | null)[] = [
  ...FILTER_ITEMS,
  ...Array(VISIBLE_COUNT - 1).fill(null),
];

const FilterStrip = React.memo(function FilterStrip({
  activeFilter,
  onFilterChange,
  stripTop,
  stripBottom: _stripBottom,
  onCreateActivity,
  onCreateFavourite,
}: {
  activeFilter: string;
  onFilterChange: (id: string) => void;
  stripTop: number;
  stripBottom: number;
  onCreateActivity: () => void;
  onCreateFavourite: () => void;
}) {
  const initIdx = Math.max(
    0,
    Math.min(
      FILTER_ITEMS.findIndex((f) => f.id === activeFilter),
      FILTER_ITEMS.length - 1,
    ),
  );

  const [centeredIdx, setCenteredIdx] = useState(initIdx < 0 ? 0 : initIdx);
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHover, setMenuHover] = useState(-1);

  const scrollAnim = useRef(
    new Animated.Value(-(initIdx < 0 ? 0 : initIdx) * SLOT_H),
  ).current;
  const menuScale = useRef(new Animated.Value(0.85)).current;
  const menuOpacity = useRef(new Animated.Value(0)).current;
  // 0 = collapsed (icons only), 1 = expanded (labels revealed while dragging)
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Expanded width is measured, not fixed: find the widest label (measured in the
  // bold/centered font — the widest case) and size the strip to fit it + a gap,
  // clamped so it can't run off-screen. Adapts to any device width and font scale.
  const [expandedW, setExpandedW] = useState(STRIP_W_EXPANDED);
  const maxLabelWRef = useRef(0);
  const handleLabelMeasure = useCallback((w: number) => {
    if (w <= maxLabelWRef.current) return;
    maxLabelWRef.current = w;
    setExpandedW(
      Math.min(
        Math.max(STRIP_W + Math.ceil(w) + LABEL_GAP, MIN_EXPANDED),
        SCREEN_WIDTH - 40,
      ),
    );
  }, []);

  const expand = useCallback(
    (open: boolean) => {
      Animated.spring(expandAnim, {
        toValue: open ? 1 : 0,
        useNativeDriver: false,
        damping: open ? 14 : 20,
        stiffness: open ? 200 : 300,
        mass: 0.7,
      }).start();
    },
    [expandAnim],
  );

  const stripTopRef = useRef(stripTop);
  const touchStartYRef = useRef(0);
  const startScrollPxRef = useRef((initIdx < 0 ? 0 : initIdx) * SLOT_H);
  const currentScrollPxRef = useRef((initIdx < 0 ? 0 : initIdx) * SLOT_H);
  const lastCenteredRef = useRef(initIdx < 0 ? 0 : initIdx);
  const menuModeRef = useRef(false);
  const menuHoverRef = useRef(-1);
  const menuOpenRef = useRef(false);

  useEffect(() => {
    stripTopRef.current = stripTop;
  }, [stripTop]);

  // Sync to activeFilter when not dragging
  useEffect(() => {
    if (isDragging) return;
    const i = FILTER_ITEMS.findIndex((f) => f.id === activeFilter);
    if (i < 0) return;
    const px = Math.max(0, Math.min(i * SLOT_H, MAX_SCROLL_PX));
    currentScrollPxRef.current = px;
    startScrollPxRef.current = px;
    setCenteredIdx(i);
    lastCenteredRef.current = i;
    Animated.spring(scrollAnim, {
      toValue: -px,
      useNativeDriver: true,
      damping: 20,
      stiffness: 280,
      mass: 0.5,
    }).start();
  }, [activeFilter, isDragging, scrollAnim]);

  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);

  // Menu animation
  useEffect(() => {
    Animated.parallel([
      Animated.spring(menuScale, {
        toValue: menuOpen ? 1 : 0.85,
        useNativeDriver: true,
        damping: 18,
        stiffness: 300,
      }),
      Animated.timing(menuOpacity, {
        toValue: menuOpen ? 1 : 0,
        duration: menuOpen ? 150 : 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [menuOpen, menuScale, menuOpacity]);

  function clampScroll(px: number) {
    return Math.max(0, Math.min(px, MAX_SCROLL_PX));
  }
  function calcCentered(px: number) {
    return Math.max(
      0,
      Math.min(Math.round(px / SLOT_H), FILTER_ITEMS.length - 1),
    );
  }

  return (
    <>
      {menuOpen && (
        <View
          style={fStyles.menuBackdrop}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => {
            setMenuOpen(false);
            setMenuHover(-1);
            menuHoverRef.current = -1;
          }}
        />
      )}

      {/* Popup menu */}
      <Animated.View
        style={[
          fStyles.menu,
          {
            top: stripTop + STRIP_H - 2 * POPUP_OPT_H,
            right: STRIP_W + STRIP_RIGHT + 8,
            opacity: menuOpacity,
            transform: [
              { scale: menuScale },
              {
                translateX: menuScale.interpolate({
                  inputRange: [0.85, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={menuOpen ? "box-none" : "none"}
      >
        {(
          [
            {
              label: "Create Activity",
              IconComp: Plus,
              grad: C.Gradients.primary,
              onPress: onCreateActivity,
            },
            {
              label: "Favourite Spot",
              IconComp: Star,
              grad: C.Gradients.amber,
              onPress: onCreateFavourite,
            },
          ] as const
        ).map((opt, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setMenuOpen(false);
              setMenuHover(-1);
              menuHoverRef.current = -1;
              opt.onPress();
            }}
          >
            <LinearGradient
              colors={
                menuHover === i ? opt.grad : (["#F8F5FF", "#EDE9FE"] as any)
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[fStyles.menuOpt, i === 0 && fStyles.menuOptTop]}
            >
              <opt.IconComp
                size={13}
                color={menuHover === i ? "#fff" : C.textSecondary}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  fStyles.menuOptText,
                  { color: menuHover === i ? "#fff" : C.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </Animated.View>

      {/* Invisible measurer: sizes the expanded strip to the widest label so it
          fits with a gap on any device / font scale (no fixed width truncation). */}
      <View style={fStyles.measure} pointerEvents="none">
        {MEASURE_LABELS.map((lbl) => (
          <Text
            key={lbl}
            style={fStyles.measureText}
            onLayout={(e) => handleLabelMeasure(e.nativeEvent.layout.width)}
          >
            {lbl}
          </Text>
        ))}
      </View>

      {/* Strip */}
      <Animated.View
        style={[
          fStyles.strip,
          {
            top: stripTop,
            width: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [STRIP_W, expandedW],
            }),
          },
        ]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => {
          // + button is at the BOTTOM: pageY > wheel area
          const inMenu =
            e.nativeEvent.pageY > stripTopRef.current + FILTER_H + 1;
          menuModeRef.current = inMenu;
          if (inMenu) {
            // tap toggles; slide-from-+ will keep it open
            setMenuOpen(!menuOpenRef.current);
            setMenuHover(-1);
            menuHoverRef.current = -1;
          } else {
            setMenuOpen(false);
            touchStartYRef.current = e.nativeEvent.pageY;
            startScrollPxRef.current = currentScrollPxRef.current;
            setIsDragging(true);
            expand(true); // bounce the strip open to reveal labels
          }
        }}
        onResponderMove={(e) => {
          if (menuModeRef.current) return;
          const dy = e.nativeEvent.pageY - touchStartYRef.current;
          const px = clampScroll(startScrollPxRef.current - dy);
          currentScrollPxRef.current = px;
          scrollAnim.setValue(-px);
          const ci = calcCentered(px);
          if (ci !== lastCenteredRef.current) {
            lastCenteredRef.current = ci;
            setCenteredIdx(ci);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
          }
        }}
        onResponderRelease={() => {
          if (menuModeRef.current) {
            menuModeRef.current = false;
            return; // menu stays open; options are tapped separately
          }
          setIsDragging(false);
          const snapped = clampScroll(
            Math.round(currentScrollPxRef.current / SLOT_H) * SLOT_H,
          );
          currentScrollPxRef.current = snapped;
          Animated.spring(scrollAnim, {
            toValue: -snapped,
            useNativeDriver: true,
            damping: 22,
            stiffness: 380,
            mass: 0.35,
          }).start();
          const fi = calcCentered(snapped);
          setCenteredIdx(fi);
          lastCenteredRef.current = fi;
          onFilterChange(FILTER_ITEMS[fi].id);
          expand(false); // collapse back to icons-only
        }}
        onResponderTerminate={() => {
          setMenuOpen(false);
          setMenuHover(-1);
          menuHoverRef.current = -1;
          setIsDragging(false);
          menuModeRef.current = false;
          expand(false);
        }}
      >
        {/* Scroll-wheel clip area */}
        <View style={fStyles.wheelClip}>
          {/* Gradient highlight for the centre slot */}
          <LinearGradient
            colors={FILTER_ITEMS[centeredIdx]?.grad ?? C.Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={fStyles.centerPill}
          />

          {/* Fade overlays — top & bottom */}
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(255,255,255,0)"]}
            style={fStyles.fadeTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.92)"]}
            style={fStyles.fadeBottom}
            pointerEvents="none"
          />

          {/* Scrolling list */}
          <Animated.View
            style={[
              fStyles.itemList,
              { transform: [{ translateY: scrollAnim }] },
            ]}
          >
            {PADDED_ITEMS.map((item, i) => {
              const isCenter =
                item !== null && item.id === FILTER_ITEMS[centeredIdx]?.id;
              const tint = isCenter
                ? "#fff"
                : isDragging
                  ? C.textTertiary
                  : C.textSecondary;
              return (
                <View key={item?.id ?? `pad_${i}`} style={fStyles.wheelItem}>
                  <Animated.Text
                    numberOfLines={1}
                    style={[
                      fStyles.wheelLabel,
                      {
                        color: tint,
                        fontFamily: isCenter
                          ? C.Fonts.bodyBold
                          : C.Fonts.bodyMedium,
                        opacity: expandAnim,
                      },
                    ]}
                  >
                    {item?.label ?? ""}
                  </Animated.Text>
                  <View style={fStyles.wheelIconBox}>
                    {item && (
                      <item.IconComp
                        size={18}
                        color={tint}
                        strokeWidth={isCenter ? 2.5 : 2}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        </View>

        <View style={fStyles.divider} />

        {/* "+" button */}
        <LinearGradient
          colors={menuOpen ? C.Gradients.primaryDeep : C.Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={fStyles.addSection}
        >
          <Animated.Text
            numberOfLines={1}
            style={[fStyles.addLabel, { opacity: expandAnim }]}
          >
            New
          </Animated.Text>
          <View style={fStyles.wheelIconBox}>
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
});

const fStyles = StyleSheet.create({
  strip: {
    position: "absolute",
    right: STRIP_RIGHT,
    width: STRIP_W,
    height: STRIP_H,
    zIndex: 21,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: C.Radii.lg,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 5,
  },
  addSection: {
    width: "100%",
    height: ADD_BTN_H,
    flexDirection: "row",
    alignItems: "center",
  },
  addLabel: {
    flex: 1,
    textAlign: "right",
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  divider: {
    width: "70%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  wheelClip: {
    width: "100%",
    height: FILTER_H,
    overflow: "hidden",
  },
  centerPill: {
    position: "absolute",
    top: 4,
    left: 5,
    right: 5,
    height: SLOT_H - 8,
    borderRadius: C.Radii.lg,
    zIndex: 0,
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SLOT_H / 4,
    zIndex: 2,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SLOT_H * 2,
    zIndex: 2,
  },
  itemList: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  wheelItem: {
    height: SLOT_H,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  wheelIconBox: {
    width: STRIP_W,
    height: SLOT_H,
    flexShrink: 0,
    flexGrow: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  wheelLabel: {
    flex: 1,
    textAlign: "right",
    fontSize: C.FontSizes.sm,
  },
  // Off-screen label measurer (opacity 0, absolute so it never affects layout).
  // Uses the bold font + sm size — the widest the labels ever render.
  measure: { position: "absolute", left: 0, top: 0, opacity: 0 },
  measureText: {
    position: "absolute",
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
  },
  tooltip: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 22,
  },
  tooltipGrad: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: C.Radii.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 12,
    color: "#fff",
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  menu: {
    position: "absolute",
    width: POPUP_W,
    zIndex: 22,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  menuBackdrop: {
    ...(StyleSheet.absoluteFillObject as any),
    zIndex: 20,
  },
  menuOpt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: POPUP_OPT_H,
  },
  menuOptTop: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.1)",
  },
  menuOptText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 12,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ActivityTicker — autoscrolling "FOMO" marquee anchored to the bottom.
// Each chip reads "{user} and {N} others want to {activity} · {time}" and taps
// through to the same event popup you'd get from tapping the map pin.
// ─────────────────────────────────────────────────────────────────────────────
const ActivityTicker = React.memo(function ActivityTicker({
  events,
  topInset,
  onSelect,
  paused,
}: {
  events: EventProps[];
  topInset: number;
  onSelect: (e: EventProps) => void;
  paused: boolean;
}) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [trackW, setTrackW] = useState(0);

  const items = useMemo(
    () =>
      events
        .filter((e) => e.location_lat != null && e.location_lng != null)
        .slice(0, 14)
        .map((e) => {
          const { day, countdown } = getEventTimeLabel(
            combineEventDateTime(
              e.startDate ?? undefined,
              e.startTime ?? undefined,
              e.startAnytime,
            ),
          );
          const digits = (e.id || "0").replace(/\D/g, "").slice(-2) || "0";
          const others = (parseInt(digits, 10) % 7) + 2;
          return {
            event: e,
            user: ((e as any).organizer_username as string) || "Someone",
            photo: ((e as any).organizer_photo_url as string | null) ?? null,
            others,
            name: e.name,
            time: countdown || day || "soon",
            cat: getCategoryConfig((e as any).category),
          };
        }),
    [events],
  );

  const loopItems = items.length ? [...items, ...items] : [];

  // Gentle pulse for the "LIVE" dot. Paused when the screen is backgrounded so
  // it doesn't keep the GPU busy (and the phone warm) while you're elsewhere.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, paused]);

  useEffect(() => {
    if (paused || !trackW) return;
    const half = trackW / 2;
    scrollX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -half,
        duration: Math.max(9000, half * 22),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [trackW, scrollX, paused]);

  if (!items.length) return null;

  return (
    <View style={[tickerStyles.wrap, { top: topInset }]}>
      <View style={tickerStyles.viewport}>
        <Animated.View
          style={[tickerStyles.track, { transform: [{ translateX: scrollX }] }]}
          onLayout={(ev) => setTrackW(ev.nativeEvent.layout.width)}
        >
          {loopItems.map((it, i) => {
            const CatIcon = it.cat.Icon;
            const catColor = it.cat.gradient[1];
            return (
              <TouchableOpacity
                key={`${it.event.id}-${i}`}
                activeOpacity={0.7}
                onPress={() => onSelect(it.event)}
                style={[
                  tickerStyles.chip,
                  {
                    backgroundColor: `${catColor}14`,
                    borderColor: `${catColor}33`,
                  },
                ]}
              >
                {it.photo ? (
                  <Image source={{ uri: it.photo }} style={tickerStyles.avatar} />
                ) : (
                  <LinearGradient
                    colors={it.cat.gradient as readonly [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tickerStyles.avatar}
                  >
                    <CatIcon size={13} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                )}
                <Text
                  style={tickerStyles.text}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  <Text style={tickerStyles.bold}>{it.user}</Text>
                  {it.others > 0 ? (
                    <Text style={tickerStyles.muted}>{` +${it.others}`}</Text>
                  ) : null}
                  <Text style={tickerStyles.muted}>{" want to "}</Text>
                  <Text style={[tickerStyles.bold, { color: catColor }]}>
                    {it.name}
                  </Text>
                </Text>
                <View
                  style={[
                    tickerStyles.timePill,
                    { backgroundColor: `${catColor}1A` },
                  ]}
                >
                  <Clock size={10} color={catColor} strokeWidth={2.5} />
                  <Text style={[tickerStyles.timeText, { color: catColor }]}>
                    {it.time}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      {/* Fade so chips dissolve under the LIVE badge / right edge */}
      <LinearGradient
        colors={["rgba(255,255,255,1)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tickerStyles.fadeLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tickerStyles.fadeRight}
        pointerEvents="none"
      />

      {/* Pinned LIVE badge */}
      <View style={tickerStyles.liveBadge}>
        <Animated.View
          style={[
            tickerStyles.liveDot,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.3],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={tickerStyles.liveText}>LIVE</Text>
      </View>
    </View>
  );
});

const tickerStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 52,
    zIndex: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.97)",
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
  viewport: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    paddingLeft: 72,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    maxWidth: 500,
    gap: 7,
    borderRadius: C.Radii.full,
    paddingLeft: 5,
    paddingRight: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd",
    flexShrink: 0,
  },
  text: {
    flexShrink: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  bold: {
    fontFamily: C.Fonts.bodyBold,
    color: C.textPrimary,
  },
  muted: {
    fontFamily: C.Fonts.body,
    color: C.textSecondary,
  },
  timePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  timeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    zIndex: 2,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 2,
  },
  liveBadge: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    zIndex: 3,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  liveText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: "#EF4444",
    letterSpacing: 1,
  },
});

// People-nearby pin + popup styles (used inline by HomeScreen)
const peopleStyles = StyleSheet.create({
  pin: {
    position: "absolute",
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: C.Radii.full,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    zIndex: 18,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  pinAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },
  pinTextWrap: {
    alignItems: "flex-start",
  },
  pinCount: {
    paddingTop: 1,
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: C.textPrimary,
    lineHeight: C.FontSizes.md,
  },
  pinLabel: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: 10,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  backdrop: {
    ...(StyleSheet.absoluteFillObject as any),
    backgroundColor: "rgba(20,10,40,0.52)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 100,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    paddingTop: C.Space.xl,
    paddingHorizontal: C.Space.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.accentGreen,
  },
  liveText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    color: C.accentGreen,
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: C.Space.lg,
  },
  cardTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  cardSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginTop: 2,
  },
  cardClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: C.Radii.lg,
    marginBottom: 8,
  },
  rowAvatarWrap: { width: 48, height: 48 },
  rowAvatarRing: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#ddd",
    borderWidth: 2,
    borderColor: C.surface,
  },
  rowName: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  rowLoves: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginTop: 1,
  },
  rowInterest: { fontFamily: C.Fonts.bodyBold, fontSize: C.FontSizes.sm },
  interestBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
  },
  interestBadgeText: { fontSize: 11 },
  rowRole: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    marginTop: 1,
  },
  rowPip: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.accentGreen,
  },
  // ── Avatar fallbacks (no photo) ──
  pinAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accentLight,
  },
  pinAvatarInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 12,
    color: "#fff",
  },
  rowAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.accentLight,
  },
  rowAvatarInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 18,
    color: "#fff",
  },
  emptyText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    paddingVertical: 18,
    textAlign: "center",
  },
  // ── Popup header actions ──
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  filterBadgeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 9,
    color: "#fff",
  },
  // ── Filter drawer ──
  drawerRoot: { ...(StyleSheet.absoluteFillObject as any), zIndex: 200 },
  drawerBackdrop: {
    ...(StyleSheet.absoluteFillObject as any),
    backgroundColor: "rgba(20,10,40,0.45)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: Math.min(330, SCREEN_WIDTH * 0.84),
    backgroundColor: C.surface,
    paddingHorizontal: C.Space.xl,
    shadowColor: "#000",
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: C.Space.lg,
  },
  drawerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  drawerSectionLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    marginTop: C.Space.lg,
    marginBottom: C.Space.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.canvas,
    borderRadius: C.Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleRowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleRowText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#D8D2E4",
    padding: 3,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: C.accent },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  knobOn: { alignSelf: "flex-end" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    backgroundColor: C.canvas,
    borderRadius: C.Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  filterChipText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  filterChipTextActive: { color: "#fff", fontFamily: C.Fonts.bodyBold },
  drawerFooter: {
    flexDirection: "row",
    gap: 10,
    paddingTop: C.Space.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.08)",
  },
  clearBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: C.Radii.lg,
    backgroundColor: C.accentMuted,
  },
  clearBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },
  applyBtn: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: C.Radii.lg,
    backgroundColor: C.accent,
  },
  applyBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
});

// Extracted so React.memo prevents re-renders when home screen state changes
// (isBoundsFetching, sheetLoading, etc). With stable event references (ID merge
// in the store) and a stable openSheet callback, this component never re-renders
// unless the event data itself changes — zero SVG/native-view diffing overhead.
const pinStyles = StyleSheet.create({
  pinWrap: { alignItems: "center" },
  pinBubbleWrap: { position: "relative", width: 55, height: 55 },
  pinBubble: {
    width: 55,
    height: 55,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  pinOrgAvatar: {
    position: "absolute",
    bottom: -6,
    right: -3,
    width: 28,
    height: 28,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pinOrgAvatarImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  pinOrgInitial: { fontFamily: C.Fonts.bodyBold, fontSize: 8, color: "#fff" },
  pinTail: { width: 4, height: 8, borderRadius: 2, marginTop: 1, opacity: 0.7 },
});

// ── Cluster marker ──
// A cheap count bubble (no SVG, no image) shown when several events overlap at
// the current zoom. tracksViewChanges only briefly (until the static content
// snapshots once) so it never re-renders during panning.
const ClusterMarker = React.memo(
  ({
    count,
    clusterId,
    latitude,
    longitude,
    onPress,
  }: {
    count: number;
    clusterId: number;
    latitude: number;
    longitude: number;
    onPress: (clusterId: number, latitude: number, longitude: number) => void;
  }) => {
    const [track, setTrack] = React.useState(true);
    React.useEffect(() => {
      const t = setTimeout(() => setTrack(false), 180);
      return () => clearTimeout(t);
    }, []);
    const size = count < 10 ? 44 : count < 30 ? 54 : count < 60 ? 64 : 74;
    const inner = size - 6; // 3px white ring all around
    const fontSize = size <= 44 ? 15 : size <= 54 ? 17 : 20;
    return (
      <Marker
        coordinate={{ latitude, longitude }}
        onPress={() => onPress(clusterId, latitude, longitude)}
        tracksViewChanges={track}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={clusterStyles.wrap} collapsable={false}>
          {/* soft violet glow */}
          <View
            style={[
              clusterStyles.halo,
              { width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 },
            ]}
          />
          {/* white ring + drop shadow */}
          <View
            style={[
              clusterStyles.ring,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            {/* gradient face */}
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                clusterStyles.bubble,
                { width: inner, height: inner, borderRadius: inner / 2 },
              ]}
            >
              <Text style={[clusterStyles.count, { fontSize }]}>{count}</Text>
            </LinearGradient>
          </View>
        </View>
      </Marker>
    );
  },
);

const clusterStyles = StyleSheet.create({
  // Padding gives the rasterized marker enough canvas to include the shadow +
  // halo spread; without it they get clipped to the square snapshot bounds and
  // the round shadow looks squared off.
  wrap: { alignItems: "center", justifyContent: "center", padding: 16 },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(124,58,237,0.16)",
  },
  ring: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  bubble: {
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontFamily: C.Fonts.heading,
    color: "#FFFFFF",
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

const EventMarker = React.memo(
  ({
    event,
    onPress,
  }: {
    event: EventProps;
    onPress: (e: EventProps) => void;
  }) => {
    const cat = getCategoryConfig((event as any).category);
    const { gradient: grad, Icon: CatIcon } = cat;
    const orgInitial =
      ((event as any).organizer_username as string | null)
        ?.charAt(0)
        ?.toUpperCase() ?? "?";
    const photoUrl =
      ((event as any).organizer_photo_url as string | null) ??
      ((event as any).organizer_avatar_url as string | null) ??
      null;

    // The pin shows the organizer's photo. A remote <Image> isn't painted on the
    // first frame, so the marker has to keep "tracking" (re-snapshotting) until
    // the photo loads — but ONLY until then. We flip tracking off the instant the
    // image settles (onLoadEnd fires on success OR failure), with a hard fallback
    // timer so a stalled download can never leave the marker tracking forever —
    // that's what made the map lag and the phone heat up. The colored initial
    // sits behind the photo as a placeholder / fallback. (The old Apple-Maps
    // teardown crash doesn't apply on the Google provider.)
    const [track, setTrack] = React.useState(true);
    const stopTracking = React.useCallback(() => setTrack(false), []);
    React.useEffect(() => {
      const t = setTimeout(stopTracking, photoUrl ? 1200 : 200);
      return () => clearTimeout(t);
    }, [photoUrl, stopTracking]);
    return (
      <Marker
        coordinate={{
          latitude: event.location_lat!,
          longitude: event.location_lng!,
        }}
        onPress={() => onPress(event)}
        tracksViewChanges={track}
      >
        <View style={pinStyles.pinWrap} collapsable={false}>
          <View style={pinStyles.pinBubbleWrap}>
            <View style={[pinStyles.pinBubble, { backgroundColor: grad[0] }]}>
              <CatIcon size={26} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={[pinStyles.pinOrgAvatar, { backgroundColor: C.accent }]}>
              <Text style={pinStyles.pinOrgInitial}>{orgInitial}</Text>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={pinStyles.pinOrgAvatarImg}
                  onLoadEnd={stopTracking}
                />
              ) : null}
            </View>
          </View>
          <View style={[pinStyles.pinTail, { backgroundColor: grad[1] }]} />
        </View>
      </Marker>
    );
  },
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isCheckingAuth } = useAuthRedirect("/main");
  const { user, userProfile } = useAuth();
  const { events, isLoading } = useEvents(false);
  const {
    places: favouritePlaces,
    deletePlace,
    reload: reloadFavourites,
  } = useFavouritePlaces();

  const [isBoundsFetching, setIsBoundsFetching] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last region we actually fetched for — used to skip redundant fetches on
  // micro-pans (each fetch appends events → rebuilds the cluster index →
  // remounts every marker, which is what was crashing the native map).
  const lastFetchedRef = useRef<{
    lat: number;
    lng: number;
    latDelta: number;
  } | null>(null);
  // Settled map region — recomputed on gesture end, used to cluster + cull markers.
  const [mapRegion, setMapRegion] = useState<Region>(SINGAPORE);

  // Expand bounds by `pad` fraction before sending to server so events near edges pre-load
  const getBounds = useCallback((region: Region, pad = 0.3) => ({
    minLat: region.latitude - region.latitudeDelta * (0.5 + pad),
    maxLat: region.latitude + region.latitudeDelta * (0.5 + pad),
    minLng: region.longitude - region.longitudeDelta * (0.5 + pad),
    maxLng: region.longitude + region.longitudeDelta * (0.5 + pad),
  }), []);

  // Counts how many times HomeScreen itself has re-rendered (for debugging)
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (__DEV__) {
    console.log(`[MAP] HomeScreen render #${renderCountRef.current} | events=${events.length}`);
  }

  // Initial viewport fetch on mount + timer cleanup on unmount
  useEffect(() => {
    console.log("[MAP] Mount fetch — initial Singapore bounds");
    useEventStore.getState().fetchEventsByBounds(getBounds(SINGAPORE));
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [getBounds]);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    // Drive clustering off the settled region (fires on gesture end, not per
    // frame) so clusters recompute only when the user stops moving.
    setMapRegion(region);

    // Throttle network fetches: only refetch when the viewport actually moved or
    // zoomed by a meaningful amount. Fetching on every micro-pan kept appending
    // a handful of events, and every append rebuilt the cluster index and
    // remounted every marker — a snapshot storm that crashed the native map.
    const last = lastFetchedRef.current;
    const movedEnough =
      !last ||
      Math.abs(region.latitude - last.lat) > region.latitudeDelta * 0.35 ||
      Math.abs(region.longitude - last.lng) > region.longitudeDelta * 0.35 ||
      Math.abs(region.latitudeDelta - last.latDelta) / last.latDelta > 0.4;

    console.log(
      `[MAP] regionChange | center=(${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}) delta=(${region.latitudeDelta.toFixed(4)}, ${region.longitudeDelta.toFixed(4)}) | refetch=${movedEnough}`,
    );

    if (!movedEnough) return;
    lastFetchedRef.current = {
      lat: region.latitude,
      lng: region.longitude,
      latDelta: region.latitudeDelta,
    };

    const bounds = getBounds(region);
    setIsBoundsFetching(true);
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(async () => {
      console.log(`[MAP] debounce fired → fetching bounds lat=[${bounds.minLat.toFixed(4)}, ${bounds.maxLat.toFixed(4)}] lng=[${bounds.minLng.toFixed(4)}, ${bounds.maxLng.toFixed(4)}]`);
      try {
        await useEventStore.getState().fetchEventsByBounds(bounds);
      } finally {
        setIsBoundsFetching(false);
      }
    }, 600);
  }, [getBounds]);

  const [activeFilter, setActiveFilter] = useState<string>("all");
  const mapRef = useRef<MapView>(null);
  const [peopleVisible, setPeopleVisible] = useState(false);

  // ── User location ──
  // The blue dot is drawn by showsUserLocation on the MapView. This centers the
  // camera on the user; animateToRegion fires onRegionChangeComplete, which then
  // fetches the events around the new center — so we don't fetch here. If the
  // permission is denied we just stay on the default region (no error shown).
  const [locating, setLocating] = useState(false);
  const centerOnUser = useCallback(async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        700,
      );
    } catch (e) {
      console.log("[MAP] centerOnUser failed", e);
    } finally {
      setLocating(false);
    }
  }, []);

  // Jump to the user's location once when the map first opens.
  useEffect(() => {
    centerOnUser();
  }, [centerOnUser]);

  // Track screen focus so we can pause the always-running ticker animations
  // while the user is on another tab (the map screen stays mounted underneath).
  const [screenFocused, setScreenFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => setScreenFocused(false);
    }, []),
  );
  // Incremented on every filter change so FavouritePlaceMarker keys change,
  // forcing iOS to allocate fresh annotation views. Without this, the mass
  // unmount of event markers floods the annotation view recycle pool and iOS
  // takes back the fav marker views — leaving the React component "mounted"
  // but with no native view behind it (permanently invisible).
  const [favMarkerEpoch, setFavMarkerEpoch] = useState(0);
  const [selectedFavId, setSelectedFavId] = useState<string | null>(null);
  const [favImages, setFavImages] = useState<string[]>([]);
  const [favImagesLoading, setFavImagesLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [favWizardVisible, setFavWizardVisible] = useState(false);
  const favWizardScale = useRef(new Animated.Value(0.88)).current;
  const favWizardOpacity = useRef(new Animated.Value(0)).current;

  const [selectedEvent, setSelectedEvent] = useState<EventProps | null>(null);
  const [eventChannelId, setEventChannelId] = useState<string | null>(null);
  const [sheetParticipants, setSheetParticipants] = useState<any[]>([]);
  const [sheetJoined, setSheetJoined] = useState(false);
  const [sheetIsOrganizer, setSheetIsOrganizer] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [eventsModalVisible, setEventsModalVisible] = useState(false);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [sheetOrganizerName, setSheetOrganizerName] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [newParticipantId, setNewParticipantId] = useState<string | null>(null);
  const newParticipantAnim = useRef(new Animated.Value(0)).current;

  const SHEET_OFF = SCREEN_HEIGHT * 0.7;
  const sheetAnim = useRef(new Animated.Value(SHEET_OFF)).current;
  const favSheetAnim = useRef(new Animated.Value(SHEET_OFF)).current;
  const wizardScale = useRef(new Animated.Value(0.88)).current;
  const wizardOpacity = useRef(new Animated.Value(0)).current;

  const openWizard = useCallback(() => {
    wizardScale.setValue(0.88);
    wizardOpacity.setValue(0);
    setWizardVisible(true);
    Animated.parallel([
      Animated.spring(wizardScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(wizardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [wizardScale, wizardOpacity]);

  const closeWizard = useCallback(() => {
    Animated.parallel([
      Animated.spring(wizardScale, {
        toValue: 0.88,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(wizardOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setWizardVisible(false));
  }, [wizardScale, wizardOpacity]);

  // People-nearby popup — same bouncy spring as the create-event wizard.
  const peopleScale = useRef(new Animated.Value(0.88)).current;
  const peopleOpacity = useRef(new Animated.Value(0)).current;

  const openPeople = useCallback(() => {
    peopleScale.setValue(0.88);
    peopleOpacity.setValue(0);
    setPeopleVisible(true);
    Animated.parallel([
      Animated.spring(peopleScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(peopleOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [peopleScale, peopleOpacity]);

  const closePeople = useCallback(() => {
    Animated.parallel([
      Animated.spring(peopleScale, {
        toValue: 0.88,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(peopleOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setPeopleVisible(false));
  }, [peopleScale, peopleOpacity]);

  // ── People nearby: real profiles + filtering ──
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>([]);
  const [filterInterests, setFilterInterests] = useState<string[]>([]);
  const [filterOccupations, setFilterOccupations] = useState<string[]>([]);
  const [filterPersonalities, setFilterPersonalities] = useState<string[]>([]);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterDistance, setFilterDistance] = useState(DIST_MAX); // DIST_MAX = Any
  const [ageRange, setAgeRange] = useState<number[]>([AGE_MIN, AGE_MAX]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const drawerX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const drawerOpacity = useRef(new Animated.Value(0)).current;

  // Pull profiles from the `profiles` table. (Ranking + real distance + premium
  // filtering will be layered on later; for now we just render everyone else.)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let q = supabase
          .from("profiles")
          .select(
            "id, full_name, username, avatar_url, main_interest, interests, verified, occupation, personality_type, location",
          )
          .limit(60);
        if (user?.id) q = q.neq("id", user.id);
        const { data, error } = await q;
        if (error || cancelled || !data) return;
        setNearbyPeople(
          data.map((p: any) => ({
            id: p.id,
            full_name: p.full_name ?? null,
            username: p.username ?? null,
            avatar_url: p.avatar_url ?? null,
            main_interest: p.main_interest ?? null,
            interests: Array.isArray(p.interests) ? p.interests.filter(Boolean) : [],
            verified: p.verified ?? null,
            occupation: p.occupation ?? null,
            personality_type: p.personality_type ?? null,
            location: p.location ?? null,
          })),
        );
      } catch {
        /* ignore — keep empty list */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Filter options derived from the loaded profiles (so chips reflect real data).
  const availableInterests = useMemo(() => {
    const set = new Set<string>();
    for (const p of nearbyPeople) {
      if (p.main_interest) set.add(p.main_interest);
      for (const i of p.interests) set.add(i);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nearbyPeople]);

  const availableOccupations = useMemo(() => {
    const set = new Set<string>();
    for (const p of nearbyPeople) if (p.occupation) set.add(p.occupation);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nearbyPeople]);

  const availablePersonalities = useMemo(() => {
    const set = new Set<string>();
    for (const p of nearbyPeople)
      if (p.personality_type) set.add(p.personality_type.toUpperCase());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nearbyPeople]);

  const filteredPeople = useMemo(() => {
    return nearbyPeople.filter((p) => {
      if (filterVerified && p.verified !== "true") return false;
      if (
        filterInterests.length > 0 &&
        !filterInterests.some(
          (f) => p.main_interest === f || p.interests.includes(f),
        )
      )
        return false;
      if (
        filterOccupations.length > 0 &&
        !(p.occupation && filterOccupations.includes(p.occupation))
      )
        return false;
      if (
        filterPersonalities.length > 0 &&
        !(
          p.personality_type &&
          filterPersonalities.includes(p.personality_type.toUpperCase())
        )
      )
        return false;
      if (
        filterCountries.length > 0 &&
        !(
          p.location &&
          filterCountries.some((c) =>
            p.location!.toLowerCase().includes(c.toLowerCase()),
          )
        )
      )
        return false;
      // Distance + age are UI-only for now (no coordinates / no age yet).
      return true;
    });
  }, [
    nearbyPeople,
    filterVerified,
    filterInterests,
    filterOccupations,
    filterPersonalities,
    filterCountries,
  ]);

  const ageActive = ageRange[0] > AGE_MIN || ageRange[1] < AGE_MAX;
  const activeFilterCount =
    filterInterests.length +
    filterOccupations.length +
    filterPersonalities.length +
    filterCountries.length +
    (filterVerified ? 1 : 0) +
    (filterDistance < DIST_MAX ? 1 : 0) +
    (ageActive ? 1 : 0);

  const clearFilters = useCallback(() => {
    setFilterInterests([]);
    setFilterOccupations([]);
    setFilterPersonalities([]);
    setFilterCountries([]);
    setFilterVerified(false);
    setFilterDistance(DIST_MAX);
    setAgeRange([AGE_MIN, AGE_MAX]);
  }, []);

  const openFilters = useCallback(() => {
    setFiltersOpen(true);
    Animated.parallel([
      Animated.timing(drawerOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(drawerX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 240,
        mass: 0.8,
      }),
    ]).start();
  }, [drawerX, drawerOpacity]);

  const closeFilters = useCallback(() => {
    Animated.parallel([
      Animated.timing(drawerOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(drawerX, {
        toValue: SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setFiltersOpen(false));
  }, [drawerX, drawerOpacity]);

  const mappableEvents = useMemo(
    () =>
      events.filter((e) => {
        const lat = e.location_lat;
        const lng = e.location_lng;
        // Must be a real, finite, in-range coordinate. A NaN/Infinity/out-of-
        // range value sails past a `!= null` check but hands react-native-maps an
        // invalid coordinate, which hard-crashes the native map — more likely to
        // bite as more events enter view on zoom-out.
        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          (lat as number) >= -90 &&
          (lat as number) <= 90 &&
          (lng as number) >= -180 &&
          (lng as number) <= 180
        );
      }),
    [events],
  );

  const visibleEvents = useMemo(() => {
    if (activeFilter === "spots") return [];
    // No slice cap — all accumulated events are passed to the map.
    // Events from other countries land past position 50 in the store and would
    // be silently dropped by a slice(0, 50). iOS MapKit annotation recycling
    // means off-screen pins have no rendered view; the cap lives in the store (300).
    let base: EventProps[];
    if (activeFilter === "students")
      base = mappableEvents.filter((e) => (e as any).type === "students-only");
    else if (activeFilter === "all") base = mappableEvents;
    else base = mappableEvents.filter((e) => (e as any).category === activeFilter);
    console.log(
      `[MAP] visibleEvents recomputed → ${base.length} markers (totalMappable=${mappableEvents.length} filter=${activeFilter})`,
    );
    return base;
  }, [mappableEvents, activeFilter]);

  // ── Clustering + viewport culling ──────────────────────────────────────────
  // Instead of mounting one (expensive, SVG) marker per event — including every
  // event ever accumulated, even off-screen — we feed all candidates to a
  // supercluster index and only render what's in the current viewport: nearby
  // events collapse into a single count bubble, far-away ones aren't rendered
  // at all. Marker count stays small and roughly constant regardless of how
  // many events exist, so panning/zooming stays smooth.
  const eventsById = useMemo(() => {
    const m = new Map<string, EventProps>();
    for (const e of visibleEvents) m.set(e.id, e);
    return m;
  }, [visibleEvents]);

  const clusterIndex = useMemo(() => {
    const idx = new Supercluster<{ eventId: string }>({
      radius: 70,
      maxZoom: 16,
      minPoints: 2,
    });
    idx.load(
      visibleEvents.map((e) => ({
        type: "Feature" as const,
        properties: { eventId: e.id },
        geometry: {
          type: "Point" as const,
          coordinates: [e.location_lng!, e.location_lat!],
        },
      })),
    );
    return idx;
  }, [visibleEvents]);

  const clusters = useMemo(() => {
    const r = mapRegion;
    // Pad the query box a little so markers near the edge are ready before they
    // scroll into view.
    const bbox: [number, number, number, number] = [
      r.longitude - r.longitudeDelta * 0.6,
      r.latitude - r.latitudeDelta * 0.6,
      r.longitude + r.longitudeDelta * 0.6,
      r.latitude + r.latitudeDelta * 0.6,
    ];
    let z = Math.min(
      20,
      Math.max(0, Math.round(Math.log2(360 / Math.max(r.longitudeDelta, 0.000001)))),
    );
    // Guarantee a safe marker count: if this zoom would render too many, drop to
    // a lower zoom (bigger, fewer clusters) until we're under the ceiling. This
    // is what prevents the zoom-out flood crash. getClusters is cheap, so a few
    // iterations cost nothing.
    let result = clusterIndex.getClusters(bbox, z);
    while (result.length > MAX_MARKERS && z > 0) {
      z -= 1;
      result = clusterIndex.getClusters(bbox, z);
    }
    if (result.length > MAX_MARKERS) result = result.slice(0, MAX_MARKERS);
    return result;
  }, [clusterIndex, mapRegion]);

  // Warm the image cache for the organizer photos actually on screen (bounded by
  // MAX_MARKERS). A prefetched photo paints on the marker's first frame, so the
  // pin stops "tracking" almost immediately instead of stuttering the map while
  // it downloads.
  useEffect(() => {
    for (const f of clusters) {
      const p = f.properties as any;
      if (p.cluster) continue;
      const ev = eventsById.get(p.eventId);
      const url = ev?.organizer_photo_url ?? ev?.organizer_avatar_url;
      if (url) Image.prefetch(url).catch(() => {});
    }
  }, [clusters, eventsById]);

  // Read the live region without making this callback change identity every pan
  // (a changing onPress would re-render every ClusterMarker → re-snapshot churn).
  const regionRef = useRef(mapRegion);
  regionRef.current = mapRegion;

  const handleClusterPress = useCallback(
    (clusterId: number, latitude: number, longitude: number) => {
      const currentDelta = regionRef.current.longitudeDelta;
      let longitudeDelta: number;
      try {
        const targetZoom = Math.min(
          clusterIndex.getClusterExpansionZoom(clusterId),
          18,
        );
        longitudeDelta = 360 / Math.pow(2, targetZoom);
      } catch {
        longitudeDelta = currentDelta / 2.5;
      }
      // Zoom in GRADUALLY: never more than ~2.5x per tap. A single huge jump
      // (e.g. 30x) swaps the entire marker set at once, and that mass native
      // annotation churn is what crashes Apple Maps. Capping the step means the
      // cluster opens over a couple of taps but the map stays alive.
      longitudeDelta = Math.max(longitudeDelta, currentDelta / 2.5);
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: longitudeDelta,
          longitudeDelta,
        },
        350,
      );
    },
    [clusterIndex],
  );

  const visibleFavourites = useMemo(() => {
    if (activeFilter === "students") return [];
    const base = (activeFilter === "all" || activeFilter === "spots")
      ? favouritePlaces
      : favouritePlaces.filter((p) => p.category === activeFilter);
    console.log(`[MAP] visibleFavourites recomputed → ${base.length} markers`);
    return base;
  }, [favouritePlaces, activeFilter]);

  const selectedFav = useMemo(
    () => favouritePlaces.find((p) => p.id === selectedFavId) ?? null,
    [favouritePlaces, selectedFavId],
  );

  useEffect(() => {
    if (!selectedFav) {
      setFavImages([]);
      return;
    }
    setFavImagesLoading(true);
    listFavouriteImages(selectedFav.user_id, selectedFav.id)
      .then(setFavImages)
      .catch(() => setFavImages([]))
      .finally(() => setFavImagesLoading(false));
  }, [selectedFav?.id]);

  const openFavWizard = useCallback(() => {
    favWizardScale.setValue(0.88);
    favWizardOpacity.setValue(0);
    setFavWizardVisible(true);
    Animated.parallel([
      Animated.spring(favWizardScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(favWizardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [favWizardScale, favWizardOpacity]);

  const closeFavWizard = useCallback(() => {
    Animated.parallel([
      Animated.spring(favWizardScale, {
        toValue: 0.88,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
      Animated.timing(favWizardOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => setFavWizardVisible(false));
  }, [favWizardScale, favWizardOpacity]);

  const closeFavSheet = useCallback(() => {
    Animated.timing(favSheetAnim, {
      toValue: SHEET_OFF,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setSelectedFavId(null));
  }, [favSheetAnim, SHEET_OFF]);

  const handleFavTap = useCallback(
    (id: string) => {
      setSelectedFavId((prev) => {
        if (prev === id) {
          Animated.timing(favSheetAnim, {
            toValue: SHEET_OFF,
            duration: 260,
            useNativeDriver: true,
          }).start(() => setSelectedFavId(null));
          return prev;
        }
        Animated.spring(favSheetAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
        }).start();
        return id;
      });
    },
    [favSheetAnim, SHEET_OFF],
  );

  const handleDeleteFav = useCallback(
    (id: string) => {
      deletePlace(id);
      Animated.timing(favSheetAnim, {
        toValue: SHEET_OFF,
        duration: 260,
        useNativeDriver: true,
      }).start(() => setSelectedFavId(null));
    },
    [deletePlace, favSheetAnim, SHEET_OFF],
  );

  const openSheet = useCallback(
    (event: EventProps) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedEvent(event);
      setEventChannelId(null);
      setSheetParticipants([]);
      setSheetJoined(false);
      setSheetIsOrganizer(false);
      setSheetOrganizerName("");
      setSheetLoading(true);
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
      // Fetch the actual channel ID for this event alongside other sheet data
      supabase
        .from("channels")
        .select("id, name")
        .eq("event_id", event.id)
        .limit(1)
        .single()
        .then(({ data: ch }) => {
          if (ch?.id) setEventChannelId(ch.id);
        });
      Promise.all([
        getEvent(event.id).catch(() => null),
        user ? checkEventMembership(user.id, event.id).catch(() => null) : null,
      ]).then(([detail, membership]) => {
        if (detail?.participants?.length) {
          setSheetParticipants(detail.participants);
          const org = detail.participants.find(
            (p: any) =>
              p.user_id === event.organizer_id || p.id === event.organizer_id,
          );
          setSheetOrganizerName(
            org?.username ?? org?.display_name ?? "Someone",
          );
        }
        if (membership?.isMember) setSheetJoined(true);
        if (membership?.isOrganizer) setSheetIsOrganizer(true);
        setSheetLoading(false);
      });
    },
    [sheetAnim, user],
  );

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, {
      toValue: SHEET_OFF,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setSelectedEvent(null));
  }, [sheetAnim, SHEET_OFF]);

  // Ticker tap → pan the map to the activity and open its popup, exactly like
  // tapping the pin on the map.
  const handleTickerSelect = useCallback(
    (e: EventProps) => {
      if (e.location_lat != null && e.location_lng != null) {
        mapRef.current?.animateToRegion(
          {
            latitude: e.location_lat,
            longitude: e.location_lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          600,
        );
      }
      openSheet(e);
    },
    [openSheet],
  );

  const handleJoin = async () => {
    if (!user || !selectedEvent) return;
    setJoiningId(selectedEvent.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await joinEvent(user.id, selectedEvent.id);
      setSheetJoined(true);
      // Re-fetch fresh participant list so the user's tile appears
      const detail = await getEvent(selectedEvent.id).catch(() => null);
      if (detail?.participants?.length) {
        setSheetParticipants(detail.participants);
        // Find the current user's entry to animate it in
        const myEntry = detail.participants.find(
          (p: any) => p.id === user.id || p.user_id === user.id,
        );
        if (myEntry) {
          setNewParticipantId(myEntry.id ?? user.id);
          newParticipantAnim.setValue(0);
          Animated.spring(newParticipantAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 200,
          }).start();
        }
      }
    } catch (e: any) {
      Alert.alert("Oops", e?.message || "Could not join hangout.");
    } finally {
      setJoiningId(null);
    }
  };

  const handleDeleteEvent = useCallback(() => {
    if (!user || !selectedEvent) return;
    Alert.alert(
      "Delete hangout?",
      `"${selectedEvent.name}" will be permanently removed, all attendees will be kicked, and the chat will be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Are you sure?", "This cannot be undone.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Yes, delete it",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteEvent(selectedEvent.id, user.id);
                    // Close sheet FIRST — clears selectedEvent before the store
                    // refreshes, preventing a re-render against the deleted event.
                    closeSheet();
                    useEventStore.getState().fetchEvents(true);
                  } catch (e: any) {
                    Alert.alert(
                      "Error",
                      e?.message || "Could not delete hangout.",
                    );
                  }
                },
              },
            ]);
          },
        },
      ],
    );
  }, [user, selectedEvent, closeSheet]);

  const handleLeave = useCallback(() => {
    if (!user || !selectedEvent) return;
    Alert.alert(
      "Leave hangout?",
      `You'll be removed from ${selectedEvent.name} and its chat.`,
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              // Find my tile and animate it out first
              const myEntry = sheetParticipants.find(
                (p: any) => p.id === user.id || p.user_id === user.id,
              );
              if (myEntry) {
                const myId = myEntry.id ?? user.id;
                setNewParticipantId(myId);
                newParticipantAnim.setValue(1);
                await new Promise<void>((resolve) => {
                  Animated.timing(newParticipantAnim, {
                    toValue: 0,
                    duration: 280,
                    useNativeDriver: true,
                  }).start(() => resolve());
                });
              }

              await leaveEvent(user.id, selectedEvent.id);
              setSheetJoined(false);
              setNewParticipantId(null);

              // Re-fetch fresh participant list
              const detail = await getEvent(selectedEvent.id).catch(() => null);
              if (detail?.participants) {
                setSheetParticipants(detail.participants);
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Could not leave hangout.");
              setNewParticipantId(null);
            }
          },
        },
      ],
    );
  }, [user, selectedEvent, sheetParticipants, newParticipantAnim]);

  const handleWizardSuccess = useCallback(() => {
    closeWizard();
    Alert.alert("Hangout created!", "Your hangout is now live on the map.");
  }, [closeWizard]);

  const avatarUrl = resolveAvatar(userProfile?.avatar_url);

  if (isCheckingAuth) {
    return (
      <View style={styles.loader}>
        <NeoLoader />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* ── Full-screen Map ── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={SINGAPORE}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
        onPanDrag={() => {}}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {clusters.map((feature) => {
          const [lng, lat] = feature.geometry.coordinates;
          // Never hand the native map a bad coordinate.
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const props = feature.properties as any;
          if (props.cluster) {
            return (
              <ClusterMarker
                key={`cluster-${props.cluster_id}`}
                count={props.point_count}
                clusterId={props.cluster_id}
                latitude={lat}
                longitude={lng}
                onPress={handleClusterPress}
              />
            );
          }
          const event = eventsById.get(props.eventId);
          if (!event) return null;
          return (
            <EventMarker key={event.id} event={event} onPress={openSheet} />
          );
        })}

        {/* Favourite place pins — always-visible speech bubbles */}
        {visibleFavourites.map((place) => (
          <FavouritePlaceMarker
            key={`${place.id}-${favMarkerEpoch}`}
            place={place}
            onPress={handleFavTap}
          />
        ))}
      </MapView>

      {/* ── Floating Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {/* Avatar button */}
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.avatarBtn}
          activeOpacity={0.8}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient
              colors={C.Gradients.primary}
              style={styles.avatarFallback}
            >
              <Text style={styles.avatarInitial}>
                {userProfile?.username?.charAt(0)?.toUpperCase() ?? "H"}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.onlinePip} />
        </TouchableOpacity>

        {/* Wordmark */}
        <View style={styles.wordmarkWrap}>
          <LinearGradient
            colors={["rgba(255,255,255,0.92)", "rgba(255,255,255,0.80)"]}
            style={styles.wordmark}
          >
            <Image
              source={require("../assets/images/transparentbackgroundlogo.png")}
              style={styles.wordmarkLogo}
              resizeMode="contain"
            />
            <Text style={styles.wordmarkText}>Soonest</Text>
          </LinearGradient>
        </View>

        {/* Actions */}
        <View style={styles.topActions}>
          <TouchableOpacity
            onPress={() => router.push("/notifications" as any)}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Bell size={18} color={C.textPrimary} strokeWidth={2.5} />
            <View style={styles.notifPip} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/friends" as any)}
            style={[styles.iconBtn, { backgroundColor: C.accentMuted }]}
            activeOpacity={0.8}
          >
            <UserPlus size={18} color={C.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Autoscrolling activity ticker (just below the header) ── */}
      <ActivityTicker
        events={events}
        topInset={insets.top + 62}
        onSelect={handleTickerSelect}
        paused={!screenFocused}
      />

      {/* ── "People nearby" pin (left side) ── */}
      <TouchableOpacity
        style={[peopleStyles.pin, { top: insets.top + 126 }]}
        activeOpacity={0.85}
        onPress={openPeople}
      >
        <View style={peopleStyles.pinAvatars}>
          {nearbyPeople.slice(0, 3).map((p, i) =>
            p.avatar_url ? (
              <Image
                key={p.id}
                source={{ uri: p.avatar_url }}
                style={[
                  peopleStyles.pinAvatar,
                  { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
                ]}
              />
            ) : (
              <View
                key={p.id}
                style={[
                  peopleStyles.pinAvatar,
                  peopleStyles.pinAvatarFallback,
                  { marginLeft: i === 0 ? 0 : -10, zIndex: 3 - i },
                ]}
              >
                <Text style={peopleStyles.pinAvatarInitial}>
                  {(p.username ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            ),
          )}
        </View>
        <View style={peopleStyles.pinTextWrap}>
          <Text style={peopleStyles.pinCount}>{nearbyPeople.length}</Text>
          <Text style={peopleStyles.pinLabel}>here</Text>
        </View>
      </TouchableOpacity>

      {/* ── Bounds-fetch spinner pill ── */}
      {isBoundsFetching && (
        <View style={[styles.fetchPill, { top: insets.top + 126 }]} pointerEvents="none">
          <ActivityIndicator size="small" color={C.accent} />
        </View>
      )}

      {/* ── Empty map hint ── */}
      {!isLoading && mappableEvents.length === 0 && (
        <View style={styles.emptyHint}>
          <View style={styles.emptyHintCard}>
            <Zap size={14} color={C.accent} strokeWidth={2.5} />
            <Text style={styles.emptyHintText}>
              No activities yet, create one!
            </Text>
          </View>
        </View>
      )}

      {/* ── Vertical drag-to-filter strip ── */}
      <FilterStrip
        activeFilter={activeFilter}
        onFilterChange={(id) => {
          setActiveFilter(id);
          setSelectedFavId(null);
          setFavMarkerEpoch((e) => e + 1);
        }}
        stripTop={insets.top + 126}
        stripBottom={96 + insets.bottom}
        onCreateActivity={openWizard}
        onCreateFavourite={openFavWizard}
      />

      {/* ── Locate-me button (recenters the map on the user) ── */}
      <TouchableOpacity
        style={[styles.locateFab, { bottom: insets.bottom + 96 }]}
        activeOpacity={0.85}
        onPress={centerOnUser}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color={C.accent} />
        ) : (
          <LocateFixed size={20} color={C.accent} strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      {/* ── Tap-outside to close fav sheet ── */}
      {selectedFav && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { zIndex: 29 }]}
          activeOpacity={1}
          onPress={closeFavSheet}
        />
      )}

      {/* ── Selected favourite detail sheet ── */}
      <Animated.View
        style={[
          styles.favDetailCard,
          { transform: [{ translateY: favSheetAnim }] },
        ]}
        pointerEvents={selectedFav ? "auto" : "none"}
      >
        {selectedFav &&
          (() => {
            const cat = getCategoryConfig(selectedFav.category);
            return (
              <>
                {/* Header row */}
                <View style={styles.favDetailHeader}>
                  <LinearGradient
                    colors={cat.gradient as readonly [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.favDetailIcon}
                  >
                    <cat.Icon size={18} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.spotTag}>Favourite spot</Text>
                    <Text style={styles.favDetailName} numberOfLines={1}>
                      {selectedFav.place_name ?? "Favourite Spot"}
                    </Text>
                    <Text
                      style={[styles.favDetailCat, { color: cat.gradient[0] }]}
                    >
                      {cat.label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.favDetailClose}
                    onPress={closeFavSheet}
                  >
                    <X size={13} color={C.textSecondary} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Photos */}
                {(favImagesLoading || favImages.length > 0) && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.favImageRow}
                  >
                    {favImagesLoading ? (
                      <ActivityIndicator
                        color={C.accent}
                        size="small"
                        style={{ marginVertical: 8 }}
                      />
                    ) : (
                      favImages.map((url, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setLightboxUrl(url)}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: url }}
                            style={styles.favImageThumb}
                          />
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}

                {/* Note */}
                {selectedFav.note ? (
                  <View style={styles.favDetailNote}>
                    <Text style={styles.favDetailNoteText}>
                      "{selectedFav.note}"
                    </Text>
                  </View>
                ) : null}

                {/* Delete */}
                {selectedFav.user_id === user?.id && (
                  <TouchableOpacity
                    style={styles.favDetailDelete}
                    onPress={() => {
                      Alert.alert(
                        "Remove Spot?",
                        "This favourite will be deleted.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => handleDeleteFav(selectedFav.id),
                          },
                        ],
                      );
                    }}
                  >
                    <Trash2 size={14} color={C.error} strokeWidth={2} />
                    <Text style={styles.favDetailDeleteText}>Remove Spot</Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
      </Animated.View>

      {/* ── Bottom Controls (ALL EVENTS + FAB) ──
      <View style={[styles.bottomControls, { bottom: 88 + insets.bottom }]}>
        {activeFilter === "spots" ? (
          <TouchableOpacity
            onPress={openFavWizard}
            activeOpacity={0.85}
            style={styles.allEventsBtn}
          >
            <View style={styles.allEventsBtnInner}>
              <Star size={15} color={C.accent} strokeWidth={2.5} fill={C.accentMuted} />
              <Text style={styles.allEventsBtnText}>add favourite spot</Text>
              {favouritePlaces.length > 0 && (
                <View style={styles.eventsBadge}>
                  <Text style={styles.eventsBadgeText}>{favouritePlaces.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setEventsModalVisible(true)}
            activeOpacity={0.85}
            style={styles.allEventsBtn}
          >
            <View style={styles.allEventsBtnInner}>
              <MapPin size={15} color={C.accent} strokeWidth={2.5} />
              <Text style={styles.allEventsBtnText}>all activities</Text>
              {events.length > 0 && (
                <View style={styles.eventsBadge}>
                  <Text style={styles.eventsBadgeText}>{events.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

      </View> */}

      {/* ── Loading overlay — only shown on initial empty load, not on bounds refetches ── */}
      {isLoading && mappableEvents.length === 0 && (
        <View style={styles.mapLoader}>
          <View style={styles.mapLoaderCard}>
            <NeoLoader />
            <Text style={styles.mapLoaderText}>Loading hangouts…</Text>
          </View>
        </View>
      )}

      {/* ── Transparent tap-outside-to-close ── */}
      {selectedEvent && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, { zIndex: 29 }]}
          activeOpacity={1}
          onPress={closeSheet}
        />
      )}

      {/* ── Event popup card ── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
        pointerEvents={selectedEvent ? "auto" : "none"}
      >
        {selectedEvent && sheetLoading && (
          <View style={styles.sheetLoader}>
            <NeoLoader />
          </View>
        )}
        {selectedEvent &&
          !sheetLoading &&
          (() => {
            const catConfig = getCategoryConfig(
              (selectedEvent as any).category,
            );
            const CatIcon = catConfig.Icon;
            const { day, countdown } = getEventTimeLabel(
              combineEventDateTime(
                selectedEvent.startDate ?? undefined,
                selectedEvent.startTime ?? undefined,
                selectedEvent.startAnytime,
              ),
            );
            return (
              <>
                {/* Close */}
                <TouchableOpacity
                  onPress={closeSheet}
                  style={styles.sheetClose}
                >
                  <X size={15} color={C.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>

                {/* Category icon */}
                <View style={styles.sheetCatRow}>
                  <LinearGradient
                    colors={catConfig.gradient as readonly [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sheetCatIcon}
                  >
                    <CatIcon size={20} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                  {selectedEvent.require_approval && (
                    <View style={styles.applyBadge}>
                      <Text style={styles.applyText}>Apply to join</Text>
                    </View>
                  )}
                </View>

                {/* Headline */}
                <View style={styles.sheetHeadline}>
                  <Text style={styles.sheetWantsTo} numberOfLines={1}>
                    {sheetOrganizerName || "Someone"} wants to
                  </Text>
                  <Text style={styles.sheetTitle} numberOfLines={2}>
                    {selectedEvent.name}
                  </Text>
                  {(day || countdown) && (
                    <Text style={styles.sheetTimeLine}>
                      {day}
                      {countdown ? ` · ${countdown}` : ""}
                    </Text>
                  )}
                </View>

                {/* Location */}
                {/* {selectedEvent.location_text && (
                <View style={styles.locationRow}>
                  <MapPin size={12} color={C.accentPink} strokeWidth={2.5} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {selectedEvent.location_text}
                  </Text>
                </View>
              )} */}

                {/* Participants */}
                <View style={styles.sheetPeopleSection}>
                  <Text style={styles.sheetPeopleCount}>
                    {sheetParticipants.length > 0
                      ? `${sheetParticipants.length} ${sheetParticipants.length === 1 ? "person" : "people"} going`
                      : "Be the first to join!"}
                  </Text>
                  {sheetParticipants.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.sheetPeopleList}
                    >
                      {sheetParticipants.map((p, i) => {
                        const mainInterest = p.main_interest ?? null;
                        const isNew = (p.id ?? p.user_id) === newParticipantId;
                        const tileStyle = isNew
                          ? {
                              opacity: newParticipantAnim,
                              transform: [
                                {
                                  scale: newParticipantAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.4, 1],
                                  }),
                                },
                                {
                                  translateY: newParticipantAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [12, 0],
                                  }),
                                },
                              ],
                            }
                          : undefined;
                        const Tile = isNew ? Animated.View : View;
                        return (
                          <TouchableOpacity
                            key={p.id ?? i}
                            activeOpacity={0.75}
                            onPress={() => router.push(`/profile/${p.id ?? p.user_id}` as any)}
                          >
                          <Tile
                            style={[styles.sheetPersonItem, tileStyle]}
                          >
                            <View style={styles.sheetPersonAvatarWrap}>
                              <LinearGradient
                                colors={PIN_GRADIENTS[i % PIN_GRADIENTS.length]}
                                style={styles.sheetPersonAvatar}
                              >
                                {p.avatar_url ? (
                                  <Image
                                    source={{ uri: p.avatar_url }}
                                    style={StyleSheet.absoluteFillObject}
                                  />
                                ) : (
                                  <Text style={styles.sheetPersonInitial}>
                                    {p.username?.charAt(0)?.toUpperCase() ??
                                      "?"}
                                  </Text>
                                )}
                              </LinearGradient>
                              {mainInterest && (
                                <View style={styles.sheetInterestBadge}>
                                  <Text style={styles.sheetInterestBadgeText}>
                                    {interestEmoji(mainInterest)}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              style={styles.sheetPersonName}
                              numberOfLines={1}
                            >
                              {p.username ?? "User"}
                            </Text>
                            {mainInterest ? (
                              <Text
                                style={styles.sheetPersonInterest}
                                numberOfLines={1}
                              >
                                {mainInterest}
                              </Text>
                            ) : null}
                          </Tile>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>

                {/* CTA */}
                {sheetIsOrganizer ? (
                  <View style={styles.ctaRow}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/chat/[channelId]",
                          params: {
                            channelId: eventChannelId ?? selectedEvent.id,
                            channelName: selectedEvent.name,
                            eventId: selectedEvent.id,
                            category: (selectedEvent as any).category ?? "",
                          },
                        })
                      }
                      style={[styles.joinCta, { flex: 1 }]}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={C.Gradients.green}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.joinCtaGrad}
                      >
                        <Text style={styles.joinCtaText}>Go to Chat</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDeleteEvent}
                      style={styles.leaveCta}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.leaveCtaText}>Delete Activity</Text>
                    </TouchableOpacity>
                  </View>
                ) : sheetJoined ? (
                  <View style={styles.ctaRow}>
                    {/* Go to Chat */}
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/chat/[channelId]",
                          params: {
                            channelId: eventChannelId ?? selectedEvent.id,
                            channelName: selectedEvent.name,
                            eventId: selectedEvent.id,
                            category: (selectedEvent as any).category ?? "",
                          },
                        })
                      }
                      style={[styles.joinCta, { flex: 1 }]}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={C.Gradients.green}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.joinCtaGrad}
                      >
                        <Text style={styles.joinCtaText}>Go to Chat</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Leave */}
                    <TouchableOpacity
                      onPress={handleLeave}
                      style={styles.leaveCta}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.leaveCtaText}>Leave</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleJoin}
                    disabled={joiningId === selectedEvent.id}
                    style={[
                      styles.joinCta,
                      joiningId === selectedEvent.id && { opacity: 0.7 },
                    ]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={C.Gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.joinCtaGrad}
                    >
                      <Text style={styles.joinCtaText}>
                        {joiningId === selectedEvent.id
                          ? "Joining…"
                          : selectedEvent.require_approval
                            ? "Apply Now"
                            : "Join Chat"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
      </Animated.View>

      {/* ── Modals ── */}
      <EventsListModal
        visible={eventsModalVisible}
        events={events}
        onClose={() => setEventsModalVisible(false)}
        onEventPress={openSheet}
      />
      {/* ── Event wizard popup ── */}
      {wizardVisible && (
        <Animated.View
          style={[styles.popupBackdrop, { opacity: wizardOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeWizard}
          />
          <View style={styles.popupCenter} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.popupCard,
                { opacity: wizardOpacity, transform: [{ scale: wizardScale }] },
              ]}
            >
              <CreateEventWizard
                onClose={closeWizard}
                onSuccess={handleWizardSuccess}
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* ── Favourite wizard popup ── */}
      {favWizardVisible && (
        <Animated.View
          style={[styles.popupBackdrop, { opacity: favWizardOpacity }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeFavWizard}
          />
          <View style={styles.popupCenter} pointerEvents="box-none">
            <Animated.View
              style={[
                styles.popupCard,
                {
                  opacity: favWizardOpacity,
                  transform: [{ scale: favWizardScale }],
                },
              ]}
            >
              <CreateFavouriteWizard
                onClose={closeFavWizard}
                onSuccess={() => {
                  closeFavWizard();
                  reloadFavourites();
                }}
              />
            </Animated.View>
          </View>
        </Animated.View>
      )}

      {/* ── Image lightbox ── */}
      <Modal
        visible={!!lightboxUrl}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxUrl(null)}
      >
        <Pressable
          style={styles.lightboxBackdrop}
          onPress={() => setLightboxUrl(null)}
        >
          <Image
            source={{ uri: lightboxUrl ?? undefined }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxUrl(null)}
          >
            <X size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </Pressable>
      </Modal>

      {/* ── People nearby popup (bouncy, wizard-style) ── */}
      {peopleVisible && (
        <Animated.View
          style={[peopleStyles.backdrop, { opacity: peopleOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closePeople}
          />
          <Animated.View
            style={[
              peopleStyles.card,
              {
                opacity: peopleOpacity,
                transform: [{ scale: peopleScale }],
              },
            ]}
          >
            <View style={peopleStyles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={peopleStyles.liveRow}>
                  <View style={peopleStyles.liveDot} />
                  <Text style={peopleStyles.liveText}>LIVE NEARBY</Text>
                </View>
                <Text style={peopleStyles.cardTitle}>
                  {filteredPeople.length} around you
                </Text>
                <Text style={peopleStyles.cardSub}>
                  showing {filteredPeople.length} of {filteredPeople.length}
                </Text>
              </View>
              <View style={peopleStyles.headerActions}>
                <TouchableOpacity
                  style={peopleStyles.filterBtn}
                  onPress={openFilters}
                >
                  <SlidersHorizontal size={16} color={C.accent} strokeWidth={2.5} />
                  {activeFilterCount > 0 && (
                    <View style={peopleStyles.filterBadge}>
                      <Text style={peopleStyles.filterBadgeText}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={peopleStyles.cardClose}
                  onPress={closePeople}
                >
                  <X size={16} color={C.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              {filteredPeople.map((p, i) => {
                const grad = PIN_GRADIENTS[i % PIN_GRADIENTS.length];
                const accent = grad[1];
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.75}
                    onPress={() => router.push(`/profile/${p.id}` as any)}
                    style={[peopleStyles.row, { backgroundColor: accent + "12" }]}
                  >
                    <View style={peopleStyles.rowAvatarWrap}>
                      <LinearGradient
                        colors={grad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={peopleStyles.rowAvatarRing}
                      >
                        {p.avatar_url ? (
                          <Image
                            source={{ uri: p.avatar_url }}
                            style={peopleStyles.rowAvatar}
                          />
                        ) : (
                          <View
                            style={[
                              peopleStyles.rowAvatar,
                              peopleStyles.rowAvatarFallback,
                            ]}
                          >
                            <Text style={peopleStyles.rowAvatarInitial}>
                              {(p.username ?? "?")
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                      <View style={peopleStyles.interestBadge}>
                        <Text style={peopleStyles.interestBadgeText}>
                          {interestEmoji(p.main_interest)}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={peopleStyles.rowName} numberOfLines={1}>
                        {p.username ?? "?"}
                      </Text>
                      {p.main_interest ? (
                        <Text style={peopleStyles.rowLoves} numberOfLines={1}>
                          loves{" "}
                          <Text style={[peopleStyles.rowInterest, { color: accent }]}>
                            {p.main_interest}
                          </Text>
                        </Text>
                      ) : (
                        <Text style={peopleStyles.rowLoves} numberOfLines={1}>
                          meeting new people ✨
                        </Text>
                      )}
                    </View>
                    <View style={[peopleStyles.rowPip, { backgroundColor: accent }]} />
                  </TouchableOpacity>
                );
              })}
              {filteredPeople.length === 0 && (
                <Text style={peopleStyles.emptyText}>
                  {nearbyPeople.length === 0
                    ? "No one around yet — check back soon."
                    : "No one matches these filters."}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Filter drawer (slides in from the right) ── */}
      {filtersOpen && (
        <View style={peopleStyles.drawerRoot}>
          <Animated.View
            style={[peopleStyles.drawerBackdrop, { opacity: drawerOpacity }]}
          >
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={closeFilters}
            />
          </Animated.View>
          <Animated.View
            style={[
              peopleStyles.drawer,
              {
                paddingTop: insets.top + 18,
                paddingBottom: insets.bottom + 12,
                transform: [{ translateX: drawerX }],
              },
            ]}
          >
            <View style={peopleStyles.drawerHeader}>
              <Text style={peopleStyles.drawerTitle}>Filters</Text>
              <TouchableOpacity
                style={peopleStyles.cardClose}
                onPress={closeFilters}
              >
                <X size={16} color={C.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Verified */}
              <Text style={peopleStyles.drawerSectionLabel}>Verification</Text>
              <TouchableOpacity
                style={peopleStyles.toggleRow}
                activeOpacity={0.8}
                onPress={() => setFilterVerified((v) => !v)}
              >
                <View style={peopleStyles.toggleRowLeft}>
                  <BadgeCheck size={18} color={C.accent} strokeWidth={2.5} />
                  <Text style={peopleStyles.toggleRowText}>Verified only</Text>
                </View>
                <View
                  style={[
                    peopleStyles.switch,
                    filterVerified && peopleStyles.switchOn,
                  ]}
                >
                  <View
                    style={[
                      peopleStyles.knob,
                      filterVerified && peopleStyles.knobOn,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              {/* Distance (single-thumb slider — UI-only until presence ships) */}
              <Text style={peopleStyles.drawerSectionLabel}>Distance</Text>
              <RangeSlider
                min={DIST_MIN}
                max={DIST_MAX}
                step={1}
                values={[filterDistance]}
                onChange={(v) => setFilterDistance(v[0])}
                format={(v) => (v >= DIST_MAX ? "Any" : `${v} km`)}
              />

              {/* Age range (dual-thumb slider — hardcoded until age is available) */}
              <Text style={peopleStyles.drawerSectionLabel}>Age range</Text>
              <RangeSlider
                min={AGE_MIN}
                max={AGE_MAX}
                step={1}
                values={ageRange}
                onChange={setAgeRange}
                format={(v) => (v >= AGE_MAX ? "60+" : `${v}`)}
              />

              {/* Occupation */}
              <Text style={peopleStyles.drawerSectionLabel}>Occupation</Text>
              <FilterChips
                options={availableOccupations}
                selected={filterOccupations}
                onToggle={(it) => setFilterOccupations((p) => toggleInList(p, it))}
                empty="No occupations to filter yet."
              />

              {/* Personality type */}
              <Text style={peopleStyles.drawerSectionLabel}>Personality</Text>
              <FilterChips
                options={availablePersonalities}
                selected={filterPersonalities}
                onToggle={(it) =>
                  setFilterPersonalities((p) => toggleInList(p, it))
                }
                empty="No personality types to filter yet."
              />

              {/* Home country */}
              <Text style={peopleStyles.drawerSectionLabel}>Home country</Text>
              <FilterChips
                options={COUNTRIES}
                selected={filterCountries}
                onToggle={(it) => setFilterCountries((p) => toggleInList(p, it))}
                empty="No countries available."
              />

              {/* Interests */}
              <Text style={peopleStyles.drawerSectionLabel}>Interests</Text>
              <FilterChips
                options={availableInterests}
                selected={filterInterests}
                onToggle={(it) => setFilterInterests((p) => toggleInList(p, it))}
                empty="No interests to filter yet."
              />
            </ScrollView>

            <View style={peopleStyles.drawerFooter}>
              <TouchableOpacity
                style={peopleStyles.clearBtn}
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text style={peopleStyles.clearBtnText}>Clear all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={peopleStyles.applyBtn}
                onPress={closeFilters}
                activeOpacity={0.9}
              >
                <Text style={peopleStyles.applyBtnText}>
                  Show {filteredPeople.length}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      <MobileNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.canvas,
  },

  // ── Top Bar ──
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarBtn: { position: "relative" },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    borderWidth: 2,
    borderColor: "rgba(124,58,237,0.20)",
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: C.Fonts.heading,
    fontSize: 18,
    color: "#fff",
  },
  onlinePip: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentGreen,
    borderWidth: 2,
    borderColor: "#fff",
  },
  wordmarkWrap: { flex: 1, alignItems: "center" },
  wordmark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  wordmarkLogo: {
    width: 35,
    height: 35,
  },
  wordmarkText: {
    fontFamily: C.Fonts.heading,
    fontSize: 26,
    fontStyle: "italic",
    color: C.textPrimary,
  },
  topActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  notifPip: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: C.Radii.full,
    backgroundColor: C.accentPink,
    borderWidth: 1.5,
    borderColor: "#fff",
  },

  // ── Pins ──
  pinWrap: { alignItems: "center" },
  pinBubbleWrap: {
    position: "relative",
    width: 50,
    height: 50,
  },
  pinBubble: {
    width: 50,
    height: 50,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  pinOrgAvatar: {
    position: "absolute",
    bottom: -5,
    right: -2,
    width: 25,
    height: 25,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 3,
  },
  pinOrgAvatarImg: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pinOrgInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 7,
    color: "#fff",
  },
  pinText: {
    fontFamily: C.Fonts.heading,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pinTail: {
    width: 3,
    height: 7,
    borderRadius: 2,
    marginTop: 1,
    opacity: 0.7,
  },

  // ── Empty hint ──
  emptyHint: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  emptyHintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: C.Radii.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyHintText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  // ── Bottom Controls ──
  bottomControls: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 15,
  },
  allEventsBtn: {
    flex: 1,
    borderRadius: C.Radii.xl,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: "hidden",
  },
  allEventsBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.95)",
    borderLeftColor: "rgba(255,255,255,0.70)",
    borderRightColor: "rgba(255,255,255,0.30)",
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  allEventsBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  eventsBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventsBadgeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: C.accent,
  },
  // ── Map Loader ──
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  mapLoaderCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: C.Radii.xl,
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
  },
  mapLoaderText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  // ── Event popup card ──
  sheet: {
    position: "absolute",
    bottom: 92,
    left: SHEET_LEFT,
    width: SHEET_WIDTH,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    zIndex: 30,
    padding: C.Space.xl,
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  sheetLoader: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetClose: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    backgroundColor: C.canvas,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  sheetCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  sheetCatIcon: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  applyBadge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  applyText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: C.accent,
  },
  sheetHeadline: {
    gap: 4,
  },
  sheetWantsTo: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.lg,
    color: C.textSecondary,
  },
  sheetPersonAvatarWrap: {
    width: 44,
    height: 44,
    // overflow visible so the sticker can peek outside the circle
  },
  sheetInterestBadge: {
    position: "absolute",
    bottom: -4,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sheetInterestBadgeText: {
    fontSize: 11,
  },
  sheetTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    lineHeight: C.FontSizes.xl * 1.15,
    marginTop: 2,
  },
  sheetTimeLine: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
    marginTop: 1,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  sheetPeopleSection: {
    gap: 8,
  },
  sheetPeopleCount: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  sheetPeopleList: {
    gap: 12,
    paddingVertical: 2,
  },
  sheetPersonItem: {
    alignItems: "center",
    gap: 3,
    width: 64,
  },
  sheetPersonAvatar: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: C.surface,
  },
  sheetPersonInitial: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 16,
    color: "#fff",
  },
  sheetPersonName: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 11,
    color: C.textPrimary,
    textAlign: "center",
    width: 64,
  },
  sheetPersonInterest: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: 9.5,
    color: C.accent,
    textAlign: "center",
    width: 64,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  leaveCta: {
    height: 52,
    borderRadius: C.Radii.xl,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: C.Space.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#DC2626",
  },
  joinCta: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 7,
    marginTop: 2,
  },
  joinCtaGrad: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  joinCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
    letterSpacing: 0.3,
  },
  deleteCta: {
    height: 52,
    borderRadius: C.Radii.xl,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  deleteCtaText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.error,
  },
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  rowContainer: {
    flexDirection: "row", // Establishes a horizontal row layout
    alignItems: "center", // Centers items vertically within the row
  },
  image: {
    width: 50, // Image must have an explicit width
    height: 50, // Image must have an explicit height
    marginRight: 10, // Creates space between image and text
  },
  text: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1,
  },

  // Wizard bottom-sheet container — pointerEvents "box-none" on the wrapper
  popupBackdrop: {
    ...(StyleSheet.absoluteFillObject as any),
    backgroundColor: "rgba(20,10,40,0.52)",
    zIndex: 100,
  },
  popupCenter: {
    ...(StyleSheet.absoluteFillObject as any),
    alignItems: "center",
    justifyContent: "center",
  },
  popupCard: {
    width: SCREEN_WIDTH * 0.94,
    maxHeight: SCREEN_HEIGHT * 0.88,
    borderRadius: C.Radii.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },

  // ── Favourite detail sheet ──
  favDetailCard: {
    position: "absolute",
    bottom: 92,
    left: SHEET_LEFT,
    width: SHEET_WIDTH,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    zIndex: 30,
    padding: C.Space.xl,
    gap: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 20,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  favDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  favDetailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  favDetailName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  favDetailCat: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    marginTop: 2,
  },
  favDetailClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0EDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  favDetailNote: {
    backgroundColor: "#F8F5FF",
    borderTopRightRadius: C.Radii.lg,
    borderBottomRightRadius: C.Radii.lg,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderLeftWidth: 3,
    borderLeftColor: "#A78BFA",
  },
  favDetailNoteText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    lineHeight: C.FontSizes.sm * 1.5,
  },
  favDetailDelete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
  },
  favDetailDeleteText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.error,
  },
  favImageRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  favImageThumb: {
    width: 88,
    height: 88,
    borderRadius: C.Radii.lg,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  lightboxClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  spotTag: {
    fontFamily: C.Fonts.body,
    fontSize: 10,
    color: C.textTertiary,
    letterSpacing: 0.3,
  },
  fetchPill: {
    position: "absolute",
    alignSelf: "center",
    left: SCREEN_WIDTH / 2 - 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 25,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  locateFab: {
    position: "absolute",
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.97)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
});
