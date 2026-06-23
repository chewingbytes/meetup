/**
 * ClayBackground — animated floating blobs on the canvas.
 *
 * Blobs use react-native-reanimated withRepeat/withTiming for smooth
 * infinite float cycles. They're purely decorative (pointerEvents=none).
 *
 * Usage: wrap your screen root in <ClayBackground> or use it as
 * a sibling with position:absolute and pointerEvents="none".
 */

import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { C } from "@/theme/clay";

interface BlobConfig {
  color: string;
  size: number;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  delay?: number;
  duration?: number;
  amplitude?: number;
}

const DEFAULT_BLOBS: BlobConfig[] = [
  {
    color: "rgba(124,58,237,0.10)", // violet
    size: 280,
    top: -60,
    left: -80,
    delay: 0,
    duration: 9000,
    amplitude: 22,
  },
  {
    color: "rgba(219,39,119,0.08)", // pink
    size: 240,
    top: "25%",
    right: -80,
    delay: 2000,
    duration: 11000,
    amplitude: 18,
  },
  {
    color: "rgba(14,165,233,0.07)", // blue
    size: 200,
    bottom: "15%",
    left: -60,
    delay: 4000,
    duration: 8500,
    amplitude: 15,
  },
  {
    color: "rgba(16,185,129,0.07)", // green
    size: 160,
    bottom: -40,
    right: -20,
    delay: 1500,
    duration: 10000,
    amplitude: 12,
  },
];

function FloatingBlob({ config }: { config: BlobConfig }) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    const dur = config.duration ?? 9000;
    const amp = config.amplitude ?? 20;
    const delay = config.delay ?? 0;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-amp, { duration: dur / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: dur / 2, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(3, { duration: (dur * 0.6), easing: Easing.inOut(Easing.sin) }),
          withTiming(-2, { duration: (dur * 0.4), easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay + 300,
      withRepeat(
        withSequence(
          withTiming(1.04, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  const posStyle: any = {
    position: "absolute",
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
    backgroundColor: config.color,
  };
  if (config.top !== undefined) posStyle.top = config.top;
  if (config.bottom !== undefined) posStyle.bottom = config.bottom;
  if (config.left !== undefined) posStyle.left = config.left;
  if (config.right !== undefined) posStyle.right = config.right;

  return <Animated.View style={[posStyle, animStyle]} />;
}

interface ClayBackgroundProps {
  children?: React.ReactNode;
  blobs?: BlobConfig[];
  style?: any;
}

export function ClayBackground({
  children,
  blobs = DEFAULT_BLOBS,
  style,
}: ClayBackgroundProps) {
  return (
    <View style={[styles.root, style]}>
      {/* Blob layer — pointer events none so they don't intercept touches */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {blobs.map((blob, i) => (
          <FloatingBlob key={i} config={blob} />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.canvas,
    overflow: "hidden",
  },
});
