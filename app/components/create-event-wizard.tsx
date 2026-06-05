/**
 * CreateEventWizard — simplified 4-step event creation.
 *
 * Steps: Basics → When → Where → Review & Launch
 *
 * Removed: community picker, paid toggle, visibility toggle, capacity.
 * Description is optional. All styled with the clay design system.
 */

import { createEvent as createEventApi } from "@/lib/api";
import { CATEGORIES } from "@/utils/categories";
import { useAuth } from "@/lib/authContext";
import { useEventStore } from "@/lib/stores/eventStore";
import { C } from "@/theme/clay";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  Upload,
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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Note: Modal is kept for the internal time-picker only. The wizard root is NOT a Modal.
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.74;

const SINGAPORE = {
  latitude: 1.3521,
  longitude: 103.8198,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

interface AddressSuggestion {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
}

interface WizardForm {
  name: string;
  category: string;
  cover: string | null;
  startDate: Date | null;
  startAnytime: boolean;
  startTime: Date | null;
  locationLat: number | null;
  locationLng: number | null;
  locationText: string;
  locationInstructions: string;
  description: string;
  requireApproval: boolean;
}

const BLANK: WizardForm = {
  name: "",
  category: "",
  cover: null,
  startDate: null,
  startAnytime: true,
  startTime: null,
  locationLat: null,
  locationLng: null,
  locationText: "",
  locationInstructions: "",
  description: "",
  requireApproval: false,
};

const TOTAL_STEPS = 5;
const STEP_LABELS = ["Basics", "Type", "When", "Where", "Review"];

async function searchNominatim(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "HangoutApp/1.0" },
    });
    const data: any[] = await res.json();
    return data.map((item) => ({
      displayName: item.display_name,
      shortName: [
        item.address?.road,
        item.address?.suburb,
        item.address?.city || item.address?.town,
        item.address?.country,
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

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventWizard({ onClose, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(BLANK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const [locationTab, setLocationTab] = useState<"map" | "search">("map");
  const mapViewRef = useRef<any>(null);
  const mapRegionRef = useRef(SINGAPORE);
  const [pinCoords, setPinCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [reverseAddr, setReverseAddr] = useState<string>("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addrQuery, setAddrQuery] = useState("");
  const [addrSuggestions, setAddrSuggestions] = useState<AddressSuggestion[]>(
    [],
  );
  const [addrSearching, setAddrSearching] = useState(false);
  const addrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideX = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

  // Reset every time the component mounts (parent only renders it when opening)
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
    [slideX],
  );

  function goNext() {
    if (step < TOTAL_STEPS) animateStep(1, step + 1);
  }

  function goBack() {
    if (step > 1) animateStep(-1, step - 1);
  }

  function stepValid(s: number): boolean {
    if (s === 1) return form.name.trim().length >= 3;
    if (s === 2) return form.category !== "";
    if (s === 3)
      return (
        form.startDate !== null &&
        (form.startAnytime || form.startTime !== null)
      );
    if (s === 4) return form.locationLat !== null;
    return true; // Review step: always can launch
  }

  async function confirmMapPin() {
    const lat = mapRegionRef.current.latitude;
    const lng = mapRegionRef.current.longitude;
    setPinCoords({ lat, lng });
    setIsReverseGeocoding(true);
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      const addr = [place.name, place.street, place.subregion, place.city]
        .filter(Boolean)
        .join(", ");
      const displayAddr = addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setReverseAddr(displayAddr);
      setForm((f) => ({
        ...f,
        locationLat: lat,
        locationLng: lng,
        locationText: displayAddr,
      }));
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setReverseAddr(fallback);
      setForm((f) => ({
        ...f,
        locationLat: lat,
        locationLng: lng,
        locationText: fallback,
      }));
    } finally {
      setIsReverseGeocoding(false);
    }
  }

  function handleAddrChange(text: string) {
    setAddrQuery(text);
    if (addrTimerRef.current) clearTimeout(addrTimerRef.current);
    if (text.trim().length < 3) {
      setAddrSuggestions([]);
      return;
    }
    addrTimerRef.current = setTimeout(async () => {
      setAddrSearching(true);
      const results = await searchNominatim(text);
      setAddrSuggestions(results);
      setAddrSearching(false);
    }, 400);
  }

  function selectSuggestion(suggestion: AddressSuggestion) {
    setAddrQuery(suggestion.shortName || suggestion.displayName);
    setAddrSuggestions([]);
    const newRegion = {
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapViewRef.current?.animateToRegion(newRegion, 400);
    mapRegionRef.current = newRegion;
    setForm((f) => ({
      ...f,
      locationLat: suggestion.lat,
      locationLng: suggestion.lng,
      locationText: suggestion.shortName || suggestion.displayName,
    }));
    setPinCoords({ lat: suggestion.lat, lng: suggestion.lng });
    setReverseAddr(suggestion.shortName || suggestion.displayName);
  }

  async function pickCover() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!r.canceled) setForm((f) => ({ ...f, cover: r.assets[0].uri }));
  }

  function openTimePicker() {
    setTempTime(form.startTime ?? new Date());
    setShowTimePicker(true);
  }

  function confirmTime() {
    setForm((f) => ({ ...f, startTime: tempTime }));
    setShowTimePicker(false);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let start_at: string | undefined;
      // let end_at: string | undefined;
      // if (form.startDate) {
      //   const d = new Date(form.startDate);
      //   if (!form.startAnytime && form.startTime) {
      //     d.setHours(form.startTime.getHours(), form.startTime.getMinutes(), 0, 0);
      //   } else {
      //     d.setHours(0, 0, 0, 0);
      //   }
      //   start_at = d.toISOString();
      //   const endD = new Date(form.startDate);
      //   endD.setHours(23, 59, 0, 0);
      //   end_at = endD.toISOString();
      // }

      console.log("creating form:", form);

      const payload: any = {
        organizerId: user?.id ?? null,
        name: form.name.trim(),
        cover_url: form.cover ?? undefined,
        start_at,
        end_at: null,
        location_text: form.locationText,
        location_lat: form.locationLat,
        location_lng: form.locationLng,
        location_instructions: form.locationInstructions.trim() || undefined,
        category: form.category,
        description: form.description.trim() || undefined,
        require_approval: form.requireApproval,
        is_paid: false,
        price: 0,
        visibility: "public",
        capacity: null,
      };

      await createEventApi(payload);
      const { fetchEvents } = useEventStore.getState();
      await fetchEvents(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to create event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fmtStartDate() {
    if (!form.startDate) return "—";
    return form.startDate.toLocaleDateString("en-SG", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }

  function fmtStartTime() {
    if (form.startAnytime) return "Anytime during the day";
    if (!form.startTime) return "—";
    return form.startTime.toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <Step1Basics form={form} setForm={setForm} pickCover={pickCover} />
        );
      case 2:
        return <Step2Category form={form} setForm={setForm} />;
      case 3:
        return (
          <Step3When
            form={form}
            setForm={setForm}
            onOpenTimePicker={openTimePicker}
          />
        );
      case 4:
        return (
          <Step4Where
            form={form}
            locationTab={locationTab}
            setLocationTab={setLocationTab}
            mapViewRef={mapViewRef}
            onRegionChange={(r: any) => {
              mapRegionRef.current = r;
            }}
            pinCoords={pinCoords}
            reverseAddr={reverseAddr}
            isReverseGeocoding={isReverseGeocoding}
            onConfirmPin={confirmMapPin}
            addrQuery={addrQuery}
            addrSuggestions={addrSuggestions}
            addrSearching={addrSearching}
            onAddrChange={handleAddrChange}
            onSelectSuggestion={selectSuggestion}
            setForm={setForm}
          />
        );
      case 5:
        return (
          <Step5Review
            form={form}
            setForm={setForm}
            startDateStr={fmtStartDate()}
            startTimeStr={fmtStartTime()}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
    >
      {/* Drag handle */}
      <View style={styles.sheetHandle} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={step === 1 ? onClose : goBack}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          {step === 1 ? (
            <X size={18} color={C.textPrimary} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={18} color={C.textPrimary} strokeWidth={2.5} />
          )}
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerStep}>Step {step} of {TOTAL_STEPS}</Text>
          <Text style={styles.headerTitle}>{STEP_LABELS[step - 1]}</Text>
        </View>

        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>{step}/{TOTAL_STEPS}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth as any }]} />
      </View>

      {/* ── Step content ── */}
      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
        {renderStep()}
      </Animated.View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <Pressable
            onPress={stepValid(step) ? goNext : undefined}
            style={({ pressed }) => [
              styles.nextBtn,
              !stepValid(step) && styles.nextBtnDisabled,
              pressed && stepValid(step) && { opacity: 0.85 },
            ]}
          >
            <LinearGradient
              colors={stepValid(step) ? C.Gradients.primary : (["#E5E1F0", "#E5E1F0"] as const)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtnGrad}
            >
              <Text style={[styles.nextBtnText, !stepValid(step) && styles.nextBtnTextDisabled]}>
                Next: {STEP_LABELS[step]}
              </Text>
              <ChevronRight size={18} color={stepValid(step) ? "#fff" : C.textTertiary} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            onPress={isSubmitting ? undefined : handleSubmit}
            style={({ pressed }) => [styles.launchBtn, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.launchBtnGrad}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Check size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.launchBtnText}>Launch Hangout</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        )}
      </View>

      {/* ── Internal time-picker modal ── */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerSheet}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.timePickerActionBtn}>
                <Text style={styles.timePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>Set time</Text>
              <TouchableOpacity onPress={confirmTime} style={styles.timePickerActionBtn}>
                <Text style={styles.timePickerDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="spinner"
              onChange={(_, val) => { if (val) setTempTime(val); }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Basics
// ─────────────────────────────────────────────────────────────────────────────

function Step1Basics({
  form,
  setForm,
  pickCover,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  pickCover: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={step.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* <TouchableOpacity onPress={pickCover} style={step.coverBtn} activeOpacity={0.85}>
        {form.cover ? (
          <>
            <Image source={{ uri: form.cover }} style={step.coverImg} resizeMode="cover" />
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, cover: null })); }}
              style={step.coverRemoveBtn}
            >
              <X size={14} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        ) : (
          <LinearGradient colors={["#EDE9FE", "#F4F1FA"]} style={step.coverPlaceholder}>
            <View style={step.coverIconWrap}>
              <Upload size={24} color={C.accent} strokeWidth={2} />
            </View>
            <Text style={step.coverPlaceholderTitle}>Add cover photo</Text>
            <Text style={step.coverPlaceholderSub}>Optional · 16:9 recommended</Text>
          </LinearGradient>
        )}
      </TouchableOpacity> */}

      {/* Title */}
      <FieldLabel>hangout name *</FieldLabel>
      <TextInput
        value={form.name}
        onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
        placeholder="e.g. Friday Night Rooftop"
        placeholderTextColor={C.textTertiary}
        style={step.textInput}
        autoCapitalize="words"
        returnKeyType="done"
      />
      {form.name.trim().length > 0 && form.name.trim().length < 3 && (
        <Text style={step.hint}>At least 3 characters</Text>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Category
// ─────────────────────────────────────────────────────────────────────────────

function Step2Category({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
}) {
  return (
    <ScrollView
      contentContainerStyle={step.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={catStyles.title}>What kind of hangout is this?</Text>
      <View style={catStyles.grid}>
        {CATEGORIES.map((cat) => {
          const isSelected = form.category === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setForm((f) => ({ ...f, category: cat.id }))}
              style={catStyles.tile}
              activeOpacity={0.8}
            >
              {isSelected ? (
                <LinearGradient
                  colors={cat.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={catStyles.tileInner}
                >
                  <cat.Icon size={22} color="#fff" strokeWidth={2} />
                  <Text style={catStyles.tileLabelActive}>{cat.label}</Text>
                </LinearGradient>
              ) : (
                <View style={catStyles.tileInnerInactive}>
                  <cat.Icon size={22} color={C.textSecondary} strokeWidth={2} />
                  <Text style={catStyles.tileLabel}>{cat.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const catStyles = StyleSheet.create({
  title: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
    marginBottom: C.Space.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tile: {
    width: "48%",
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tileInner: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tileInnerInactive: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  tileLabel: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    textAlign: "center",
  },
  tileLabelActive: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: "#fff",
    textAlign: "center",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — When
// ─────────────────────────────────────────────────────────────────────────────

function Step3When({
  form,
  setForm,
  onOpenTimePicker,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  onOpenTimePicker: () => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  function isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  return (
    <ScrollView
      contentContainerStyle={step.scroll}
      showsVerticalScrollIndicator={false}
    >
      <FieldLabel>Pick a day</FieldLabel>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 24 }}
      >
        <View style={{ flexDirection: "row", gap: 10, paddingRight: 16 }}>
          {days.map((day, i) => {
            const isSelected = form.startDate
              ? isSameDay(form.startDate, day)
              : false;
            const isToday = i === 0;
            const dayLabel = isToday
              ? "Today"
              : day.toLocaleDateString("en-SG", { weekday: "short" });
            const dayNum = day.getDate();
            const monthLabel = day.toLocaleDateString("en-SG", {
              month: "short",
            });

            return (
              <TouchableOpacity
                key={i}
                onPress={() => setForm((f) => ({ ...f, startDate: day }))}
                style={[when.dayChip, isSelected && when.dayChipActive]}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={C.Gradients.primary}
                    style={when.dayChipGrad}
                  >
                    <Text style={when.dayLabelActive}>{dayLabel}</Text>
                    <Text style={when.dayNumActive}>{dayNum}</Text>
                    <Text style={when.dayMonthActive}>{monthLabel}</Text>
                  </LinearGradient>
                ) : (
                  <View style={when.dayChipInner}>
                    <Text style={when.dayLabel}>{dayLabel}</Text>
                    <Text style={when.dayNum}>{dayNum}</Text>
                    <Text style={when.dayMonth}>{monthLabel}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <FieldLabel>Start time</FieldLabel>
      <View style={when.timeToggle}>
        <TouchableOpacity
          onPress={() => setForm((f) => ({ ...f, startAnytime: true }))}
          style={[when.timeOption, form.startAnytime && when.timeOptionActive]}
          activeOpacity={0.8}
        >
          {form.startAnytime ? (
            <LinearGradient
              colors={C.Gradients.primary}
              style={when.timeOptionGrad}
            >
              <Text style={when.timeOptionTextActive}>Anytime</Text>
              <Text style={when.timeOptionSubActive}>No fixed time</Text>
            </LinearGradient>
          ) : (
            <View style={when.timeOptionInner}>
              <Text style={when.timeOptionText}>Anytime</Text>
              <Text style={when.timeOptionSub}>No fixed time</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setForm((f) => ({ ...f, startAnytime: false }))}
          style={[when.timeOption, !form.startAnytime && when.timeOptionActive]}
          activeOpacity={0.8}
        >
          {!form.startAnytime ? (
            <LinearGradient
              colors={C.Gradients.primary}
              style={when.timeOptionGrad}
            >
              <Text style={when.timeOptionTextActive}>Specific time</Text>
              <Text style={when.timeOptionSubActive}>Pick a time</Text>
            </LinearGradient>
          ) : (
            <View style={when.timeOptionInner}>
              <Text style={when.timeOptionText}>Specific time</Text>
              <Text style={when.timeOptionSub}>Pick a time</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!form.startAnytime && (
        <TouchableOpacity
          onPress={onOpenTimePicker}
          style={when.timeBtn}
          activeOpacity={0.8}
        >
          <Clock size={18} color={C.accent} strokeWidth={2} />
          <Text style={when.timeBtnText}>
            {form.startTime
              ? form.startTime.toLocaleTimeString("en-SG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Tap to set time"}
          </Text>
          <ChevronRight size={16} color={C.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      {form.startDate && (
        <View style={when.successCard}>
          <LinearGradient colors={C.Gradients.green} style={when.successGrad}>
            <Check size={14} color="#fff" strokeWidth={2.5} />
            <Text style={when.successText}>
              {form.startDate.toLocaleDateString("en-SG", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {!form.startAnytime && form.startTime
                ? ` · ${form.startTime.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`
                : " · Anytime"}
            </Text>
          </LinearGradient>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Where
// ─────────────────────────────────────────────────────────────────────────────

function Step4Where({
  form,
  locationTab,
  setLocationTab,
  mapViewRef,
  onRegionChange,
  pinCoords,
  reverseAddr,
  isReverseGeocoding,
  onConfirmPin,
  addrQuery,
  addrSuggestions,
  addrSearching,
  onAddrChange,
  onSelectSuggestion,
  setForm,
}: {
  form: WizardForm;
  locationTab: "map" | "search";
  setLocationTab: (t: "map" | "search") => void;
  mapViewRef: React.RefObject<any>;
  onRegionChange: (r: any) => void;
  pinCoords: { lat: number; lng: number } | null;
  reverseAddr: string;
  isReverseGeocoding: boolean;
  onConfirmPin: () => void;
  addrQuery: string;
  addrSuggestions: AddressSuggestion[];
  addrSearching: boolean;
  onAddrChange: (t: string) => void;
  onSelectSuggestion: (s: AddressSuggestion) => void;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
}) {
  const MAP_HEIGHT = 160;

  return (
    <View style={{ flex: 1 }}>
      {/* Tab selector */}
      <View style={where.tabs}>
        {(["map", "search"] as const).map((tab) => {
          const isActive = locationTab === tab;
          const label = tab === "map" ? "Drop pin" : "Search address";
          const Icon = tab === "map" ? MapPin : Search;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setLocationTab(tab)}
              style={[where.tab, isActive && where.tabActive]}
              activeOpacity={0.8}
            >
              {isActive ? (
                <LinearGradient
                  colors={C.Gradients.primary}
                  style={where.tabGrad}
                >
                  <Icon size={14} color="#fff" strokeWidth={2.5} />
                  <Text style={where.tabTextActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={where.tabInner}>
                  <Icon size={14} color={C.textSecondary} strokeWidth={2} />
                  <Text style={where.tabText}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {locationTab === "map" ? (
        <View style={{ flex: 1 }}>
          <View style={{ height: MAP_HEIGHT, position: "relative" }}>
            <MapView
              ref={mapViewRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={SINGAPORE}
              onRegionChangeComplete={onRegionChange}
              showsUserLocation
              showsCompass={false}
            >
              {pinCoords && (
                <Marker
                  coordinate={{
                    latitude: pinCoords.lat,
                    longitude: pinCoords.lng,
                  }}
                  tracksViewChanges={false}
                >
                  <View style={where.confirmedPin}>
                    <LinearGradient
                      colors={C.Gradients.primary}
                      style={where.pinGrad}
                    >
                      <MapPin size={16} color="#fff" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>
                </Marker>
              )}
            </MapView>
            {/* Crosshair */}
            <View style={where.crosshairWrap} pointerEvents="none">
              <View style={where.crosshairH} />
              <View style={where.crosshairV} />
              <View style={where.crosshairDot} />
            </View>
            <View style={where.mapHint}>
              <Text style={where.mapHintText}>Drag to position</Text>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={where.confirmArea}
            keyboardShouldPersistTaps="handled"
          >
            {reverseAddr ? (
              <View style={where.addrResult}>
                <MapPin size={13} color={C.accentPink} strokeWidth={2.5} />
                <Text style={where.addrResultText} numberOfLines={2}>
                  {reverseAddr}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setForm((f) => ({
                      ...f,
                      locationLat: null,
                      locationLng: null,
                      locationText: "",
                    }))
                  }
                >
                  <X size={14} color={C.textSecondary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : null}

            <Pressable
              onPress={onConfirmPin}
              disabled={isReverseGeocoding}
              style={({ pressed }) => [
                where.confirmBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={
                  form.locationLat ? C.Gradients.green : C.Gradients.primary
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={where.confirmBtnGrad}
              >
                {isReverseGeocoding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check size={16} color="#fff" strokeWidth={2.5} />
                    <Text style={where.confirmBtnText}>
                      {form.locationLat ? "Update pin" : "Set this location"}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <TextInput
              value={form.locationInstructions}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, locationInstructions: t }))
              }
              placeholder="Optional: directions, floor, landmark…"
              placeholderTextColor={C.textTertiary}
              style={where.instructionsInput}
              multiline
            />
          </ScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={where.searchScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={where.searchInputWrap}>
              <Search size={16} color={C.textSecondary} strokeWidth={2} />
              <TextInput
                value={addrQuery}
                onChangeText={onAddrChange}
                placeholder="Type an address or place…"
                placeholderTextColor={C.textTertiary}
                style={where.searchInput}
                autoFocus
              />
              {addrSearching && (
                <ActivityIndicator color={C.accent} size="small" />
              )}
            </View>

            {addrSuggestions.length > 0 && (
              <View style={where.suggestionList}>
                {addrSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => onSelectSuggestion(s)}
                    style={[
                      where.suggestionItem,
                      i < addrSuggestions.length - 1 && where.suggestionBorder,
                    ]}
                  >
                    <MapPin size={12} color={C.accentPink} strokeWidth={2.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={where.suggestionName} numberOfLines={1}>
                        {s.shortName || s.displayName}
                      </Text>
                      <Text style={where.suggestionFull} numberOfLines={1}>
                        {s.displayName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {form.locationLat !== null && (
              <View style={where.selectedAddr}>
                <LinearGradient
                  colors={C.Gradients.green}
                  style={where.selectedAddrGrad}
                >
                  <Check size={14} color="#fff" strokeWidth={2.5} />
                  <Text style={where.selectedAddrText} numberOfLines={2}>
                    {form.locationText}
                  </Text>
                </LinearGradient>
              </View>
            )}

            <TextInput
              value={form.locationInstructions}
              onChangeText={(t) =>
                setForm((f) => ({ ...f, locationInstructions: t }))
              }
              placeholder="Optional: directions, floor, landmark…"
              placeholderTextColor={C.textTertiary}
              style={where.instructionsInput}
              multiline
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Review & Launch
// ─────────────────────────────────────────────────────────────────────────────

function Step5Review({
  form,
  setForm,
  startDateStr,
  startTimeStr,
  submitError,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  startDateStr: string;
  startTimeStr: string;
  submitError: string | null;
}) {
  const rows = [
    { label: "Event", value: form.name, icon: "🎉" },
    { label: "Date", value: startDateStr, icon: "📅" },
    { label: "Time", value: startTimeStr, icon: "⏰" },
    { label: "Location", value: form.locationText || "—", icon: "📍" },
  ];

  return (
    <ScrollView
      contentContainerStyle={step.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover preview */}
      {form.cover && (
        <Image
          source={{ uri: form.cover }}
          style={review.coverPreview}
          resizeMode="cover"
        />
      )}

      {/* Summary card */}
      <View style={review.card}>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={[review.row, i < rows.length - 1 && review.rowBorder]}
          >
            <Text style={review.rowIcon}>{row.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={review.rowLabel}>{row.label}</Text>
              <Text style={review.rowValue} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Optional description */}
      <FieldLabel>Description (optional)</FieldLabel>
      <TextInput
        value={form.description}
        onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
        placeholder="Tell people what to expect…"
        placeholderTextColor={C.textTertiary}
        style={[step.textInput, { minHeight: 100, textAlignVertical: "top" }]}
        multiline
      />

      {/* Require approval toggle */}
      <View style={review.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={review.toggleLabel}>Require approval</Text>
          <Text style={review.toggleSub}>
            Review each attendee before they join
          </Text>
        </View>
        <Switch
          value={form.requireApproval}
          onValueChange={(v) => setForm((f) => ({ ...f, requireApproval: v }))}
          trackColor={{ false: "#E5E1F0", true: C.accentLight }}
          thumbColor={form.requireApproval ? C.accent : "#A78BFA"}
        />
      </View>

      {submitError && (
        <View style={review.errorCard}>
          <Text style={review.errorText}>{submitError}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={step.label}>{children}</Text>;
}

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheets
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Transparent overlay layout ──
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  overlayDismiss: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sheet: {
    backgroundColor: C.canvas,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    maxHeight: SHEET_H,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.80)",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(124,58,237,0.20)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // Keep root for legacy ref
  root: {
    flex: 1,
    backgroundColor: C.canvas,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
    backgroundColor: "rgba(244,241,250,0.98)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCenter: { flex: 1, gap: 1 },
  headerStep: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: 11,
    color: C.accent,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  stepPill: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepPillText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 12,
    color: C.accent,
  },

  // ── Progress bar ──
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(124,58,237,0.10)",
  },
  progressFill: {
    height: 3,
    backgroundColor: C.accent,
    borderRadius: 2,
  },

  // ── Step wrap ──
  stepWrap: {
    flex: 1,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: "rgba(244,241,250,0.98)",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,58,237,0.08)",
  },
  nextBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    gap: 8,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.40)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  nextBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
    letterSpacing: 0.3,
  },
  nextBtnTextDisabled: { color: C.textTertiary },

  launchBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  launchBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    gap: 10,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  launchBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.md,
    color: "#fff",
    letterSpacing: 0.3,
  },

  // ── Time picker ──
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(51,47,58,0.45)",
    justifyContent: "flex-end",
  },
  timePickerSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    paddingBottom: 32,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.08)",
  },
  timePickerActionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  timePickerCancel: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
  },
  timePickerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  timePickerDone: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },
});

// Shared step styles
const step = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: C.surface,
    borderRadius: C.Radii.lg,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 14,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    marginBottom: 8,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  hint: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    marginBottom: 8,
  },

  // Cover picker
  coverBtn: {
    marginBottom: 24,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  coverImg: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  coverPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  coverIconWrap: {
    width: 52,
    height: 52,
    borderRadius: C.Radii.full,
    backgroundColor: "rgba(124,58,237,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },
  coverPlaceholderSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  coverRemoveBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: C.Radii.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});

// When step
const when = StyleSheet.create({
  dayChip: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dayChipActive: {
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  dayChipGrad: {
    width: 64,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
    borderRadius: C.Radii.xl,
  },
  dayChipInner: {
    width: 64,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  dayLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 0.3,
  },
  dayLabelActive: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
  },
  dayNum: { fontFamily: C.Fonts.heading, fontSize: 20, color: C.textPrimary },
  dayNumActive: { fontFamily: C.Fonts.heading, fontSize: 20, color: "#fff" },
  dayMonth: { fontFamily: C.Fonts.body, fontSize: 10, color: C.textSecondary },
  dayMonthActive: {
    fontFamily: C.Fonts.body,
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
  },

  timeToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  timeOption: {
    flex: 1,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timeOptionActive: {
    shadowOpacity: 0.2,
    elevation: 5,
  },
  timeOptionGrad: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 3,
    borderRadius: C.Radii.xl,
  },
  timeOptionInner: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 3,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  timeOptionText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  timeOptionTextActive: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
  timeOptionSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  timeOptionSubActive: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: "rgba(255,255,255,0.75)",
  },

  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  timeBtnText: {
    flex: 1,
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  successCard: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: C.accentGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 4,
  },
  successGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 12,
    borderRadius: C.Radii.xl,
  },
  successText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: "#fff",
    flex: 1,
  },
});

// Where step
const where = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: { flex: 1, borderRadius: C.Radii.xl, overflow: "hidden" },
  tabActive: {},
  tabGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: C.Radii.xl,
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  tabTextActive: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },

  confirmedPin: { alignItems: "center" },
  pinGrad: {
    width: 36,
    height: 36,
    borderRadius: C.Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },

  crosshairWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairH: {
    position: "absolute",
    width: 28,
    height: 2,
    backgroundColor: C.accent,
    opacity: 0.7,
  },
  crosshairV: {
    position: "absolute",
    width: 2,
    height: 28,
    backgroundColor: C.accent,
    opacity: 0.7,
  },
  crosshairDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: "#fff",
  },

  mapHint: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: C.Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  mapHintText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: 11,
    color: C.textSecondary,
  },

  confirmArea: { padding: 16, gap: 12 },

  addrResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: C.Radii.lg,
    padding: C.Space.lg,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  addrResultText: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },

  confirmBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: C.Radii.xl,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
    borderLeftColor: "rgba(255,255,255,0.25)",
    borderRightColor: "rgba(0,0,0,0.05)",
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  confirmBtnText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },

  instructionsInput: {
    backgroundColor: C.surface,
    borderRadius: C.Radii.lg,
    paddingHorizontal: C.Space.lg,
    paddingVertical: 12,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    minHeight: 72,
    textAlignVertical: "top",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  searchScroll: { padding: 16, gap: 12 },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    paddingHorizontal: C.Space.lg,
    height: 50,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  suggestionList: {
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: C.Space.lg,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.06)",
  },
  suggestionName: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  suggestionFull: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },

  selectedAddr: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: C.accentGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedAddrGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: C.Space.lg,
    borderRadius: C.Radii.xl,
  },
  selectedAddrText: {
    flex: 1,
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: "#fff",
  },
});

// Review step
const review = StyleSheet.create({
  coverPreview: {
    width: "100%",
    height: 160,
    borderRadius: C.Radii.xl,
    marginBottom: 16,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderTopColor: "rgba(255,255,255,0.90)",
    borderLeftColor: "rgba(255,255,255,0.55)",
    borderRightColor: "rgba(255,255,255,0.20)",
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: C.Space.lg,
    gap: C.Space.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,58,237,0.06)",
  },
  rowIcon: { fontSize: 18, width: 28, textAlign: "center" },
  rowLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  rowValue: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.lg,
    gap: C.Space.lg,
    marginBottom: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  toggleLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  toggleSub: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    marginTop: 2,
  },

  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: C.Radii.lg,
    padding: C.Space.lg,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.error,
  },
});
