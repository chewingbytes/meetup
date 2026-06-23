// Address search + reverse geocoding via OpenStreetMap Nominatim (free, no key),
// matching the Expo app's location autofill. Debounce calls (Nominatim asks for
// ≤1 req/sec); the create form debounces typed queries by 400ms.

export interface AddressSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

const BASE = "https://nominatim.openstreetmap.org";

/** Autocomplete suggestions for a typed query (min 3 chars). */
export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  try {
    const url =
      `${BASE}/search?q=${encodeURIComponent(query)}` +
      `&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return [];
    const data: any[] = await res.json();
    return data.map((item) => ({
      displayName: item.display_name,
      shortName:
        [
          item.address?.road,
          item.address?.suburb,
          item.address?.city || item.address?.town,
          item.address?.country,
        ]
          .filter(Boolean)
          .join(", ") || item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

/** Human-readable address for a coordinate (used after a map-pin drop). */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const url = `${BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return fallback;
    const data: any = await res.json();
    const a = data.address ?? {};
    const addr = [
      a.road || a.pedestrian || a.amenity,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village,
      a.country,
    ]
      .filter(Boolean)
      .join(", ");
    return addr || data.display_name || fallback;
  } catch {
    return fallback;
  }
}
