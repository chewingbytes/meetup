import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

export function SkeletonCard({ height = 224 }: { height?: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.ease,
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: "100%",
          height,
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          marginBottom: 16,
        },
        animatedStyle,
      ]}
    />
  );
}

export function SkeletonCarousel() {
  return (
    <View className="mb-8">
      {/* Heading skeleton */}
      <View className="px-5 mb-4">
        <View className="w-32 h-5 bg-zinc-800 rounded" />
      </View>

      {/* Cards skeleton */}
      <View className="flex-row px-5 gap-4">
        <SkeletonCard height={224} />
      </View>
    </View>
  );
}

export function SkeletonVerticalList() {
  return (
    <View className="w-full mb-8">
      {/* Heading skeleton */}
      <View className="px-5 mb-4">
        <View className="w-40 h-5 bg-zinc-800 rounded" />
      </View>

      {/* Cards skeleton */}
      <View className="px-5 gap-4">
        <SkeletonCard height={208} />
        <SkeletonCard height={208} />
        <SkeletonCard height={208} />
      </View>
    </View>
  );
}