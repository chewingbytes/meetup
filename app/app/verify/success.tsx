import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { CheckCircle, Clock, Home, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SuccessStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    confettiRef.current?.start();
  }, []);

  return (
    <View style={[s.root, { backgroundColor: C.canvas }]}>
      <ConfettiCannon
        count={220}
        origin={{ x: -10, y: 0 }}
        autoStart
        ref={confettiRef}
        fadeOut
        colors={["#A78BFA", "#7C3AED", "#F472B6", "#34D399", "#FCD34D"]}
      />

      {/* Top gradient fill */}
      <LinearGradient
        colors={C.Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.topFill, { paddingTop: insets.top }]}
      />

      <View style={[s.body, { paddingBottom: insets.bottom + 32 }]}>
        {/* Icon */}
        <LinearGradient
          colors={C.Gradients.green}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.iconBadge}
        >
          <CheckCircle size={52} color="#fff" strokeWidth={2} />
        </LinearGradient>

        {/* Main card */}
        <View style={s.card}>
          <Text style={s.title}>We got it! 🎉</Text>
          <Text style={s.subtitle}>
            Your documents have been submitted for review.
          </Text>

          {/* ETA row */}
          <View style={s.etaRow}>
            <View style={s.etaIcon}>
              <Clock size={16} color={C.accentAmber} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.etaLabel}>Estimated review time</Text>
              <Text style={s.etaValue}>Under 24 hours</Text>
            </View>
          </View>

          {/* Info row */}
          <View style={s.infoRow}>
            <ShieldCheck size={15} color={C.accent} strokeWidth={2} />
            <Text style={s.infoText}>
              You'll receive a notification once your student status is verified .
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => router.replace("/settings" as any)}
          style={s.btn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={C.Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.btnGrad}
          >
            <Home size={18} color="#fff" strokeWidth={2.5} />
            <Text style={s.btnText}>Back to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  topFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },

  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },

  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },

  card: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: C.Radii.xxl,
    padding: C.Space.xl,
    gap: 16,
    alignItems: "center",
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
  },
  title: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxl,
    color: C.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: C.FontSizes.sm * 1.6,
  },

  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: C.amberMuted,
    borderRadius: C.Radii.lg,
    padding: C.Space.md,
  },
  etaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  etaLabel: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
  },
  etaValue: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.accentAmber,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    width: "100%",
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.lg,
    padding: C.Space.md,
  },
  infoText: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textSecondary,
    lineHeight: C.FontSizes.xs * 1.6,
  },

  btn: {
    width: "100%",
    borderRadius: C.Radii.xl,
    overflow: "hidden",
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
    paddingVertical: 17,
  },
  btnText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },
});
