import { getCategoryConfig } from "@/utils/categories";
import React, { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import type { FavouritePlace } from "@/lib/useFavouritePlaces";

interface Props {
  place: FavouritePlace;
  onPress: (id: string) => void;
}

// place.first_image_url is pre-loaded by useFavouritePlaces so the marker
// renders in one pass. We snapshot ONCE (brief track on mount, then off) — never
// leave tracksViewChanges on permanently: that re-snapshots every frame forever
// (constant heat) and crashes Apple Maps if the marker is ever torn down
// mid-snapshot.
export const FavouritePlaceMarker = memo(({ place, onPress }: Props) => {
  const catConfig = getCategoryConfig(place.category);
  const { Icon } = catConfig;
  const note = place.note?.trim() || "My favourite spot";
  const [r0, r1] = catConfig.gradient;

  const [track, setTrack] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setTrack(false), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: place.location_lat,
        longitude: place.location_lng,
      }}
      onPress={() => onPress(place.id)}
      tracksViewChanges={track}
      anchor={{ x: 0.5, y: 1.0 }}
    >
      <View style={styles.container} collapsable={false}>
        {/* Speech bubble */}
        <View style={[styles.bubble, { borderColor: r0 + "45" }]}>
          <View style={[styles.bubbleAccent, { backgroundColor: r0 }]} />
          <View style={styles.bubbleContent}>
            <Icon size={12} color={r0} strokeWidth={2.5} />
            <Text style={styles.bubbleText} numberOfLines={1}>
              {note}
            </Text>
          </View>
        </View>

        {/* Triangle pointer */}
        <View style={styles.pointer} />

        {/* Pin body */}
        <View style={[styles.pin, { backgroundColor: r0 }]}>
          {place.first_image_url ? (
            <Image source={{ uri: place.first_image_url }} style={styles.pinImage} />
          ) : (
            <Text style={styles.pinEmoji}>💬</Text>
          )}
        </View>
        <View style={[styles.pinTip, { borderTopColor: r1 }]} />
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    maxWidth: 160,
    minWidth: 70,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  bubbleContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flex: 1,
  },
  bubbleText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    color: "#332F3A",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
    marginTop: -1,
    alignSelf: "center",
  },
  pin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.7)",
    overflow: "hidden",
  },
  pinImage: {
    width: "100%",
    height: "100%",
  },
  pinEmoji: {
    fontSize: 22,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
});
