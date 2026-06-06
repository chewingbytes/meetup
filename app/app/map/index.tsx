import MobileNav from "@/components/mobile-nav";
import { useEvents } from "@/hooks/useEvents";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Compass, MapPin, Navigation, Search } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SG_BOUNDS = {
  latMin: 1.15,
  latMax: 1.5,
  lngMin: 103.55,
  lngMax: 104.2,
};

const SG_CENTER = { latitude: 1.3521, longitude: 103.8198 };

const haversineKm = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const isValidCoordinate = (lat?: number | null, lng?: number | null) => {
  if (lat == null || lng == null) return false;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
};

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events, isLoading: eventsLoading } = useEvents();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [geocodeMap, setGeocodeMap] = useState<
    Record<string, { latitude: number; longitude: number }>
  >({});
  const [hasFit, setHasFit] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const listRef = useRef<FlatList<(typeof mapEvents)[0]> | null>(null);
  const initialRegion: Region = {
    latitude: SG_CENTER.latitude,
    longitude: SG_CENTER.longitude,
    latitudeDelta: 0.34,
    longitudeDelta: 0.58,
  };
  const emptyStyle = useMemo(() => [], []);

  const mapEvents = useMemo(() => {
    return events
      .map((ev) => {
        const hasDirectCoords = isValidCoordinate(
          ev.location_lat as any,
          ev.location_lng as any,
        );
        const fallback = geocodeMap[ev.id];
        const coordinate = hasDirectCoords
          ? {
              latitude: Number(ev.location_lat),
              longitude: Number(ev.location_lng),
            }
          : fallback;

        return {
          id: ev.id,
          title: ev.name,
          address: ev.location_text || "Unknown location",
          image: (ev as any).cover_image || undefined,
          category: ev.is_paid ? "PAID" : "FREE",
          distance: "? km",
          coordinate,
        };
      })
      .filter((item) => !!item.coordinate);
  }, [events, geocodeMap]);

  const filtered = useMemo(
    () =>
      mapEvents.filter(
        (c) =>
          c.title?.toLowerCase().includes(search.toLowerCase()) ||
          c.address?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, mapEvents],
  );

  // Reset fit flag when filter set changes
  useEffect(() => {
    setHasFit(false);
  }, [search, mapEvents.length]);

  // Geocode any events missing coords when location_text exists
  useEffect(() => {
    const toGeocode = events.filter(
      (ev) =>
        !isValidCoordinate(ev.location_lat as any, ev.location_lng as any) &&
        ev.location_text &&
        !geocodeMap[ev.id],
    );

    if (toGeocode.length === 0) return;

    let cancelled = false;

    const run = async () => {
      const next: Record<string, { latitude: number; longitude: number }> = {};

      for (const ev of toGeocode) {
        if (cancelled) break;
        try {
          const results = await Location.geocodeAsync(ev.location_text!);
          if (!results || results.length === 0) continue;

          const inSg = results.find(
            (r) =>
              r.latitude >= SG_BOUNDS.latMin &&
              r.latitude <= SG_BOUNDS.latMax &&
              r.longitude >= SG_BOUNDS.lngMin &&
              r.longitude <= SG_BOUNDS.lngMax,
          );

          let chosen = inSg;

          if (!chosen) {
            const sorted = [...results].sort(
              (a, b) =>
                haversineKm(
                  { latitude: a.latitude, longitude: a.longitude },
                  SG_CENTER,
                ) -
                haversineKm(
                  { latitude: b.latitude, longitude: b.longitude },
                  SG_CENTER,
                ),
            );

            const candidate = sorted[0];
            if (candidate) {
              const dist = haversineKm(
                {
                  latitude: candidate.latitude,
                  longitude: candidate.longitude,
                },
                SG_CENTER,
              );
              if (dist <= 500) {
                chosen = candidate;
              }
            }
          }

          if (chosen && !cancelled) {
            next[ev.id] = {
              latitude: chosen.latitude,
              longitude: chosen.longitude,
            };
          }
        } catch (err) {
          console.warn("Geocode failed", ev.location_text, err);
        }
      }

      if (!cancelled && Object.keys(next).length > 0) {
        setGeocodeMap((prev) => ({ ...prev, ...next }));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [events, geocodeMap]);

  const handleMarkerPress = (id: string) => {
    setSelectedId(id);
    const idx = filtered.findIndex((f) => f.id === id);
    if (idx >= 0 && listRef.current) {
      try {
        listRef.current.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (err) {
        console.warn("scrollToIndex failed", err);
      }
    }
  };

  const renderItem = ({ item }: { item: (typeof mapEvents)[0] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/events/${item.id}` as any)}
      className={`mb-4 bg-white border-[3px] border-black p-0 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none ${selectedId === item.id ? "ring-4 ring-[#FF6B6B]" : ""}`}
    >
      <View className="h-40 w-full border-b-[3px] border-black relative bg-gray-200">
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View
          className={`absolute top-2 right-2 px-2 py-1 border-[2px] border-black ${item.category === "PAID" ? "bg-[#FF6B6B]" : "bg-[#A7F3D0]"}`}
        >
          <Text className="font-black text-xs uppercase">{item.category}</Text>
        </View>
      </View>

      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="font-black text-lg uppercase mb-1 leading-tight">
            {item.title}
          </Text>
          <View className="flex-row items-center">
            <MapPin size={16} color="#666" strokeWidth={2.5} className="mr-1" />
            <Text className="font-bold text-xs text-gray-500 uppercase">
              {item.address}
            </Text>
          </View>
        </View>

        <View className="items-center justify-center bg-black px-3 py-2 rounded-none">
          <Text className="font-black text-white text-lg">{item.distance}</Text>
          <Navigation size={14} color="#FFF" strokeWidth={3} className="mt-1" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Fit map to markers when data changes (once per filtered set)
  useEffect(() => {
    if (!mapRef.current || filtered.length === 0 || hasFit) return;
    const coords = filtered.map((f) => f.coordinate);
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 140, right: 40, bottom: 240, left: 40 },
      animated: true,
    });
    setHasFit(true);
  }, [filtered, hasFit]);

  return (
    <View className="flex-1 bg-[#FFFDF5]">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        ref={mapRef}
        customMapStyle={emptyStyle}
      >
        {filtered.map((loc) => (
          <Marker
            key={loc.id}
            coordinate={loc.coordinate}
            onPress={() => handleMarkerPress(loc.id)}
            pinColor={loc.category === "PAID" ? "#FF6B6B" : "#4ADE80"}
          />
        ))}
      </MapView>

      {/* Overlay Header & Search */}
      <View
        style={{ paddingTop: insets.top + 12, zIndex: 50 }}
        className="absolute top-0 left-0 right-0"
      >
        <View className="mx-4 bg-white border-[4px] border-black px-4 py-3 shadow-[8px_8px_0px_0px_#000]">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-black text-2xl uppercase tracking-tighter">
              Explore Map
            </Text>
            <TouchableOpacity
              className="w-10 h-10 bg-[#C4B5FD] border-[3px] border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
              onPress={() => setSelectedId(null)}
            >
              <Compass size={22} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center bg-white border-[3px] border-black px-3 py-3 shadow-[4px_4px_0px_0px_#000]">
            <Search size={24} color="#000" strokeWidth={3} className="mr-3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="SEARCH NEARBY..."
              placeholderTextColor="#999"
              className="flex-1 font-black text-lg uppercase"
            />
          </View>
        </View>
      </View>

      {/* Bottom carousel */}
      <View className="absolute left-0 right-0 bottom-20">
        <FlatList
          ref={listRef}
          horizontal
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          onScrollToIndexFailed={({ index }) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index, animated: true });
            }, 150);
          }}
        />
      </View>

      <MobileNav active="map" />
    </View>
  );
}
