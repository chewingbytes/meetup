/**
 * MobileNav — floating navigation bar with a press-and-hold slider.
 *
 * Idle: a compact pill (scaled down) showing the two icons, the active one
 *       sitting on a gradient indicator.
 * Press & hold: the pill springs bigger, labels fade in, and you can slide
 *       left/right between the options — the gradient indicator follows your
 *       finger. Release to navigate to the highlighted option and collapse.
 *
 * iOS gets a frosted "liquid glass" pill (expo-blur); Android a solid pill.
 */

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import { Home, MessageSquare } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/theme/clay";

interface MobileNavProps {
  active?: "home" | "messages";
}

const NAV_ITEMS = [
  { id: "home", Icon: Home, label: "Home", href: "/" },
  { id: "messages", Icon: MessageSquare, label: "Chats", href: "/messages" },
] as const;

const isIOS = Platform.OS === "ios";
const PILL_INNER = 240; // fixed layout width → stable touch math
const SLOT = PILL_INNER / NAV_ITEMS.length; // 120

export default function MobileNav({ active }: MobileNavProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = Math.max(
    0,
    NAV_ITEMS.findIndex((i) => i.id === active),
  );

  const [held, setHeld] = useState(false);
  const [selIndex, setSelIndex] = useState(activeIndex);
  const selRef = useRef(activeIndex);
  const heldRef = useRef(false);

  const expandAnim = useRef(new Animated.Value(0)).current; // 0 idle, 1 held
  const selAnim = useRef(new Animated.Value(activeIndex)).current;

  // On focus (mount + every time this screen is returned to) snap the indicator
  // to its own active tab — instantly, no JS-thread spring. This is what keeps
  // the navbar from "lagging into position" after a slide navigates away: the
  // departing screen never animates the indicator back, and the arriving screen
  // is already correct.
  useFocusEffect(
    useCallback(() => {
      heldRef.current = false;
      selRef.current = activeIndex;
      setSelIndex(activeIndex);
      selAnim.setValue(activeIndex);
    }, [activeIndex, selAnim]),
  );

  const setHeldState = (v: boolean) => {
    heldRef.current = v;
    setHeld(v);
    Animated.spring(expandAnim, {
      toValue: v ? 1 : 0,
      useNativeDriver: true,
      damping: v ? 14 : 20,
      stiffness: v ? 200 : 320,
      mass: 0.7,
    }).start();
  };

  const selectIndex = (idx: number, haptic: boolean) => {
    if (idx === selRef.current) return;
    selRef.current = idx;
    setSelIndex(idx);
    if (haptic) Haptics.selectionAsync().catch(() => {});
    Animated.spring(selAnim, {
      toValue: idx,
      useNativeDriver: true,
      damping: 16,
      stiffness: 240,
    }).start();
  };

  const idxFromX = (x: number) =>
    Math.max(0, Math.min(NAV_ITEMS.length - 1, Math.floor(x / SLOT)));

  const litIndex = held ? selIndex : activeIndex;
  // Nudge the icon up only when expanded, so it stays perfectly centered idle.
  const iconShift = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });

  const content = (
    <View
      style={styles.row}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        selectIndex(idxFromX(e.nativeEvent.locationX), false);
        setHeldState(true);
        Haptics.selectionAsync().catch(() => {});
      }}
      onResponderMove={(e) => {
        selectIndex(idxFromX(e.nativeEvent.locationX), true);
      }}
      onResponderRelease={() => {
        const target = NAV_ITEMS[selRef.current];
        const changed = selRef.current !== activeIndex;
        setHeldState(false);
        if (target && changed) router.push(target.href as any);
      }}
      onResponderTerminate={() => {
        setHeldState(false);
        selectIndex(activeIndex, false);
      }}
    >
      {/* Sliding gradient indicator */}
      <Animated.View
        style={[
          styles.indicatorWrap,
          {
            width: SLOT,
            transform: [{ translateX: Animated.multiply(selAnim, SLOT) }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={C.Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.indicator}
        />
      </Animated.View>

      {NAV_ITEMS.map((item, i) => {
        const lit = i === litIndex;
        const { Icon } = item;
        return (
          <View key={item.id} style={styles.item} pointerEvents="none">
            <Animated.View style={{ transform: [{ translateY: iconShift }] }}>
              <Icon
                size={22}
                color={lit ? "#fff" : C.textSecondary}
                strokeWidth={lit ? 2.6 : 2}
              />
            </Animated.View>
            <Animated.Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: lit ? "#fff" : C.textTertiary, opacity: expandAnim },
              ]}
            >
              {item.label}
            </Animated.Text>
          </View>
        );
      })}
    </View>
  );

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.pillShadow,
          {
            transform: [
              {
                scale: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        {isIOS ? (
          <BlurView intensity={50} tint="light" style={styles.pillGlass}>
            {content}
          </BlurView>
        ) : (
          <View style={styles.pillSolid}>{content}</View>
        )}
      </Animated.View>
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
  pillShadow: {
    borderRadius: C.Radii.full,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 14,
  },
  pillGlass: {
    borderRadius: C.Radii.full,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  pillSolid: {
    borderRadius: C.Radii.full,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  row: {
    width: PILL_INNER,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  indicatorWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  indicator: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: C.Radii.full,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.5)",
    borderLeftColor: "rgba(255,255,255,0.3)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    zIndex: 1,
  },
  label: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
