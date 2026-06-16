import { C } from "@/theme/clay";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  ChevronLeft,
  FileText,
  GraduationCap,
  KeyRound,
  Mail,
  MapPin,
  Search,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
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

const COUNTRIES = [
  "Singapore",
  "Malaysia",
  "Indonesia",
  "Philippines",
  "Thailand",
  "Vietnam",
  "Myanmar",
  "Cambodia",
  "Brunei",
  "Australia",
  "New Zealand",
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Japan",
  "South Korea",
  "China",
  "Hong Kong",
  "Taiwan",
  "India",
  "Bangladesh",
  "Pakistan",
  "Sri Lanka",
  "Nepal",
  "United Arab Emirates",
  "Saudi Arabia",
  "South Africa",
  "Brazil",
  "Mexico",
  "Argentina",
];

const STEPS = [
  { icon: Mail,       label: "School Email",   desc: "Enter your .edu email address" },
  { icon: KeyRound,   label: "Verify Code",    desc: "Enter the OTP sent to your email" },
  { icon: FileText,   label: "Student ID",     desc: "Upload your student card" },
];

export default function VerificationIntro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (query.trim().length < 1) return COUNTRIES.slice(0, 6);
    return COUNTRIES.filter((c) =>
      c.toLowerCase().startsWith(query.toLowerCase()),
    ).slice(0, 6);
  }, [query]);

  const isSupported = selected === "Singapore";
  const isUnsupported = selected !== null && !isSupported;

  function selectCountry(country: string) {
    setSelected(country);
    setQuery(country);
    setDropdownOpen(false);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setDropdownOpen(false);
  }

  return (
    <View style={[s.root, { backgroundColor: C.canvas }]}>
      {/* ── Header ── */}
      <LinearGradient
        colors={C.Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={20} color={C.accent} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Student Verification</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero card ── */}
        <View style={s.heroCard}>
          <LinearGradient
            colors={C.Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroIcon}
          >
            <GraduationCap size={32} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
          <Text style={s.heroTitle}>Are you a student?</Text>
          <Text style={s.heroBody}>
            Verify your student status to unlock exclusive hangouts and safer spaces just for students.
          </Text>
        </View>

        {/* ── Steps overview ── */}
        <Text style={s.sectionLabel}>What you'll need</Text>
        <View style={s.stepsCard}>
          {STEPS.map((step, i) => (
            <View key={i} style={[s.stepRow, i < STEPS.length - 1 && s.stepRowBorder]}>
              <LinearGradient
                colors={
                  i === 0 ? C.Gradients.blue
                  : i === 1 ? C.Gradients.amber
                  : C.Gradients.green
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.stepIconWrap}
              >
                <step.icon size={16} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.stepLabel}>{step.label}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Country selection ── */}
        <Text style={s.sectionLabel}>Where are you studying?</Text>
        <View style={s.searchCard}>
          <View style={s.searchRow}>
            <Search size={16} color={C.textTertiary} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                setSelected(null);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search your country…"
              placeholderTextColor={C.textTertiary}
              style={s.searchInput}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSelection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={15} color={C.textTertiary} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown suggestions */}
          {dropdownOpen && suggestions.length > 0 && (
            <View style={s.dropdown}>
              {suggestions.map((country, i) => (
                <TouchableOpacity
                  key={country}
                  style={[s.suggRow, i < suggestions.length - 1 && s.suggBorder]}
                  onPress={() => selectCountry(country)}
                >
                  <MapPin size={13} color={C.accentLight} strokeWidth={2} />
                  <Text style={s.suggText}>{country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Selected chip ── */}
        {selected && (
          <View style={[s.chip, isSupported ? s.chipGreen : s.chipRed]}>
            <MapPin
              size={13}
              color={isSupported ? C.accentGreen : C.error}
              strokeWidth={2.5}
            />
            <Text style={[s.chipText, { color: isSupported ? C.accentGreen : C.error }]}>
              {selected}
            </Text>
            <TouchableOpacity onPress={clearSelection} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={13} color={isSupported ? C.accentGreen : C.error} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Unsupported message ── */}
        {isUnsupported && (
          <View style={s.unsupportedCard}>
            <Text style={s.unsupportedTitle}>Not available yet</Text>
            <Text style={s.unsupportedBody}>
              Sorry, we don't support student verification in {selected} yet. We're expanding soon — check back later! 🌏
            </Text>
          </View>
        )}

        {/* ── CTA ── */}
        {isSupported && (
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push("/verify/email" as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={C.Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.ctaGrad}
            >
              <Text style={s.ctaText}>Start Now</Text>
              <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <Text style={s.footnote}>Takes about 2 minutes · Free forever</Text>
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

  // Header
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
  headerTitle: {
    flex: 1,
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#fff",
    textAlign: "center",
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },

  // Hero
  heroCard: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.xl,
    color: C.textPrimary,
    textAlign: "center",
  },
  heroBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: C.FontSizes.sm * 1.6,
  },

  sectionLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: -4,
  },

  // Steps
  stepsCard: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: C.Space.xl,
    paddingVertical: 16,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EDF8",
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
    color: C.textPrimary,
  },
  stepDesc: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    marginTop: 1,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.xs,
    color: C.accent,
  },

  // Country search
  searchCard: {
    ...CARD_SHADOW,
    backgroundColor: C.surface,
    borderRadius: C.Radii.xl,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: "#F0EDF8",
  },
  suggRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  suggBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F8F5FF",
  },
  suggText: {
    fontFamily: C.Fonts.bodyMedium,
    fontSize: C.FontSizes.base,
    color: C.textPrimary,
  },

  // Chip
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: C.Radii.full,
    borderWidth: 1.5,
  },
  chipGreen: {
    backgroundColor: C.greenMuted,
    borderColor: C.accentGreen + "55",
  },
  chipRed: {
    backgroundColor: "#FEE2E2",
    borderColor: C.error + "44",
  },
  chipText: {
    fontFamily: C.Fonts.bodyBold,
    fontSize: C.FontSizes.sm,
  },

  // Unsupported
  unsupportedCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: C.Radii.xl,
    padding: C.Space.xl,
    borderWidth: 1.5,
    borderColor: "#FECACA",
    gap: 6,
  },
  unsupportedTitle: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.base,
    color: C.error,
  },
  unsupportedBody: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.sm,
    color: "#B91C1C",
    lineHeight: C.FontSizes.sm * 1.6,
  },

  // CTA
  ctaBtn: {
    borderRadius: C.Radii.xl,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  ctaText: {
    fontFamily: C.Fonts.heading,
    fontSize: C.FontSizes.md,
    color: "#fff",
  },

  footnote: {
    fontFamily: C.Fonts.body,
    fontSize: C.FontSizes.xs,
    color: C.textTertiary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 8,
  },
});
