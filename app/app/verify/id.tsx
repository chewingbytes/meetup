import { C } from "@/theme/clay";
import { useAuth } from "@/lib/authContext";
import { uploadVerificationImages } from "@/lib/supabaseStorage";
import { submitVerification } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Camera,
  Check,
  ChevronLeft,
  FileText,
  ImageIcon,
  RotateCcw,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IdStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { selfieUri } = useLocalSearchParams<{ selfieUri?: string }>();

  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = !!frontImage && !!backImage;

  function pickImage(side: "front" | "back") {
    Alert.alert(
      side === "front" ? "ID Front" : "ID Back",
      "How would you like to add this image?",
      [
        { text: "Take Photo",          onPress: () => launchCamera(side) },
        { text: "Choose from Library", onPress: () => launchGallery(side) },
        { text: "Cancel", style: "cancel" },
      ],
    );
  }

  async function launchCamera(side: "front" | "back") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.back,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      side === "front" ? setFrontImage(result.assets[0].uri) : setBackImage(result.assets[0].uri);
    }
  }

  async function launchGallery(side: "front" | "back") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Library access required", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      side === "front" ? setFrontImage(result.assets[0].uri) : setBackImage(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    const userId = session?.user?.id;
    if (!userId) {
      Alert.alert("Error", "No active session. Please log in again.");
      return;
    }
    setIsLoading(true);
    try {
      await uploadVerificationImages({
        userId,
        idFrontUri: frontImage!,
        idBackUri: backImage!,
        selfieUri: selfieUri ?? null,
      });
      await submitVerification(userId);
      router.push("/verify/success" as any);
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message || "Could not upload documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function renderSlot(side: "front" | "back", image: string | null) {
    const label = side === "front" ? "Front of ID" : "Back of ID";
    return (
      <View style={s.slotWrap}>
        <View style={s.slotHeader}>
          <Text style={s.slotLabel}>{label}</Text>
          {image && (
            <TouchableOpacity onPress={() => pickImage(side)} style={s.retakeBtn}>
              <RotateCcw size={12} color={C.accent} strokeWidth={2.5} />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => pickImage(side)}
          style={[s.slot, image ? s.slotFilled : s.slotEmpty]}
          activeOpacity={0.8}
        >
          {image ? (
            <Image source={{ uri: image }} style={s.slotImage} resizeMode="cover" />
          ) : (
            <View style={s.slotPlaceholder}>
              <Camera size={28} color={C.textTertiary} strokeWidth={1.8} />
              <ImageIcon size={20} color={C.textTertiary} strokeWidth={1.8} />
              <Text style={s.slotPlaceholderText}>Tap to capture or upload</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: C.canvas }]}>
      {/* Header */}
      <LinearGradient
        colors={C.Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={20} color={C.accent} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerStep}>Final Step</Text>
          <Text style={s.headerTitle}>Student ID Card</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress — full */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: "100%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={s.introCard}>
          <LinearGradient
            colors={C.Gradients.green}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.introIcon}
          >
            <FileText size={28} color="#fff" strokeWidth={2} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.introTitle}>Upload both sides</Text>
            <Text style={s.introBody}>
              Make sure all text is visible and the card is fully in frame.
            </Text>
          </View>
        </View>

        {/* ID slots */}
        <View style={s.card}>
          {renderSlot("front", frontImage)}
          <View style={s.divider} />
          {renderSlot("back", backImage)}
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading || !canSubmit}
          style={[s.submitBtn, (!canSubmit || isLoading) && s.submitBtnDisabled]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={canSubmit ? C.Gradients.green : (["#D1D5DB", "#C4C9D4"] as any)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.submitGrad}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Check size={18} color="#fff" strokeWidth={3} />
                <Text style={s.submitText}>Submit for Review</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.hint}>
          Your documents are encrypted and reviewed by our team within 24 hours.
        </Text>
      </ScrollView>
    </View>
  );
}

const CARD_SHADOW = {
  shadowColor: "#7C3AED",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.11,
  shadowRadius: 24,
  elevation: 8,
  borderWidth: 1,
  borderTopColor: "rgba(255,255,255,0.9)",
  borderLeftColor: "rgba(255,255,255,0.55)",
  borderRightColor: "rgba(255,255,255,0.2)",
  borderBottomColor: "rgba(255,255,255,0.1)",
} as const;

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 1 },
  headerStep: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },

  progressTrack: { height: 3, backgroundColor: "#EDE9FE" },
  progressFill: { height: "100%", backgroundColor: C.accentGreen },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },

  // Intro banner
  introCard: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  introTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  introBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    marginTop: 2,
    lineHeight: C.FontSizes.xs * 1.6,
  },

  // Main card
  card: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    gap: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0EDF8",
    marginVertical: 20,
  },

  // ID slot
  slotWrap: { gap: 10 },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  retakeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
    textDecorationLine: "underline",
  },
  slot: {
    width: "100%",
    height: 160,
    borderRadius: C.Radii.lg,
    overflow: "hidden",
  },
  slotEmpty: {
    backgroundColor: "#F8F5FF",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  slotFilled: {},
  slotImage: { width: "100%", height: "100%" },
  slotPlaceholder: {
    alignItems: "center",
    gap: 6,
  },
  slotPlaceholderText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    marginTop: 2,
  },

  // Submit
  submitBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnDisabled: { shadowOpacity: 0, elevation: 0 },
  submitGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  submitText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },

  hint: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textAlign: "center",
    lineHeight: C.FontSizes.xs * 1.6,
    paddingHorizontal: 16,
  },
});
