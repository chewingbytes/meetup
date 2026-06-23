import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowRight, ChevronLeft, Mail } from "lucide-react-native";
import { useState } from "react";
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

export default function EmailStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid school email address.");
      return;
    }
    setIsLoading(true);
    // Email sending logic wired later
    setTimeout(() => {
      setIsLoading(false);
      router.push({ pathname: "/verify/otp", params: { email } });
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
          <Text style={s.headerStep}>Step 1 of {TOTAL_STEPS}</Text>
          <Text style={s.headerTitle}>School Email</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${(1 / TOTAL_STEPS) * 100}%` }]} />
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
              colors={C.Gradients.blue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.iconBadge}
            >
              <Mail size={34} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Enter your school email</Text>
            <Text style={s.cardBody}>
              We'll send a one-time code to verify you're a current student. Use your official .edu or institution email.
            </Text>

            <View style={s.inputWrap}>
              <Mail size={16} color={C.textTertiary} strokeWidth={2} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@university.edu.sg"
                placeholderTextColor={C.textTertiary}
                style={s.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading || email.length < 3}
              style={[s.btn, (isLoading || email.length < 3) && s.btnDisabled]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={email.length >= 3 ? C.Gradients.primary : (["#D1D5DB", "#C4C9D4"] as any)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.btnGrad}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={s.btnText}>Send Verification Code</Text>
                    <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={s.hint}>
            Only official school or university emails are accepted.
          </Text>
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

  progressTrack: {
    height: 3,
    backgroundColor: "#EDE9FE",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
  },

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
    shadowColor: "#0EA5E9",
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
    gap: 16,
  },
  cardTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    textAlign: "center",
  },
  cardBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: C.FontSizes.sm * 1.6,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8F5FF",
    borderRadius: C.Radii.lg,
    borderWidth: 1.5,
    borderColor: "#EDE9FE",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  btn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
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

  hint: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textAlign: "center",
  },
});
