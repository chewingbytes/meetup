import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./authContext";
import { listFavouriteImages } from "./supabaseStorage";

export interface FavouritePlace {
  id: string;
  user_id: string;
  category: string;
  place_name: string | null;
  location_lat: number;
  location_lng: number;
  note: string | null;
  created_at: string;
  first_image_url: string | null;
}

export function useFavouritePlaces() {
  const { user } = useAuth();
  const [places, setPlaces] = useState<FavouritePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    console.log("[FAV PLACES] load() called");
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("favourite_places")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("[FAV PLACES] fetch error:", error.message, error.code);
      }
      // Ensure lat/lng are numbers (Supabase can return them as strings over HTTP)
      const rows = (data ?? []).map((r: any) => ({
        ...r,
        location_lat: Number(r.location_lat),
        location_lng: Number(r.location_lng),
        first_image_url: null as string | null,
      })) as FavouritePlace[];

      console.log(`[FAV PLACES] ${rows.length} places fetched, pre-loading images...`);
      // Pre-fetch first image URL for each place so markers render synchronously
      // (no async state changes inside the marker = no bad-snapshot-timing issues)
      const rowsWithImages = await Promise.all(
        rows.map(async (place) => {
          try {
            const urls = await listFavouriteImages(place.user_id, place.id);
            return { ...place, first_image_url: urls[0] ?? null };
          } catch {
            return place;
          }
        }),
      );
      console.log("[FAV PLACES] images pre-loaded, setPlaces");
      setPlaces(rowsWithImages);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const addPlace = useCallback(
    async (place: {
      category: string;
      place_name?: string;
      location_lat: number;
      location_lng: number;
      note: string;
    }) => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("favourite_places")
        .insert({ ...place, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      const inserted = { ...data, first_image_url: null } as FavouritePlace;
      setPlaces((prev) => [inserted, ...prev]);
      return inserted;
    },
    [user]
  );

  const deletePlace = useCallback(async (id: string) => {
    await supabase.from("favourite_places").delete().eq("id", id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { places, isLoading, addPlace, deletePlace, reload: load };
}
