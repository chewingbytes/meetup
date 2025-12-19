import { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import Markdown from "react-native-markdown-display";
import { Check, X } from "lucide-react-native";

import { Picker } from "@react-native-picker/picker"; // make sure to install

// inside your component

// sample communities
const SAMPLE_COMMUNITIES = [
  "Hikers Club",
  "Photography",
  "Tech Enthusiasts",
  "Book Lovers",
];

const SINGAPORE_AREAS = [
  "Marina Bay",
  "Orchard",
  "Bugis",
  "Tiong Bahru",
  "Holland Village",
  "Sentosa",
  "Woodlands",
  "Jurong East",
];

export default function CreateEvent() {
  const router = useRouter();

  // cover + basic
  const [cover, setCover] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(
    null
  );
  const [name, setName] = useState("");
  // date/time
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<{
    field: "start" | "end" | null;
    mode: "date" | "time";
  }>({ field: null, mode: "date" });

  // location
  const [locationChoice, setLocationChoice] = useState<
    "none" | "current" | "choose" | "manual"
  >("none");
  const [chosenLocation, setChosenLocation] = useState<string>("");
  const [manualLocation, setManualLocation] = useState("");
  const [locationInstructions, setLocationInstructions] = useState("");

  // markdown description
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(false);

  // ticketing
  const [requireApproval, setRequireApproval] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("0");

  // options
  const [isPublic, setIsPublic] = useState(true);
  const [unlimited, setUnlimited] = useState(true);
  const [capacity, setCapacity] = useState<string>("");

  // misc
  const [error, setError] = useState<string | null>(null);

  async function pickCover() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!r.canceled) {
      setCover(r.assets[0].uri);
    }
  }

  function hasUnsavedChanges() {
    return (
      cover !== null ||
      name.trim() !== "" ||
      start !== null ||
      end !== null ||
      chosenLocation !== "" ||
      description.trim() !== "" ||
      locationInstructions.trim() !== "" ||
      requireApproval ||
      isPaid ||
      price !== "0" ||
      !isPublic ||
      !unlimited ||
      capacity.trim() !== ""
    );
  }

  function handleExit() {
    if (!hasUnsavedChanges()) {
      router.back();
      return;
    }

    Alert.alert(
      "Discard changes?",
      "All unsaved changes will be lost if you leave this page.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  }

  async function useCurrentLocation() {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const addr = [
        place.name,
        place.street,
        place.subregion,
        place.city,
        place.region,
      ]
        .filter(Boolean)
        .join(", ");
      setLocationChoice("current");
      setChosenLocation(
        addr || `${pos.coords.latitude}, ${pos.coords.longitude}`
      );
    } catch (e) {
      setError("Could not fetch current location.");
    }
  }

  function chooseArea(area: string) {
    setLocationChoice("choose");
    setChosenLocation(area);
  }

  function manualSetLocation(text: string) {
    setLocationChoice("manual");
    setManualLocation(text);
    setChosenLocation(text);
  }

  function showDateTime(field: "start" | "end", mode: "date" | "time") {
    setShowPicker({ field, mode });
  }

  function onChangeDateTime(event: any, selected?: Date) {
    const { field } = showPicker;
    setShowPicker({ field: null, mode: "date" });
    if (!selected) return;
    if (field === "start") setStart(selected);
    if (field === "end") setEnd(selected);
  }

  function canSubmit() {
    // required: name >= 3 chars, start & end set and start <= end, chosenLocation, description >= 10 chars
    if (name.trim().length < 3) return false;
    if (!start || !end) return false;
    if (start > end) return false;
    if (!chosenLocation) return false;
    if (description.trim().length < 10) return false;
    if (isPaid && Number(price) <= 0) return false;
    if (!unlimited && Number(capacity) <= 0) return false;
    return true;
  }

  function handleCreate() {
    if (!canSubmit()) {
      setError("Please fill required fields correctly.");
      return;
    }
    setError(null);
    const event = {
      id: `e-${Date.now()}`,
      name: name.trim(),
      cover,
      start: start!.toISOString(),
      end: end!.toISOString(),
      location: chosenLocation,
      locationInstructions: locationInstructions.trim() || undefined,
      description,
      ticketing: {
        requireApproval,
        isPaid,
        price: isPaid ? Number(price) : 0,
      },
      options: {
        visibility: isPublic ? "public" : "private",
        capacity: unlimited ? "unlimited" : Number(capacity),
      },
      dateCreated: new Date().toISOString(),
    };
    console.log("🎫 Event created", event);
    router.push("/");
  }

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <X size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create event</Text>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canSubmit()}
          style={{ opacity: canSubmit() ? 1 : 0.5 }}
        >
          <Check size={26} color={canSubmit() ? "#4f46e5" : "#666"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* COVER */}
        <TouchableOpacity style={styles.coverContainer} onPress={pickCover}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Text style={styles.coverPlaceholderText}>
                Upload cover image
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* COMMUNITY DROPDOWN */}
        <Text style={styles.label}>Select community</Text>
        <View style={styles.input}>
          <Picker
            selectedValue={selectedCommunity}
            onValueChange={(itemValue) => setSelectedCommunity(itemValue)}
            dropdownIconColor="#fff" // iOS-friendly
          >
            <Picker.Item label="Choose a community..." value={null} />
            {SAMPLE_COMMUNITIES.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        {/* NAME */}
        <Text style={styles.label}>Event name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter event name"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
        />

        {/* DATE/TIME */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Start</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => showDateTime("start", "date")}
            >
              <Text style={styles.inputText}>
                {start ? start.toLocaleString() : "Select start date/time"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>End</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => showDateTime("end", "date")}
            >
              <Text style={styles.inputText}>
                {end ? end.toLocaleString() : "Select end date/time"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker.field && (
          <DateTimePicker
            value={
              showPicker.field === "start"
                ? start || new Date()
                : end || new Date()
            }
            mode={showPicker.mode}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(e, val) => {
              // For Android date/time flows: first pick date then time. Simplify: accept selected directly.
              onChangeDateTime(e, val as Date | undefined);
            }}
          />
        )}

        {/* LOCATION */}
        <Text style={styles.label}>Location</Text>
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={useCurrentLocation}
          >
            <Text style={styles.smallButtonText}>Use current</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              setLocationChoice((s) => (s === "choose" ? "none" : "choose"))
            }
          >
            <Text style={styles.smallButtonText}>Choose area</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              setLocationChoice((s) => (s === "manual" ? "none" : "manual"))
            }
          >
            <Text style={styles.smallButtonText}>Enter manually</Text>
          </TouchableOpacity>
        </View>

        {locationChoice === "choose" && (
          <View style={styles.choices}>
            {SINGAPORE_AREAS.map((a) => (
              <TouchableOpacity
                key={a}
                onPress={() => chooseArea(a)}
                style={styles.choice}
              >
                <Text style={styles.choiceText}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {locationChoice === "manual" && (
          <TextInput
            style={styles.input}
            placeholder="Type location"
            placeholderTextColor="#777"
            value={manualLocation}
            onChangeText={manualSetLocation}
          />
        )}

        {chosenLocation ? (
          <View style={styles.chosen}>
            <Text style={styles.chosenLabel}>Chosen location</Text>
            <Text style={styles.chosenText}>{chosenLocation}</Text>

            <TextInput
              style={styles.input}
              placeholder="Optional: further instructions (how to find the spot)"
              placeholderTextColor="#777"
              value={locationInstructions}
              onChangeText={setLocationInstructions}
            />
          </View>
        ) : null}

        {/* DESCRIPTION (Markdown) */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Description (markdown)</Text>
            <TouchableOpacity onPress={() => setPreview((p) => !p)}>
              <Text style={styles.previewToggle}>
                {preview ? "Edit" : "Preview"}
              </Text>
            </TouchableOpacity>
          </View>

          {!preview ? (
            <TextInput
              style={[styles.input, { height: 140 }]}
              multiline
              placeholder="Write in markdown. Use **bold**, *italic*, # headings, etc."
              placeholderTextColor="#777"
              value={description}
              onChangeText={setDescription}
            />
          ) : (
            <View style={[styles.input, { minHeight: 140 }]}>
              <ScrollView>
                <Markdown>{description || "_Nothing to preview_"}</Markdown>
              </ScrollView>
            </View>
          )}
        </View>

        {/* TICKETING */}
        <View style={styles.section}>
          <Text style={styles.label}>Ticketing</Text>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Require approval to join</Text>
            <Switch
              value={requireApproval}
              onValueChange={setRequireApproval}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Paid event</Text>
            <Switch value={isPaid} onValueChange={setIsPaid} />
          </View>

          {isPaid && (
            <TextInput
              style={styles.input}
              placeholder="Price (SGD)"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          )}
        </View>

        {/* OPTIONS */}
        <View style={styles.section}>
          <Text style={styles.label}>Options</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Visibility</Text>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => setIsPublic(true)}
                style={[styles.toggle, isPublic && styles.toggleActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isPublic && styles.toggleTextActive,
                  ]}
                >
                  Public
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsPublic(false)}
                style={[styles.toggle, !isPublic && styles.toggleActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isPublic && styles.toggleTextActive,
                  ]}
                >
                  Private
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Capacity</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => setUnlimited(true)}
                style={[styles.toggle, unlimited && styles.toggleActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    unlimited && styles.toggleTextActive,
                  ]}
                >
                  Unlimited
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUnlimited(false)}
                style={[styles.toggle, !unlimited && styles.toggleActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !unlimited && styles.toggleTextActive,
                  ]}
                >
                  Set limit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!unlimited && (
            <TextInput
              style={styles.input}
              placeholder="Max capacity"
              placeholderTextColor="#777"
              keyboardType="numeric"
              value={capacity}
              onChangeText={setCapacity}
            />
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* <TouchableOpacity
          style={[styles.primaryButton, { opacity: canSubmit() ? 1 : 0.6 }]}
          disabled={!canSubmit()}
          onPress={handleCreate}
        >
          <Text style={styles.primaryButtonText}>Create event</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </View>
  );
}

/* ========== styles ========== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  content: { padding: 20, paddingBottom: 60 },
  coverContainer: { alignItems: "center", marginBottom: 12 },
  coverImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  coverPlaceholder: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholderText: { color: "#777" },
  label: { color: "#bbb", marginBottom: 6, marginTop: 8 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewToggle: { color: "#4f46e5", fontWeight: "600" },
  input: {
    backgroundColor: "#0f0f0f",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  inputText: { color: "#fff" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  locationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  smallButton: {
    backgroundColor: "#111",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  smallButtonText: { color: "#fff" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  choice: {
    backgroundColor: "#222",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  choiceText: { color: "#fff" },
  chosen: { marginTop: 6 },
  chosenLabel: { color: "#888", fontSize: 12 },
  chosenText: { color: "#fff", marginBottom: 8 },
  section: { marginTop: 10 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionLabel: { color: "#fff" },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111",
    marginLeft: 8,
  },
  toggleActive: { backgroundColor: "#4f46e5" },
  toggleText: { color: "#fff" },
  toggleTextActive: { color: "#fff", fontWeight: "700" },
  error: { color: "#ff6b6b", marginTop: 8 },
  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
});
