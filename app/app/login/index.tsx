/**
 * Login screen — clay aesthetic.
 *
 * Layout: animated blobs background + a centred card.
 * The headline uses a gradient text treatment via a masking trick
 * (we use two overlapping Text views since RN doesn't support gradient text
 * natively without SVG). For simplicity we just use the accent color on
 * key words and let Nunito's weight do the work.
 */

import { ClayBackground } from "@/components/ui/clay-background";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayInput } from "@/components/ui/clay-input";
import { useAuth } from "@/lib/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C } from "@/theme/clay";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Hold on", "Please fill in your email and password.");
      return;
    }
    try {
      setIsLoading(true);
      const { user, error } = await signIn(email, password);
      if (error) {
        Alert.alert("Sign in failed", error.message || "Please check your credentials.");
        return;
      }
      if (user) {
        if (!user.email_confirmed_at) {
          await AsyncStorage.setItem("pending_email_verification", email);
          router.push("/verify/email");
        } else {
          router.replace("/");
        }
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClayBackground style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + 16 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back button */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color={C.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Hero headline */}
            <View style={styles.hero}>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.headline}>
                Sign in to{"\n"}
                <Text style={[styles.headline, { color: C.accent }]}>
                  Soonest
                </Text>
              </Text>
              <Text style={styles.subline}>
                Connect, explore, and meet people near you.
              </Text>
            </View>

            {/* Form card */}
            <ClayCard elevated style={styles.card} radius={C.Radii.xxl} padding={C.Space.xxl}>
              <ClayInput
                label="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                leftIcon={<Mail size={18} color={C.textSecondary} strokeWidth={2} />}
              />

              <View style={{ height: C.Space.lg }} />

              <ClayInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={18} color={C.textSecondary} strokeWidth={2} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <EyeOff size={18} color={C.textSecondary} strokeWidth={2} />
                      : <Eye size={18} color={C.textSecondary} strokeWidth={2} />}
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                onPress={() => router.push("/forgot-password" as any)}
                style={styles.forgotWrap}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>

              <ClayButton
                onPress={handleSignIn}
                loading={isLoading}
                size="lg"
                fullWidth
              >
                Sign In
              </ClayButton>
            </ClayCard>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/register" as any)}>
                <Text style={styles.registerLink}>Sign up free</Text>
              </TouchableOpacity>
            </View>

            {/* Trust badges */}
            <View style={styles.badges}>
              {["Safe & Verified", "100% Free", "Student Friendly"].map((b) => (
                <View key={b} style={styles.badge}>
                  <Text style={styles.badgeText}>{b}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: C.Space.xl,
    paddingBottom: 48,
    flexGrow: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: C.Radii.md,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: C.Space.xl,
  },
  hero: {
    marginBottom: C.Space.xxl,
    gap: C.Space.sm,
  },
  greeting: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
    letterSpacing: 0.3,
  },
  headline: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xxxl,
    color: C.textPrimary,
    lineHeight: C.FontSizes.xxxl * 1.15,
  },
  subline: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
    lineHeight: C.FontSizes.base * 1.6,
    marginTop: C.Space.xs,
  },
  card: {
    marginBottom: C.Space.xl,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    paddingVertical: C.Space.sm,
    marginBottom: C.Space.lg,
    marginTop: C.Space.xs,
  },
  forgot: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.sm,
    color: C.accent,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: C.Space.md,
    marginVertical: C.Space.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(124,58,237,0.12)",
  },
  dividerText: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: C.Space.sm,
    marginBottom: C.Space.xxl,
  },
  registerPrompt: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textSecondary,
  },
  registerLink: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.base,
    color: C.accent,
  },
  badges: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: C.Space.sm,
  },
  badge: {
    backgroundColor: C.accentMuted,
    borderRadius: C.Radii.full,
    paddingHorizontal: C.Space.md,
    paddingVertical: C.Space.xs,
  },
  badgeText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },
});
