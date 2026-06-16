import { CATEGORIES } from "@/utils/categories";
import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Bookmark, Check, MapPin, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.74;

interface Props {
  coordinate: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSave: (data: {
    category: string;
    place_name?: string;
    location_lat: number;
    location_lng: number;
    note: string;
  }) => Promise<void>;
}

export function AddFavouriteSheet({ coordinate, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const visible = coordinate !== null;
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [category, setCategory] = useState("outdoor");
  const [note, setNote] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!coordinate) return;
    setPlaceName("");
    Location.reverseGeocodeAsync({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    })
      .then((results) => {
        if (!results?.[0]) return;
        const r = results[0];
        const parts = [r.name, r.street, r.district].filter(Boolean);
        setPlaceName(parts.slice(0, 2).join(", "));
      })
      .catch(() => {});
  }, [coordinate?.latitude, coordinate?.longitude]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 3,
          speed: 16,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: SHEET_H,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setNote("");
      setCategory("outdoor");
    }
  }, [visible]);

  const handleSave = async () => {
    if (!coordinate || !note.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        category,
        place_name: placeName.trim() || undefined,
        location_lat: coordinate.latitude,
        location_lng: coordinate.longitude,
        note: note.trim(),
      });
      onClose();
    } catch {
      // keep sheet open on error
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = note.trim().length > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.kvWrapper}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            { transform: [{ translateY: slideY }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <LinearGradient
                colors={C.Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconWrap}
              >
                <Bookmark size={15} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
              <View>
                <Text style={styles.headerTitle}>Add Favourite Spot</Text>
                {coordinate && (
                  <View style={styles.coordRow}>
                    <MapPin size={10} color={C.textTertiary} strokeWidth={2} />
                    <Text style={styles.coordText}>
                      {coordinate.latitude.toFixed(5)},{" "}
                      {coordinate.longitude.toFixed(5)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={17} color={C.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Place name */}
            <Text style={styles.label}>Place Name</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="e.g. Botanic Gardens, Haw Par Villa…"
                placeholderTextColor={C.textTertiary}
                style={styles.input}
                returnKeyType="next"
              />
            </View>

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
              nestedScrollEnabled
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.78}
                    style={styles.catChipOuter}
                  >
                    {active ? (
                      <LinearGradient
                        colors={cat.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.catChipActive}
                      >
                        <cat.Icon size={13} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.catLabelActive}>{cat.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.catChipInactive}>
                        <cat.Icon
                          size={13}
                          color={C.textSecondary}
                          strokeWidth={2.5}
                        />
                        <Text style={styles.catLabelInactive}>{cat.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Note */}
            <View style={styles.labelRow}>
              <Text style={styles.label}>What do you love about this place?</Text>
              <Text style={styles.charCount}>{note.length}/120</Text>
            </View>
            <View style={[styles.inputWrap, styles.noteWrap]}>
              <TextInput
                value={note}
                onChangeText={(t) => setNote(t.slice(0, 120))}
                placeholder={
                  '"I love running here at night, the city views are 🔥"'
                }
                placeholderTextColor={C.textTertiary}
                style={[styles.input, styles.noteInput]}
                multiline
                maxLength={120}
              />
            </View>

            {/* Save */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.85}
              style={styles.saveOuter}
            >
              <LinearGradient
                colors={
                  canSave ? C.Gradients.primary : (["#D1D5DB", "#C4C9D4"] as any)
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveGrad}
              >
                <Check size={16} color="#fff" strokeWidth={3} />
                <Text style={styles.saveText}>
                  {isSaving ? "Saving…" : "Save Favourite Spot"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30, 20, 50, 0.45)",
  },
  kvWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  } as any,
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: C.Radii.xxl,
    borderTopRightRadius: C.Radii.xxl,
    maxHeight: SHEET_H,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1C8E8",
    borderRadius: 99,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.lg,
    color: C.textPrimary,
  },
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },
  coordText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0EDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 12,
    gap: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  label: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    marginTop: 18,
    marginBottom: 8,
  },
  charCount: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
  inputWrap: {
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.lg,
    borderWidth: 1.5,
    borderColor: "#E8E0F8",
  },
  input: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteWrap: {
    marginTop: 0,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  catRow: {
    gap: 8,
    paddingRight: 4,
  },
  catChipOuter: {},
  catChipActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: C.Radii.full,
  },
  catChipInactive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: C.Radii.full,
    backgroundColor: "#F0EDF8",
  },
  catLabelActive: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: "#fff",
  },
  catLabelInactive: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
  },
  saveOuter: {
    marginTop: 24,
    borderRadius: C.Radii.lg,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  saveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: C.Radii.lg,
  },
  saveText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
});
