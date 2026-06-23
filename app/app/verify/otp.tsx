import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, KeyRound } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TOTAL_STEPS = 3;

export default function OtpStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const isFull = otp.every((d) => d !== "");

  function handleChange(text: string, i: number) {
    const next = [...otp];
    next[i] = text;
    setOtp(next);
    if (text && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyPress(e: any, i: number) {
    if (e.nativeEvent.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  const handleVerify = async () => {
    if (!isFull) {
      Alert.alert("Incomplete", "Please enter the full 6-digit code.");
      return;
    }
    setIsLoading(true);
    // Verification logic wired later
    setTimeout(() => {
      setIsLoading(false);
      router.push("/verify/face" as any);
    }, 1000);
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
          <Text style={s.headerStep}>Step 2 of {TOTAL_STEPS}</Text>
          <Text style={s.headerTitle}>Verify Code</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(2 / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon badge */}
          <View style={s.iconWrap}>
            <LinearGradient
              colors={C.Gradients.amber}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.iconBadge}
            >
              <KeyRound size={34} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Enter the code</Text>
            <Text style={s.cardBody}>
              We sent a 6-digit code to{"\n"}
              <Text style={s.emailHighlight}>{email || "your email"}</Text>
            </Text>

            {/* OTP boxes */}
            <View style={s.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputRefs.current[i] = r; }}
                  value={digit}
                  onChangeText={(t) => handleChange(t, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  style={[s.otpBox, digit ? s.otpBoxFilled : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleVerify}
              disabled={isLoading || !isFull}
              style={[s.btn, (!isFull || isLoading) && s.btnDisabled]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isFull ? C.Gradients.primary : (["#D1D5DB", "#C4C9D4"] as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGrad}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={s.btnText}>Verify Code</Text>
                    <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={s.backLink}>
              <Text style={s.backLinkText}>Wrong email? Go back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
    alignItems: "center",
  },

  iconWrap: { marginBottom: -12, zIndex: 1 },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  card: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    width: "100%",
    paddingTop: 32,
    gap: 20,
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
  emailHighlight: {
    fontFamily: C.Fonts.bodyBold,
    color: C.accent,
  },

  otpRow: {
    flexDirection: "row",
    gap: 10,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: C.Radii.md,
    backgroundColor: "#F8F5FF",
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
  },
  otpBoxFilled: {
    borderColor: C.accent,
    backgroundColor: C.accentMuted,
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
  btnDisabled: { shadowOpacity: 0, elevation: 0 },
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

  backLink: { paddingVertical: 4 },
  backLinkText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textDecorationLine: "underline",
  },
});
