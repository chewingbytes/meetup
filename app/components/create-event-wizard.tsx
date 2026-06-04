/**
 * CreateEventWizard
 *
 * Step-by-step event creation flow rendered as a full-screen overlay.
 *
 * Steps:
 *  1 — Basics   (title, community, cover)
 *  2 — When     (start/end date + time)
 *  3 — Where    (map-pin drop OR Nominatim address search)
 *  4 — Details  (description, capacity, paid, approval)
 *  5 — Review   (summary → launch)
 *
 * Coordinates requirement:
 *   Events need location_lat + location_lng to show as map pins.
 *   This wizard collects those via MapView tap (step 3).
 *   The existing createEvent API payload is extended with
 *   location_lat + location_lng fields.
 */

import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { createEvent as createEventApi, getCommunities } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { useEventStore } from "@/lib/stores/eventStore";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  MapPin,
  Search,
  Upload,
  Users,
  X,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");

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
  communityId: string | null;
  cover: string | null;
  startDate: Date | null;      // which day (today … +6 days)
  startAnytime: boolean;       // true = no specific time
  startTime: Date | null;      // only used when !startAnytime
  locationLat: number | null;
  locationLng: number | null;
  locationText: string;
  locationInstructions: string;
  description: string;
  requireApproval: boolean;
  isPaid: boolean;
  price: string;
  isPublic: boolean;
  unlimited: boolean;
  capacity: string;
}

const BLANK: WizardForm = {
  name: "",
  communityId: null,
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
  isPaid: false,
  price: "0",
  isPublic: true,
  unlimited: true,
  capacity: "",
};

const TOTAL_STEPS = 5;
const STEP_LABELS = ["BASICS", "WHEN", "WHERE", "DETAILS", "REVIEW"];

// ── Nominatim geocode search (no API key needed) ──────────────────────────────
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
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventWizard({
  visible,
  onClose,
  onSuccess,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(BLANK);
  const [communities, setCommunities] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // time picker modal (date is chosen via 7-day chips; only need a time modal)
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState<Date>(new Date());

  // location step state
  const [locationTab, setLocationTab] = useState<"map" | "search">("map");
  // Uncontrolled map: read position via ref, not state (avoids stale-closure issues)
  const mapViewRef = useRef<any>(null);
  const mapRegionRef = useRef(SINGAPORE);
  const [pinCoords, setPinCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [reverseAddr, setReverseAddr] = useState<string>("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [addrQuery, setAddrQuery] = useState("");
  const [addrSuggestions, setAddrSuggestions] = useState<AddressSuggestion[]>([]);
  const [addrSearching, setAddrSearching] = useState(false);
  const addrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // slide animation between steps
  const slideX = useRef(new Animated.Value(0)).current;

  // Load communities when wizard opens
  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setForm(BLANK);
    setSubmitError(null);
    setPinCoords(null);
    setAddrQuery("");
    setAddrSuggestions([]);

    getCommunities()
      .then((data: any) => {
        const list = Array.isArray(data) ? data : data?.communities ?? [];
        setCommunities(list);
      })
      .catch(() => setCommunities([]));
  }, [visible]);

  // Animate to next/prev step
  const animateStep = useCallback(
    (direction: 1 | -1, nextStep: number) => {
      const outTo = -direction * W;
      Animated.timing(slideX, {
        toValue: outTo,
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

  // ── Validation per step ───────────────────────────────────────────────────
  function stepValid(s: number): boolean {
    if (s === 1)
      return form.name.trim().length >= 3 && form.communityId !== null;
    if (s === 2)
      return form.startDate !== null && (form.startAnytime || form.startTime !== null);
    if (s === 3) return form.locationLat !== null;
    if (s === 4) return form.description.trim().length >= 10;
    return true;
  }

  // ── Map pin drop ─────────────────────────────────────────────────────────
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
      const addr = [
        place.name,
        place.street,
        place.subregion,
        place.city,
      ]
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

  // ── Nominatim address search ──────────────────────────────────────────────
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

  // ── Image picker ─────────────────────────────────────────────────────────
  async function pickCover() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!r.canceled) setForm((f) => ({ ...f, cover: r.assets[0].uri }));
  }

  // ── Time picker helpers ───────────────────────────────────────────────────
  function openTimePicker() {
    setTempTime(form.startTime ?? new Date());
    setShowTimePicker(true);
  }

  function confirmTime() {
    setForm((f) => ({ ...f, startTime: tempTime }));
    setShowTimePicker(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const community = communities.find((c) => c.id === form.communityId);
      if (!community) throw new Error("Community not found.");

      // Build start_at from chosen day + time (or start of day if anytime)
      let start_at: string | undefined;
      let end_at: string | undefined;
      if (form.startDate) {
        const d = new Date(form.startDate);
        if (!form.startAnytime && form.startTime) {
          d.setHours(form.startTime.getHours(), form.startTime.getMinutes(), 0, 0);
        } else {
          d.setHours(0, 0, 0, 0);
        }
        start_at = d.toISOString();
        const endD = new Date(form.startDate);
        endD.setHours(23, 59, 0, 0);
        end_at = endD.toISOString();
      }

      const payload: any = {
        communityId: community.id,
        organizerId: user?.id ?? null,
        name: form.name.trim(),
        cover_url: form.cover ?? undefined,
        start_at,
        end_at,
        location_text: form.locationText,
        location_lat: form.locationLat,
        location_lng: form.locationLng,
        location_instructions: form.locationInstructions.trim() || undefined,
        description: form.description,
        require_approval: form.requireApproval,
        is_paid: form.isPaid,
        price: form.isPaid ? Number(form.price) : 0,
        visibility: form.isPublic ? "public" : "private",
        capacity: form.unlimited ? null : Number(form.capacity) || null,
      };

      await createEventApi(payload);

      // Force-refresh the event store so the new pin appears immediately
      const { fetchEvents } = useEventStore.getState();
      await fetchEvents(true);

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
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function fmtStartTime() {
    if (form.startAnytime) return "Anytime";
    if (!form.startTime) return "—";
    return form.startTime.toLocaleTimeString("en-SG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ── Render each step ──────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1:
        return <Step1Basics form={form} setForm={setForm} communities={communities} pickCover={pickCover} />;
      case 2:
        return (
          <Step2When
            form={form}
            setForm={setForm}
            onOpenTimePicker={openTimePicker}
          />
        );
      case 3:
        return (
          <Step3Where
            form={form}
            locationTab={locationTab}
            setLocationTab={setLocationTab}
            mapViewRef={mapViewRef}
            onRegionChange={(r: any) => { mapRegionRef.current = r; }}
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
      case 4:
        return <Step4Details form={form} setForm={setForm} />;
      case 5:
        return (
          <Step5Review
            form={form}
            communities={communities}
            startDateStr={fmtStartDate()}
            startTimeStr={fmtStartTime()}
            submitError={submitError}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 1 ? onClose : goBack} style={styles.headerBtn}>
            {step === 1 ? (
              <X size={20} color="#000" strokeWidth={3} />
            ) : (
              <ChevronLeft size={20} color="#000" strokeWidth={3} />
            )}
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{STEP_LABELS[step - 1]}</Text>
            <View style={styles.stepDots}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]}
                />
              ))}
            </View>
          </View>

          <View style={styles.headerBtn}>
            <Text style={styles.stepCounter}>{step}/{TOTAL_STEPS}</Text>
          </View>
        </View>

        {/* ── Step content ── */}
        <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideX }] }]}>
          {renderStep()}
        </Animated.View>

        {/* ── Footer nav ── */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              onPress={goNext}
              disabled={!stepValid(step)}
              style={[styles.nextBtn, !stepValid(step) && styles.nextBtnDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>
                NEXT: {STEP_LABELS[step] ?? "REVIEW"}
              </Text>
              <ChevronRight size={18} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.launchBtn, isSubmitting && styles.launchBtnDisabled]}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <NeoButtonLoader color="#000" />
              ) : (
                <>
                  <Check size={20} color="#000" strokeWidth={3} />
                  <Text style={styles.launchBtnText}>LAUNCH EVENT</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Time picker modal — shown over the wizard */}
        <Modal visible={showTimePicker} transparent animationType="fade">
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerSheet}>
              <View style={styles.timePickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.timePickerBtn}>
                  <Text style={styles.timePickerCancel}>CANCEL</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerTitle}>SET TIME</Text>
                <TouchableOpacity onPress={confirmTime} style={styles.timePickerBtn}>
                  <Text style={styles.timePickerDone}>DONE</Text>
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
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Step1Basics({
  form,
  setForm,
  communities,
  pickCover,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  communities: { id: string; name: string }[];
  pickCover: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={stepStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Cover image */}
      <TouchableOpacity onPress={pickCover} style={stepStyles.coverPicker} activeOpacity={0.8}>
        {form.cover ? (
          <Image source={{ uri: form.cover }} style={stepStyles.coverImage} resizeMode="cover" />
        ) : (
          <View style={stepStyles.coverPlaceholder}>
            <Camera size={32} color="#000" strokeWidth={2.5} />
            <Text style={stepStyles.coverPlaceholderText}>ADD COVER IMAGE</Text>
            <Text style={stepStyles.coverPlaceholderSub}>Optional — 16:9 recommended</Text>
          </View>
        )}
        {form.cover && (
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); setForm((f) => ({ ...f, cover: null })); }}
            style={stepStyles.coverRemove}
          >
            <X size={14} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Label>Event Title *</Label>
      <TextInput
        value={form.name}
        onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
        placeholder="e.g. Friday Night Rooftop"
        placeholderTextColor="#999"
        style={stepStyles.textInput}
        autoCapitalize="words"
      />
      {form.name.trim().length > 0 && form.name.trim().length < 3 && (
        <Text style={stepStyles.hint}>Min 3 characters</Text>
      )}

      <Label>Host Community *</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {communities.length === 0 ? (
          <View style={stepStyles.noCommunityCard}>
            <Text style={stepStyles.noCommunityText}>No communities found</Text>
          </View>
        ) : (
          communities.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setForm((f) => ({ ...f, communityId: c.id }))}
              style={[
                stepStyles.communityPill,
                form.communityId === c.id && stepStyles.communityPillActive,
              ]}
            >
              <Text
                style={[
                  stepStyles.communityPillText,
                  form.communityId === c.id && stepStyles.communityPillTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ScrollView>
  );
}

function Step2When({
  form,
  setForm,
  onOpenTimePicker,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  onOpenTimePicker: () => void;
}) {
  // Generate today + next 6 days
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

  const selectedDay = form.startDate;

  return (
    <ScrollView contentContainerStyle={stepStyles.scroll} showsVerticalScrollIndicator={false}>
      <Label>Pick a Day</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {days.map((day, i) => {
          const isSelected = selectedDay ? isSameDay(selectedDay, day) : false;
          const isToday = i === 0;
          const dayName = isToday
            ? "TODAY"
            : day.toLocaleDateString("en-SG", { weekday: "short" }).toUpperCase();
          const dayNum = day.getDate();
          const monthName = day.toLocaleDateString("en-SG", { month: "short" }).toUpperCase();

          return (
            <TouchableOpacity
              key={i}
              onPress={() => setForm((f) => ({ ...f, startDate: day }))}
              style={[step2Styles.dayChip, isSelected && step2Styles.dayChipSelected]}
              activeOpacity={0.8}
            >
              <Text style={[step2Styles.dayName, isSelected && step2Styles.dayNameSelected]}>
                {dayName}
              </Text>
              <Text style={[step2Styles.dayNum, isSelected && step2Styles.dayNumSelected]}>
                {dayNum}
              </Text>
              <Text style={[step2Styles.dayMonth, isSelected && step2Styles.dayMonthSelected]}>
                {monthName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Label>Start Time</Label>
      <View style={step2Styles.timeToggle}>
        <TouchableOpacity
          onPress={() => setForm((f) => ({ ...f, startAnytime: true }))}
          style={[step2Styles.timeOption, form.startAnytime && step2Styles.timeOptionActive]}
          activeOpacity={0.8}
        >
          <Text style={[step2Styles.timeOptionText, form.startAnytime && step2Styles.timeOptionTextActive]}>
            ANYTIME
          </Text>
          <Text style={[step2Styles.timeOptionSub, form.startAnytime && { color: "#000" }]}>
            No fixed time
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setForm((f) => ({ ...f, startAnytime: false }))}
          style={[step2Styles.timeOption, !form.startAnytime && step2Styles.timeOptionActive]}
          activeOpacity={0.8}
        >
          <Text style={[step2Styles.timeOptionText, !form.startAnytime && step2Styles.timeOptionTextActive]}>
            SPECIFIC
          </Text>
          <Text style={[step2Styles.timeOptionSub, !form.startAnytime && { color: "#000" }]}>
            Set a time
          </Text>
        </TouchableOpacity>
      </View>

      {!form.startAnytime && (
        <TouchableOpacity
          onPress={onOpenTimePicker}
          style={step2Styles.timeBtn}
          activeOpacity={0.8}
        >
          <Clock size={18} color="#000" strokeWidth={3} />
          <Text style={step2Styles.timeBtnText}>
            {form.startTime
              ? form.startTime.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })
              : "TAP TO SET TIME"}
          </Text>
        </TouchableOpacity>
      )}

      {selectedDay && (
        <View style={stepStyles.successCard}>
          <Check size={14} color="#000" strokeWidth={3} />
          <Text style={stepStyles.successText}>
            {selectedDay.toLocaleDateString("en-SG", { weekday: "long", month: "long", day: "numeric" })}
            {!form.startAnytime && form.startTime
              ? ` at ${form.startTime.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}`
              : " — Anytime"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Step3Where({
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
  const MAP_HEIGHT = H * 0.42;

  return (
    <View style={{ flex: 1 }}>
      {/* Tab selector */}
      <View style={step3Styles.tabs}>
        <TouchableOpacity
          onPress={() => setLocationTab("map")}
          style={[step3Styles.tab, locationTab === "map" && step3Styles.tabActive]}
        >
          <MapPin size={14} color={locationTab === "map" ? "#fff" : "#000"} strokeWidth={3} />
          <Text style={[step3Styles.tabText, locationTab === "map" && step3Styles.tabTextActive]}>
            DROP PIN
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setLocationTab("search")}
          style={[step3Styles.tab, locationTab === "search" && step3Styles.tabActive]}
        >
          <Search size={14} color={locationTab === "search" ? "#fff" : "#000"} strokeWidth={3} />
          <Text style={[step3Styles.tabText, locationTab === "search" && step3Styles.tabTextActive]}>
            SEARCH ADDRESS
          </Text>
        </TouchableOpacity>
      </View>

      {locationTab === "map" ? (
        <View style={{ flex: 1 }}>
          {/* Map with crosshair */}
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
                  coordinate={{ latitude: pinCoords.lat, longitude: pinCoords.lng }}
                  tracksViewChanges={false}
                >
                  <View style={step3Styles.confirmedPin}>
                    <MapPin size={20} color="#FF6B6B" strokeWidth={3} />
                  </View>
                </Marker>
              )}
            </MapView>

            {/* Crosshair */}
            <View style={step3Styles.crosshairWrap} pointerEvents="none">
              <View style={step3Styles.crosshairH} />
              <View style={step3Styles.crosshairV} />
              <View style={step3Styles.crosshairCenter} />
            </View>

            {/* Instruction badge */}
            <View style={step3Styles.mapHint}>
              <Text style={step3Styles.mapHintText}>DRAG MAP TO POSITION</Text>
            </View>
          </View>

          {/* Confirm button + reverse geocode result */}
          <View style={step3Styles.confirmArea}>
            {reverseAddr ? (
              <View style={step3Styles.addrResult}>
                <MapPin size={12} color="#FF6B6B" strokeWidth={3} />
                <Text style={step3Styles.addrResultText} numberOfLines={2}>
                  {reverseAddr}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setForm((f) => ({ ...f, locationLat: null, locationLng: null, locationText: "" }));
                  }}
                >
                  <X size={14} color="#666" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={onConfirmPin}
              disabled={isReverseGeocoding}
              style={step3Styles.confirmBtn}
              activeOpacity={0.85}
            >
              {isReverseGeocoding ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Check size={16} color="#000" strokeWidth={3} />
                  <Text style={step3Styles.confirmBtnText}>
                    {form.locationLat ? "UPDATE PIN" : "SET THIS LOCATION"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              value={form.locationInstructions}
              onChangeText={(t) => setForm((f) => ({ ...f, locationInstructions: t }))}
              placeholder="Optional: directions, landmark, floor..."
              placeholderTextColor="#aaa"
              style={step3Styles.instructionsInput}
              multiline
            />
          </View>
        </View>
      ) : (
        /* ── Address search tab ── */
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={step3Styles.searchScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={step3Styles.searchInputWrap}>
              <Search size={16} color="#000" strokeWidth={3} />
              <TextInput
                value={addrQuery}
                onChangeText={onAddrChange}
                placeholder="Type an address or place name..."
                placeholderTextColor="#aaa"
                style={step3Styles.searchInput}
                autoFocus
              />
              {addrSearching && <ActivityIndicator color="#000" size="small" />}
            </View>

            {addrSuggestions.length > 0 && (
              <View style={step3Styles.suggestionList}>
                {addrSuggestions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => onSelectSuggestion(s)}
                    style={[
                      step3Styles.suggestionItem,
                      i < addrSuggestions.length - 1 && step3Styles.suggestionBorder,
                    ]}
                  >
                    <MapPin size={12} color="#FF6B6B" strokeWidth={2.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={step3Styles.suggestionName} numberOfLines={1}>
                        {s.shortName || s.displayName}
                      </Text>
                      <Text style={step3Styles.suggestionFull} numberOfLines={1}>
                        {s.displayName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {form.locationLat !== null && (
              <View style={step3Styles.selectedAddr}>
                <Check size={14} color="#000" strokeWidth={3} />
                <Text style={step3Styles.selectedAddrText} numberOfLines={2}>
                  {form.locationText}
                </Text>
              </View>
            )}

            <TextInput
              value={form.locationInstructions}
              onChangeText={(t) => setForm((f) => ({ ...f, locationInstructions: t }))}
              placeholder="Optional: directions, landmark, floor..."
              placeholderTextColor="#aaa"
              style={step3Styles.instructionsInput}
              multiline
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function Step4Details({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
}) {
  return (
    <ScrollView
      contentContainerStyle={stepStyles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Label>Description * (min 10 chars)</Label>
      <TextInput
        value={form.description}
        onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
        placeholder="What's the vibe? Markdown supported."
        placeholderTextColor="#aaa"
        style={[stepStyles.textInput, { minHeight: 120, textAlignVertical: "top" }]}
        multiline
      />
      {form.description.trim().length > 0 && form.description.trim().length < 10 && (
        <Text style={stepStyles.hint}>At least 10 characters required</Text>
      )}

      <ToggleRow
        label="Require Approval"
        value={form.requireApproval}
        onToggle={() => setForm((f) => ({ ...f, requireApproval: !f.requireApproval }))}
        color="#C4B5FD"
      />

      <ToggleRow
        label="Paid Event"
        value={form.isPaid}
        onToggle={() => setForm((f) => ({ ...f, isPaid: !f.isPaid }))}
        color="#FFD93D"
      />

      {form.isPaid && (
        <View style={stepStyles.priceRow}>
          <DollarSign size={18} color="#000" strokeWidth={2.5} />
          <TextInput
            value={form.price}
            onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
            keyboardType="decimal-pad"
            style={stepStyles.priceInput}
            placeholder="0.00"
          />
        </View>
      )}

      <Label>Visibility</Label>
      <View style={stepStyles.segmented}>
        {(["public", "private"] as const).map((opt) => {
          const active = opt === "public" ? form.isPublic : !form.isPublic;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => setForm((f) => ({ ...f, isPublic: opt === "public" }))}
              style={[stepStyles.segment, active && stepStyles.segmentActive]}
            >
              <Text style={[stepStyles.segmentText, active && stepStyles.segmentTextActive]}>
                {opt.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Label>Capacity</Label>
      <View style={stepStyles.segmented}>
        {(["unlimited", "limited"] as const).map((opt) => {
          const active = opt === "unlimited" ? form.unlimited : !form.unlimited;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => setForm((f) => ({ ...f, unlimited: opt === "unlimited" }))}
              style={[stepStyles.segment, active && stepStyles.segmentActive]}
            >
              <Text style={[stepStyles.segmentText, active && stepStyles.segmentTextActive]}>
                {opt.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!form.unlimited && (
        <View style={stepStyles.priceRow}>
          <Users size={18} color="#000" strokeWidth={2.5} />
          <TextInput
            value={form.capacity}
            onChangeText={(t) => setForm((f) => ({ ...f, capacity: t }))}
            keyboardType="number-pad"
            placeholder="Max attendees"
            style={stepStyles.priceInput}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Step5Review({
  form,
  communities,
  startDateStr,
  startTimeStr,
  submitError,
}: {
  form: WizardForm;
  communities: { id: string; name: string }[];
  startDateStr: string;
  startTimeStr: string;
  submitError: string | null;
}) {
  const community = communities.find((c) => c.id === form.communityId);

  const rows = [
    { label: "EVENT", value: form.name },
    { label: "COMMUNITY", value: community?.name ?? "—" },
    { label: "DATE", value: startDateStr },
    { label: "TIME", value: startTimeStr },
    { label: "LOCATION", value: form.locationText || "—" },
    {
      label: "COORDS",
      value:
        form.locationLat !== null
          ? `${form.locationLat.toFixed(4)}, ${form.locationLng?.toFixed(4)}`
          : "No pin set",
    },
    { label: "CAPACITY", value: form.unlimited ? "Unlimited" : form.capacity || "—" },
    { label: "VISIBILITY", value: form.isPublic ? "Public" : "Private" },
    { label: "PAID", value: form.isPaid ? `$${form.price}` : "Free" },
    { label: "APPROVAL", value: form.requireApproval ? "Required" : "Auto" },
  ];

  return (
    <ScrollView contentContainerStyle={stepStyles.scroll} showsVerticalScrollIndicator={false}>
      {/* Cover preview */}
      {form.cover && (
        <Image
          source={{ uri: form.cover }}
          style={{ width: "100%", height: 160, borderWidth: 3, borderColor: "#000", marginBottom: 16 }}
          resizeMode="cover"
        />
      )}

      <View style={reviewStyles.card}>
        <View style={reviewStyles.cardHeader}>
          <Text style={reviewStyles.cardHeaderText}>LAUNCH CHECKLIST</Text>
        </View>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={[reviewStyles.row, i < rows.length - 1 && reviewStyles.rowBorder]}
          >
            <Text style={reviewStyles.rowLabel}>{row.label}</Text>
            <Text style={reviewStyles.rowValue} numberOfLines={2}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {form.locationLat !== null && (
        <View style={reviewStyles.mapPin}>
          <MapPin size={14} color="#FF6B6B" strokeWidth={3} />
          <Text style={reviewStyles.mapPinText}>
            This event will appear as a pin on the map ✓
          </Text>
        </View>
      )}

      {form.description.trim().length > 0 && (
        <View style={reviewStyles.descCard}>
          <Text style={reviewStyles.descLabel}>DESCRIPTION PREVIEW</Text>
          <Text style={reviewStyles.descText} numberOfLines={4}>
            {form.description}
          </Text>
        </View>
      )}

      {submitError && (
        <View style={reviewStyles.errorCard}>
          <Text style={reviewStyles.errorText}>⚠ {submitError}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ── Tiny shared UI helpers ────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={stepStyles.label}>{children}</Text>;
}

function ToggleRow({
  label,
  value,
  onToggle,
  color,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity onPress={onToggle} style={stepStyles.toggleRow} activeOpacity={0.8}>
      <View style={[stepStyles.toggleDot, value && { backgroundColor: color }]} />
      <Text style={stepStyles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#ddd", true: "#000" }}
        thumbColor={value ? "#fff" : "#000"}
      />
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFDF5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFD93D",
    borderBottomWidth: 4,
    borderColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  stepDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#ccc",
    borderWidth: 1.5,
    borderColor: "#000",
  },
  dotActive: {
    backgroundColor: "#FF6B6B",
    width: 20,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: "#000",
  },
  stepCounter: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
  },
  stepWrap: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 4,
    borderColor: "#000",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFD93D",
    borderWidth: 3,
    borderColor: "#000",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  nextBtnDisabled: {
    backgroundColor: "#e5e7eb",
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  launchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  launchBtnDisabled: {
    backgroundColor: "#e5e7eb",
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  launchBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  // ── Time picker modal ──
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  timePickerSheet: {
    backgroundColor: "#000",
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
  },
  timePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 3,
    borderColor: "#000",
    backgroundColor: "#FFD93D",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timePickerBtn: {
    minWidth: 60,
  },
  timePickerCancel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  timePickerDone: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
 datetimepicker: {
    color: "#000"
  }
});

const stepStyles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  hint: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF6B6B",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  communityPill: {
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  communityPillActive: {
    backgroundColor: "#FF6B6B",
  },
  communityPillText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  communityPillTextActive: {
    color: "#000",
  },
  noCommunityCard: {
    borderWidth: 2,
    borderColor: "#ccc",
    padding: 12,
    backgroundColor: "#f5f5f5",
  },
  noCommunityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
  },
  coverPicker: {
    height: 160,
    borderWidth: 3,
    borderColor: "#000",
    borderStyle: "dashed",
    backgroundColor: "#fff",
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  coverPlaceholderText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  coverPlaceholderSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "#999",
  },
  coverRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  datePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  datePillEmpty: {
    backgroundColor: "#FFFDF5",
    borderStyle: "dashed",
  },
  datePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  errorCard: {
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
  successCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6EE7B7",
    borderWidth: 3,
    borderColor: "#000",
    padding: 10,
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  toggleLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: "#FFFDF5",
    marginBottom: 10,
    gap: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    paddingVertical: 8,
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 12,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: "#000",
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: "#FFD93D",
  },
});

const step2Styles = StyleSheet.create({
  dayChip: {
    width: 62,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 10,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  dayChipSelected: {
    backgroundColor: "#FFD93D",
    shadowOffset: { width: 4, height: 4 },
    elevation: 5,
  },
  dayName: {
    fontSize: 9,
    fontWeight: "900",
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  dayNameSelected: { color: "#000" },
  dayNum: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
    lineHeight: 26,
  },
  dayNumSelected: { color: "#000" },
  dayMonth: {
    fontSize: 9,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    marginTop: 2,
  },
  dayMonthSelected: { color: "#555" },
  timeToggle: {
    flexDirection: "row",
    borderWidth: 3,
    borderColor: "#000",
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  timeOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  timeOptionActive: {
    backgroundColor: "#000",
  },
  timeOptionText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeOptionTextActive: { color: "#FFD93D" },
  timeOptionSub: {
    fontSize: 9,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    marginTop: 2,
  },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#FFFDF5",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  timeBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});

const step3Styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 4,
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRightWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fff",
  },
  tabActive: {
    backgroundColor: "#000",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabTextActive: {
    color: "#FFD93D",
  },
  crosshairWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  crosshairH: {
    position: "absolute",
    width: 40,
    height: 2,
    backgroundColor: "#FF6B6B",
  },
  crosshairV: {
    position: "absolute",
    width: 2,
    height: 40,
    backgroundColor: "#FF6B6B",
  },
  crosshairCenter: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "#FF6B6B",
    backgroundColor: "#fff",
  },
  mapHint: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  mapHintText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  confirmedPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  confirmArea: {
    padding: 16,
    gap: 10,
    backgroundColor: "#FFFDF5",
  },
  addrResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6EE7B7",
    borderWidth: 3,
    borderColor: "#000",
    padding: 10,
  },
  addrResultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFD93D",
    borderWidth: 3,
    borderColor: "#000",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  instructionsInput: {
    borderWidth: 2,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    padding: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    minHeight: 48,
    textAlignVertical: "top",
  },
  searchScroll: {
    padding: 16,
    gap: 12,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  suggestionList: {
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 8,
  },
  suggestionBorder: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  suggestionName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
  },
  suggestionFull: {
    fontSize: 10,
    fontWeight: "500",
    color: "#888",
    marginTop: 2,
  },
  selectedAddr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6EE7B7",
    borderWidth: 3,
    borderColor: "#000",
    padding: 12,
  },
  selectedAddrText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
  },
});

const reviewStyles = StyleSheet.create({
  card: {
    borderWidth: 4,
    borderColor: "#000",
    backgroundColor: "#fff",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "#FFD93D",
    borderBottomWidth: 3,
    borderColor: "#000",
    padding: 12,
  },
  cardHeaderText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  rowLabel: {
    width: 80,
    fontSize: 9,
    fontWeight: "900",
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingTop: 2,
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  mapPin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6EE7B7",
    borderWidth: 3,
    borderColor: "#000",
    padding: 12,
    marginBottom: 12,
  },
  mapPinText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    textTransform: "uppercase",
  },
  descCard: {
    borderWidth: 3,
    borderColor: "#000",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  descLabel: {
    backgroundColor: "#C4B5FD",
    borderBottomWidth: 2,
    borderColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: "900",
    color: "#000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  descText: {
    padding: 12,
    fontSize: 13,
    fontWeight: "500",
    color: "#444",
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: "#FF6B6B",
    borderWidth: 3,
    borderColor: "#000",
    padding: 14,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#000",
    textTransform: "uppercase",
  },
});
