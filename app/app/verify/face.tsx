import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowRight, Camera, ChevronLeft, RotateCcw, ScanFace } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_STEPS = 3;

export default function FaceStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);

  const takeSelfie = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Camera required", "Please allow camera access to take a selfie.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      setSelfieUri(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    router.push({ pathname: "/verify/id" as any, params: { selfieUri: selfieUri ?? "" } });
  };

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
          <Text style={s.headerStep}>Step 3 of {TOTAL_STEPS}</Text>
          <Text style={s.headerTitle}>Selfie Check</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: "100%" }]} />
      </View>

      <View style={[s.body, { paddingBottom: insets.bottom + 32 }]}>
        {!selfieUri ? (
          /* ── No selfie yet ── */
          <>
            <LinearGradient
              colors={C.Gradients.pink}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.iconBadge}
            >
              <ScanFace size={48} color="#fff" strokeWidth={1.8} />
            </LinearGradient>

            <View style={s.card}>
              <Text style={s.cardTitle}>Quick selfie</Text>
              <Text style={s.cardBody}>
                We need to confirm you're a real person. Take a selfie with your front camera — it only takes a second.
              </Text>

              <View style={s.tipRow}>
                {["Good lighting", "Face centred", "No sunglasses"].map((tip) => (
                  <View key={tip} style={s.tipChip}>
                    <Text style={s.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={takeSelfie} style={s.btn} activeOpacity={0.85}>
              <LinearGradient
                colors={C.Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGrad}
              >
                <Camera size={20} color="#fff" strokeWidth={2.5} />
                <Text style={s.btnText}>Take Selfie</Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        ) : (
          /* ── Selfie preview ── */
          <>
            <View style={s.selfieFrame}>
              <Image source={{ uri: selfieUri }} style={s.selfieImg} resizeMode="cover" />
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Looking good! 🎉</Text>
              <Text style={s.cardBody}>
                One last step — we'll need both sides of your student ID card.
              </Text>
            </View>

            <TouchableOpacity onPress={takeSelfie} style={s.retakeBtn} activeOpacity={0.8}>
              <RotateCcw size={16} color={C.accent} strokeWidth={2.5} />
              <Text style={s.retakeText}>Retake selfie</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleContinue} style={s.btn} activeOpacity={0.85}>
              <LinearGradient
                colors={C.Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGrad}
              >
                <Text style={s.btnText}>Next Step</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  progressFill: { height: "100%", backgroundColor: C.accent },

  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    gap: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#DB2777",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },

  card: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  cardBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: C.FontSizes.sm * 1.6,
  },

  tipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 4,
  },
  tipChip: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tipText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },

  selfieFrame: {
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 3,
    borderColor: C.accentLight,
  },
  selfieImg: { width: "100%", height: "100%" },

  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  retakeText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.accent,
    textDecorationLine: "underline",
  },

  btn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    width: "100%",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  btnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  btnText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: "#fff",
  },
});
