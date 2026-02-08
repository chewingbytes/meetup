import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useAuth();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [email] = useState((params.email as string) || "");
  const [password] = useState((params.password as string) || "");

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");

  const allInterests = [
    "Gaming",
    "Fitness",
    "Study",
    "Arts",
    "Cafe Hopping",
    "Sunrise Walks",
    "Sports",
    "Music",
    "Movies / Anime",
    "Thrifting",
    "Career & Tech",
  ];
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const personalityQuestions = [
    {
      id: "social",
      q: "What's your social energy like?",
      opts: ["⚡ Extrovert", "🌙 Introvert", "🔄 Ambivert"],
    },
    {
      id: "weekend",
      q: "Your ideal weekend?",
      opts: ["Out exploring", "Cozy at home", "Studying", "Doing sports"],
    },
    {
      id: "connect",
      q: "How do you connect?",
      opts: ["Deep 1-to-1", "Group hangs", "Shared hobbies", "Shy but warm up"],
    },
    {
      id: "planning",
      q: "How do you prefer to plan?",
      opts: ["Spontaneous", "Structured plan", "Flexible mix"],
    },
    {
      id: "stress",
      q: "How do you handle stress?",
      opts: ["Talk it out", "Need alone time", "Exercise", "Creative outlet"],
    },
    {
      id: "learning",
      q: "Learning style preference?",
      opts: ["Visual learner", "Hands-on", "Reading/Writing", "Listening"],
    },
  ];
  const [personalityAnswers, setPersonalityAnswers] = useState<
    Record<string, string>
  >({});

  const [prefScope, setPrefScope] = useState("Nearby schools");
  const [radius, setRadius] = useState(5);
  const [preferredTypes, setPreferredTypes] = useState<string[]>(["casual"]);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) =>
      prev.includes(i) ? prev.filter((p) => p !== i) : [...prev, i]
    );
  };

  const selectPersonality = (id: string, opt: string) => {
    setPersonalityAnswers((p) => ({ ...p, [id]: opt }));
  };

  const handleFinishOnboarding = async () => {
    const onboardingData = {
      name,
      school,
      year,
      selectedInterests,
      personalityAnswers,
      prefScope,
      radius,
      preferredTypes,
    };

    if (email && password) {
      try {
        setIsSubmitting(true);
        const { user, error } = await signUp(email, password, onboardingData);

        if (error) {
          Alert.alert(
            "Signup Error",
            error.message || "Failed to create account"
          );
          return;
        }

        if (user) {
          await AsyncStorage.setItem(
            "onboarding_data",
            JSON.stringify(onboardingData)
          );
          await AsyncStorage.setItem("pending_email_verification", email);
          router.push("/verify/email");
        }
      } catch (err: any) {
        Alert.alert("Error", err.message || "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      await AsyncStorage.setItem(
        "onboarding_data",
        JSON.stringify(onboardingData)
      );
      router.push("/login");
    }
  };

  const totalSteps = 5;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
            className="mb-6"
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          {/* Progress Bar */}
          <View className="bg-white/10 h-1.5 rounded-full mb-4 overflow-hidden">
            <View
              className="bg-indigo-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>

          <Text className="text-white/60 text-sm font-semibold">
            Step {step + 1} of {totalSteps}
          </Text>
        </View>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <View className="flex-1 px-5">
            <Text className="text-white text-3xl font-bold mb-2">
              Basic Info
            </Text>
            <Text className="text-white/60 text-base mb-8">
              Tell us about yourself
            </Text>

            <View className="mb-5">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Preferred Name
              </Text>
              <TextInput
                placeholder="Mei"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base"
              />
            </View>

            <View className="mb-5">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                School
              </Text>
              <TextInput
                placeholder="e.g. NUS / NP"
                placeholderTextColor="#666"
                value={school}
                onChangeText={setSchool}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base"
              />
            </View>

            <View className="mb-8">
              <Text className="text-white/80 text-sm font-semibold mb-2">
                Year of Study
              </Text>
              <TextInput
                placeholder="1"
                placeholderTextColor="#666"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white text-base"
              />
            </View>

            <TouchableOpacity
              onPress={() => setStep(1)}
              disabled={!name || !school}
            >
              <LinearGradient
                colors={
                  !name || !school ? ["#333", "#333"] : ["#4f46e5", "#7c3aed"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                <Text className="text-white font-bold text-base">Next</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace("/home")}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-white/50 text-sm">Skip for now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <View className="flex-1 px-5">
            <Text className="text-white text-3xl font-bold mb-2">
              Your Interests
            </Text>
            <Text className="text-white/60 text-base mb-8">
              Pick what you vibe with
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-8">
              {allInterests.map((i) => {
                const active = selectedInterests.includes(i);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => toggleInterest(i)}
                    className={`px-4 py-3 rounded-full ${
                      active
                        ? "bg-indigo-500 border border-indigo-400"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        active ? "text-white" : "text-white/70"
                      }`}
                    >
                      {i}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => {
                // Redirect to interest ranking screen with selected interests
                router.push({
                  pathname: "/onboarding/interest-ranking",
                  params: { interests: JSON.stringify(selectedInterests) }
                });
              }}
              disabled={selectedInterests.length === 0}
            >
              <LinearGradient
                colors={
                  selectedInterests.length === 0
                    ? ["#333", "#333"]
                    : ["#4f46e5", "#7c3aed"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                <Text className="text-white font-bold text-base">Next: Rank Your Interests</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Personality */}
        {step === 2 && (
          <View className="flex-1 px-5">
            <Text className="text-white text-3xl font-bold mb-2">
              Personality
            </Text>
            <Text className="text-white/60 text-base mb-8">
              Help us match you better
            </Text>

            {personalityQuestions.map((q) => (
              <View key={q.id} className="mb-6">
                <Text className="text-white font-semibold mb-3">{q.q}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {q.opts.map((o) => {
                    const selected = personalityAnswers[q.id] === o;
                    return (
                      <TouchableOpacity
                        key={o}
                        onPress={() => selectPersonality(q.id, o)}
                        className={`px-4 py-3 rounded-full ${
                          selected
                            ? "bg-indigo-500 border border-indigo-400"
                            : "bg-white/5 border border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            selected
                              ? "text-white font-semibold"
                              : "text-white/70"
                          }`}
                        >
                          {o}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={() => setStep(3)}>
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                <Text className="text-white font-bold text-base">Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <View className="flex-1 px-5">
            <Text className="text-white text-3xl font-bold mb-2">
              Preferences
            </Text>
            <Text className="text-white/60 text-base mb-8">
              Set your discovery range
            </Text>

            <Text className="text-white/80 text-sm font-semibold mb-3">
              Who can see you
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {["Your school", "Nearby schools", "Whole-of-SG"].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setPrefScope(s)}
                  className={`px-4 py-3 rounded-full ${
                    prefScope === s
                      ? "bg-indigo-500 border border-indigo-400"
                      : "bg-white/5 border border-white/10"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      prefScope === s
                        ? "text-white font-semibold"
                        : "text-white/70"
                    }`}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-white/80 text-sm font-semibold mb-3">
              Preferred meet types
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-8">
              {["casual", "study", "sports", "activities"].map((t) => {
                const active = preferredTypes.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() =>
                      setPreferredTypes((p) =>
                        p.includes(t) ? p.filter((x) => x !== t) : [...p, t]
                      )
                    }
                    className={`px-4 py-3 rounded-full ${
                      active
                        ? "bg-indigo-500 border border-indigo-400"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        active ? "text-white font-semibold" : "text-white/70"
                      }`}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => setStep(4)}>
              <LinearGradient
                colors={["#4f46e5", "#7c3aed"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                <Text className="text-white font-bold text-base">Next</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <View className="flex-1 px-5">
            <Text className="text-white text-3xl font-bold mb-2">
              Almost Done!
            </Text>
            <Text className="text-white/60 text-base mb-8">
              Review your profile
            </Text>

            <View className="bg-white/5 rounded-xl p-4 mb-8 border border-white/10">
              <View className="mb-4">
                <Text className="text-white/60 text-xs font-semibold mb-1">
                  NAME
                </Text>
                <Text className="text-white text-base font-semibold">
                  {name}
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-white/60 text-xs font-semibold mb-1">
                  SCHOOL
                </Text>
                <Text className="text-white text-base font-semibold">
                  {school} · Year {year}
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-white/60 text-xs font-semibold mb-1">
                  INTERESTS
                </Text>
                <Text className="text-white text-sm">
                  {selectedInterests.join(", ")}
                </Text>
              </View>

              <View>
                <Text className="text-white/60 text-xs font-semibold mb-1">
                  PERSONALITY
                </Text>
                <Text className="text-white text-sm">
                  {Object.values(personalityAnswers).join(" • ")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleFinishOnboarding}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  isSubmitting ? ["#333", "#333"] : ["#4f46e5", "#7c3aed"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  alignSelf: "flex-start", // 👈 shrink to content
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View className="flex-row items-center">
                    <Check size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text
                      style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}
                    >
                      Complete Setup
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
