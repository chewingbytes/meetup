/**
 * MobileNav — floating clay pill navigation bar.
 *
 * A fully-rounded pill that floats above the bottom edge. Active tab
 * gets a gradient orb that lifts above the pill with its own shadow.
 */

import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Hash, Home, MessageSquare } from "lucide-react-native";
import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/theme/clay";

interface MobileNavProps {
  active?: "home" | "explore" | "messages";
}

const NAV_ITEMS = [
  { id: "home",     Icon: Home,          label: "Home",    href: "/" },
  { id: "explore",  Icon: Hash,          label: "Explore", href: "/explore" },
  { id: "messages", Icon: MessageSquare, label: "Chats",   href: "/messages" },
] as const;

function NavItem({
  item,
  isActive,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const { Icon } = item;

  const handlePressIn = () => {
    Haptics.selectionAsync();
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 8 }).start();
  };

  return (
    <Pressable
      onPress={() => router.push(item.href as any)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.item}
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.itemInner, { transform: [{ scale }] }]}>
        {isActive ? (
          <View style={styles.activeWrap}>
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeOrb}
            >
              <Icon size={22} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={styles.activeLabel}>{item.label}</Text>
          </View>
        ) : (
          <View style={styles.inactiveIcon}>
            <Icon size={20} color={C.textSecondary} strokeWidth={2} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function MobileNav({ active }: MobileNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} isActive={active === item.id} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: C.Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.60)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  itemInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeWrap: {
    alignItems: "center",
    gap: 3,
  },
  activeOrb: {
    width: 48,
    height: 48,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.50)",
    borderLeftColor: "rgba(255,255,255,0.30)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.10)",
  },
  activeLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    color: C.accent,
    letterSpacing: 0.3,
  },
  inactiveIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: C.Radii.full,
  },
});
