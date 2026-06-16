/**
 * CreateFavouriteWizard — 4-step favourite place creation.
 * Steps: Category → Location → Your Note → Review & Save
 *
 * Renders as a plain View (NOT a Modal). The parent slides it up
 * using Animated.View translateY, same pattern as CreateEventWizard.
 */

import { useFavouritePlaces } from "@/lib/useFavouritePlaces";
import { uploadFavouriteImage } from "@/lib/supabaseStorage";
import { CATEGORIES } from "@/utils/categories";
import { useAuth } from "@/lib/authContext";
import { C } from "@/theme/clay";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  ChevronLeft,
  ImagePlus,
  MapPin,
  Search,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: SCREEN_H } = Dimensions.get("window");
export const FAV_WIZARD_HEIGHT = SCREEN_H * 0.76;

const SINGAPORE = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const TOTAL_STEPS = 4;
const STEP_LABELS = ["Category", "Location", "Photos & Note", "Review"];

interface AddressSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

async function searchNominatim(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, { headers: { "User-Agent": "SoonestApp/1.0" } });
    const data: any[] = await res.json();
    return data.map((item) => ({
      displayName: item.display_name,
      shortName: [
        item.address?.road,
        item.address?.suburb,
        item.address?.city || item.address?.town,
      ]
        .filter(Boolean)
        .join(", "),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}

interface WizardForm {
  category: string;
  locationLat: number | null;
  locationLng: number | null;
  locationText: string;
  note: string;
  placeName: string;
  imageUris: string[];
}

const BLANK: WizardForm = {
  category: "",
  locationLat: null,
  locationLng: null,
  locationText: "",
  note: "",
  placeName: "",
  imageUris: [],
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFavouriteWizard({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addPlace } = useFavouritePlaces();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(BLANK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Location state
  const [locationTab, setLocationTab] = useState<"map" | "search">("map");
  const mapViewRef = useRef<any>(null);
  const mapRegionRef = useRef(SINGAPORE);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [reverseAddr, setReverseAddr] = useState("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addrQuery, setAddrQuery] = useState("");
  const [addrSuggestions, setAddrSuggestions] = useState<AddressSuggestion[]>([]);
  const [addrSearching, setAddrSearching] = useState(false);
  const addrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  useEffect(() => {
    setStep(1);
    setForm(BLANK);
    setSubmitError(null);
    setPinCoords(null);
    setReverseAddr("");
    setAddrQuery("");
    setAddrSuggestions([]);
    progressAnim.setValue(1 / TOTAL_STEPS);
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const animateStep = useCallback(
    (direction: 1 | -1, nextStep: number) => {
      Haptics.selectionAsync();
      Animated.timing(slideX, {
        toValue: -direction * W,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        slideX.setValue(direction * W);
        Animated.spring(slideX, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      });
    },
    [slideX]
  );

  function goNext() {
    if (step < TOTAL_STEPS) animateStep(1, step + 1);
  }

  function goBack() {
    if (step > 1) animateStep(-1, step - 1);
  }

  function stepValid(s: number): boolean {
    if (s === 1) return form.category !== "";
    if (s === 2) return form.locationLat !== null;
    if (s === 3) return form.placeName.trim().length > 0 && form.note.trim().length >= 3;
    return true;
  }

  const handlePickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== "granted") {
        Alert.alert("Permission required", "Allow photo access to add photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"] as any,
        allowsMultipleSelection: true,
        selectionLimit: 5 - form.imageUris.length,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.length) return;
      setForm((f) => ({
        ...f,
        imageUris: [...f.imageUris, ...result.assets.map((a) => a.uri)].slice(0, 5),
      }));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not open photo library.");
    }
  }, [form.imageUris.length]);

  async function confirmMapPin() {
    const lat = mapRegionRef.current.latitude;
    const lng = mapRegionRef.current.longitude;
    setPinCoords({ lat, lng });
    setIsReverseGeocoding(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const parts = [place.name, place.street, place.district].filter(Boolean);
      const addr = parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setReverseAddr(addr);
      setForm((f) => ({ ...f, locationLat: lat, locationLng: lng, locationText: addr, placeName: place.name || addr }));
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setReverseAddr(fallback);
      setForm((f) => ({ ...f, locationLat: lat, locationLng: lng, locationText: fallback, placeName: fallback }));
    } finally {
      setIsReverseGeocoding(false);
    }
  }

  function handleAddrChange(text: string) {
    setAddrQuery(text);
    if (addrTimerRef.current) clearTimeout(addrTimerRef.current);
    if (text.trim().length < 3) { setAddrSuggestions([]); return; }
    addrTimerRef.current = setTimeout(async () => {
      setAddrSearching(true);
      const results = await searchNominatim(text);
      setAddrSuggestions(results);
      setAddrSearching(false);
    }, 400);
  }

  function selectSuggestion(s: AddressSuggestion) {
    setAddrQuery(s.shortName || s.displayName);
    setAddrSuggestions([]);
    const newRegion = { latitude: s.lat, longitude: s.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    mapViewRef.current?.animateToRegion(newRegion, 400);
    mapRegionRef.current = newRegion;
    setForm((f) => ({ ...f, locationLat: s.lat, locationLng: s.lng, locationText: s.shortName || s.displayName, placeName: s.shortName || s.displayName }));
    setPinCoords({ lat: s.lat, lng: s.lng });
    setReverseAddr(s.shortName || s.displayName);
    setLocationTab("map");
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const inserted = await addPlace({
        category: form.category,
        place_name: form.placeName.trim() || undefined,
        location_lat: form.locationLat!,
        location_lng: form.locationLng!,
        note: form.note.trim(),
      });
      if (inserted && user && form.imageUris.length > 0) {
        await Promise.all(
          form.imageUris.map((uri) => uploadFavouriteImage(user.id, inserted.id, uri)),
        ).catch((e) => console.warn("[FavWizard] image upload error:", e?.message));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to save spot.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  function renderStep() {
    const cat = CATEGORIES.find((c) => c.id === form.category);

    switch (step) {
      case 1:
        return (
          <ScrollView
            style={styles.stepScroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.stepHint}>What kind of place is it?</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => {
                const active = form.category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setForm((f) => ({ ...f, category: c.id }))}
                    style={styles.catCell}
                    activeOpacity={0.8}
                  >
                    {active ? (
                      <LinearGradient
                        colors={c.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.catCardActive}
                      >
                        <c.Icon size={22} color="#fff" strokeWidth={2.5} />
                        <Text style={[styles.catLabel, { color: "#fff" }]}>{c.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.catCardInactive}>
                        <c.Icon size={22} color={C.textSecondary} strokeWidth={2} />
                        <Text style={[styles.catLabel, { color: C.textSecondary }]}>{c.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <View style={styles.locStep}>
            {/* Tab switcher */}
            <View style={styles.tabRow}>
              {(["map", "search"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tab, locationTab === t && styles.tabActive]}
                  onPress={() => setLocationTab(t)}
                >
                  <Text style={[styles.tabText, locationTab === t && styles.tabTextActive]}>
                    {t === "map" ? "📍 Tap Map" : "🔍 Search"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {locationTab === "map" ? (
              <View style={styles.mapWrap}>
                <MapView
                  ref={mapViewRef}
                  style={styles.miniMap}
                  initialRegion={SINGAPORE}
                  onRegionChange={(r) => { mapRegionRef.current = r; }}
                  showsUserLocation
                  showsCompass={false}
                >
                  {pinCoords && (
                    <Marker
                      coordinate={{ latitude: pinCoords.lat, longitude: pinCoords.lng }}
                      pinColor="#7C3AED"
                    />
                  )}
                </MapView>
                {/* Crosshair */}
                <View style={styles.crosshair} pointerEvents="none">
                  <View style={styles.crosshairV} />
                  <View style={styles.crosshairH} />
                  <View style={styles.crosshairDot} />
                </View>
                <TouchableOpacity
                  style={styles.confirmPinBtn}
                  onPress={confirmMapPin}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={C.Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.confirmPinGrad}
                  >
                    {isReverseGeocoding ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <MapPin size={14} color="#fff" strokeWidth={2.5} />
                    )}
                    <Text style={styles.confirmPinText}>
                      {isReverseGeocoding ? "Geocoding…" : "Pin This Location"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.searchPanel}>
                <View style={styles.searchBox}>
                  <Search size={16} color={C.textTertiary} strokeWidth={2} />
                  <TextInput
                    value={addrQuery}
                    onChangeText={handleAddrChange}
                    placeholder="Search for a place…"
                    placeholderTextColor={C.textTertiary}
                    style={styles.searchInput}
                    autoFocus
                  />
                  {addrSearching && <ActivityIndicator size="small" color={C.accent} />}
                </View>
                <ScrollView style={styles.suggestionList} keyboardShouldPersistTaps="handled">
                  {addrSuggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionRow}
                      onPress={() => selectSuggestion(s)}
                    >
                      <MapPin size={13} color={C.accent} strokeWidth={2} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggShort} numberOfLines={1}>{s.shortName || s.displayName}</Text>
                        <Text style={styles.suggFull} numberOfLines={1}>{s.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {reverseAddr ? (
              <View style={styles.addrConfirmed}>
                <MapPin size={13} color={C.accentGreen} strokeWidth={2.5} />
                <Text style={styles.addrConfirmedText} numberOfLines={2}>{reverseAddr}</Text>
              </View>
            ) : null}
          </View>
        );

      case 3:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.stepScroll}
              contentContainerStyle={styles.stepContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Photos ── */}
              <Text style={styles.stepHint}>Add photos 📸</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoRow}
              >
                {form.imageUris.map((uri, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri }} style={styles.photoThumbImg} />
                    <TouchableOpacity
                      style={styles.photoRemove}
                      onPress={() =>
                        setForm((f) => ({
                          ...f,
                          imageUris: f.imageUris.filter((_, j) => j !== i),
                        }))
                      }
                    >
                      <X size={10} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.imageUris.length < 5 && (
                  <TouchableOpacity style={styles.photoAdd} onPress={handlePickImage}>
                    <ImagePlus size={20} color={C.textTertiary} strokeWidth={1.8} />
                    <Text style={styles.photoAddText}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* ── Name (required) ── */}
              <Text style={[styles.stepHint, { marginTop: 20 }]}>
                Name this spot <Text style={{ color: C.error }}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={form.placeName}
                  onChangeText={(t) => setForm((f) => ({ ...f, placeName: t }))}
                  placeholder="e.g. MacRitchie Trailhead, Haji Lane…"
                  placeholderTextColor={C.textTertiary}
                  style={styles.textInput}
                  returnKeyType="next"
                />
              </View>

              {/* ── Note ── */}
              <Text style={[styles.stepHint, { marginTop: 20 }]}>
                What do you love about it? ✨ <Text style={{ color: C.error }}>*</Text>
              </Text>
              <Text style={styles.noteSubHint}>
                This shows as a speech bubble on the map
              </Text>
              <View style={[styles.inputWrap, styles.noteInputWrap]}>
                <TextInput
                  value={form.note}
                  onChangeText={(t) => setForm((f) => ({ ...f, note: t.slice(0, 120) }))}
                  placeholder={'"I love running here at night, the skyline is 🔥"'}
                  placeholderTextColor={C.textTertiary}
                  style={[styles.textInput, styles.noteInput]}
                  multiline
                  maxLength={120}
                />
                <Text style={styles.charCount}>{form.note.length}/120</Text>
              </View>

              {/* Preview bubble */}
              {form.note.trim().length > 0 && cat && (
                <View style={styles.previewWrap}>
                  <Text style={styles.previewLabel}>Map preview</Text>
                  <View style={[styles.previewBubble, { borderColor: cat.gradient[0] + "45" }]}>
                    <LinearGradient
                      colors={cat.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.previewAccent}
                    />
                    <View style={styles.previewContent}>
                      <cat.Icon size={12} color={cat.gradient[0]} strokeWidth={2.5} />
                      <Text style={styles.previewText} numberOfLines={1}>
                        {form.note.trim()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        );

      case 4: {
        const catFull = CATEGORIES.find((c) => c.id === form.category);
        return (
          <ScrollView
            style={styles.stepScroll}
            contentContainerStyle={styles.stepContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.reviewTitle}>Looking good! 🎉</Text>

            {catFull && (
              <View style={styles.reviewCard}>
                <LinearGradient
                  colors={catFull.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reviewCatIcon}
                >
                  <catFull.Icon size={22} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
                <View style={styles.reviewCardBody}>
                  <Text style={styles.reviewCatLabel}>{catFull.label}</Text>
                  {form.placeName ? (
                    <Text style={styles.reviewPlaceName}>{form.placeName}</Text>
                  ) : null}
                </View>
              </View>
            )}

            {form.locationText ? (
              <View style={styles.reviewRow}>
                <MapPin size={14} color={C.accent} strokeWidth={2.5} />
                <Text style={styles.reviewRowText}>{form.locationText}</Text>
              </View>
            ) : null}

            {form.note ? (
              <View style={styles.reviewNoteCard}>
                <Text style={styles.reviewNoteLabel}>Your note</Text>
                <Text style={styles.reviewNote}>💬 {form.note}</Text>
              </View>
            ) : null}

            {submitError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{submitError}</Text>
              </View>
            ) : null}
          </ScrollView>
        );
      }

      default:
        return null;
    }
  }

  const canProceed = stepValid(step);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={step === 1 ? onClose : goBack}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          {step === 1 ? (
            <X size={20} color={C.textPrimary} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerStep}>
            Step {step} of {TOTAL_STEPS}
          </Text>
          <Text style={styles.headerTitle}>{STEP_LABELS[step - 1]}</Text>
        </View>

        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>{step}/{TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Step content */}
      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
        {renderStep()}
      </Animated.View>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            onPress={goNext}
            disabled={!canProceed}
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canProceed ? C.Gradients.primary : (["#D1D5DB", "#C4C9D4"] as any)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtnGrad}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtnGrad}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={16} color="#fff" strokeWidth={3} />
                  <Text style={styles.nextBtnText}>Save Favourite Spot ⭐</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: FAV_WIZARD_HEIGHT,
    backgroundColor: C.surface,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1C8E8",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    gap: 1,
  },
  headerStep: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  stepPill: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepPillText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#EDE9FE",
    marginHorizontal: 20,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 99,
  },
  stepWrap: {
    flex: 1,
  },

  // Step scroll wrapper
  stepScroll: { flex: 1 },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  stepHint: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginBottom: 14,
  },
  noteSubHint: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    marginTop: -10,
    marginBottom: 10,
  },

  // Category grid
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catCell: {
    width: (W - 40 - 10) / 2,
  },
  catCardActive: {
    borderRadius: C.Radii.lg,
    padding: 16,
    gap: 8,
    alignItems: "flex-start",
  },
  catCardInactive: {
    borderRadius: C.Radii.lg,
    padding: 16,
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#F8F5FF",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
  },
  catLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
  },

  // Location step
  locStep: { flex: 1 },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: C.Radii.lg,
    backgroundColor: "#F0EDF8",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: C.accentMuted,
    borderWidth: 1.5,
    borderColor: C.accent + "40",
  },
  tabText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  tabTextActive: { color: C.accent },
  mapWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    position: "relative",
  },
  miniMap: { flex: 1 },
  crosshair: {
    ...StyleSheet.absoluteFillObject as any,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairV: {
    position: "absolute",
    width: 1.5,
    height: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 1,
  },
  crosshairH: {
    position: "absolute",
    height: 1.5,
    width: 24,
    backgroundColor: "#7C3AED",
    borderRadius: 1,
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#fff",
  },
  confirmPinBtn: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: C.Radii.lg,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmPinGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  confirmPinText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
  searchPanel: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
  },
  searchInput: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  suggestionList: { flex: 1 },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF8",
  },
  suggShort: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  suggFull: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    marginTop: 1,
  },
  addrConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: "#D1FAE5",
    borderRadius: C.Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addrConfirmedText: {
    flex: 1,
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: "#065F46",
  },

  // Note step
  inputWrap: {
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.lg,
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
  },
  textInput: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteInputWrap: {},
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
    paddingBottom: 32,
  },
  charCount: {
    position: "absolute",
    bottom: 8,
    right: 12,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
  previewWrap: {
    marginTop: 20,
    gap: 8,
  },
  previewLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewBubble: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    alignSelf: "flex-start",
    maxWidth: "100%",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  previewAccent: { width: 4, alignSelf: "stretch" },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  previewText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#332F3A",
    maxWidth: W - 120,
  },

  // Review step
  reviewTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    marginBottom: 20,
  },
  reviewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
  },
  reviewCatIcon: {
    width: 52,
    height: 52,
    borderRadius: C.Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCardBody: { flex: 1, gap: 3 },
  reviewCatLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reviewPlaceName: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  reviewRowText: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    lineHeight: C.FontSizes.sm * 1.5,
  },
  reviewNoteCard: {
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.xl,
    padding: 16,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  reviewNoteLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  reviewNote: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    lineHeight: C.FontSizes.base * 1.6,
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: C.Radii.lg,
    padding: 14,
    marginTop: 12,
  },
  errorText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.error,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  nextBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  nextBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  nextBtnText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },

  // ── Photo picker ──
  photoRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 4,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: C.Radii.lg,
    overflow: "hidden",
    position: "relative",
  },
  photoThumbImg: {
    width: "100%",
    height: "100%",
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: C.Radii.lg,
    backgroundColor: "#F8F5FF",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoAddText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
});
