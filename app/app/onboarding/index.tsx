import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

export default function OnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState(0);

  // Basic Info
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");

  // Interests
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

  // Personality
  const personalityQuestions = [
    {
      id: "social",
      q: "What’s your social energy like?",
      opts: ["⚡ Extrovert", "🌙 Introvert", "🔄 Ambivert"],
    },
    {
      id: "weekend",
      q: "Your ideal weekend?",
      opts: ["Out exploring", "Cozy at home", "Studying", "Doing sports"],
    },
    {
      id: "connect",
      q: "How do you usually connect with people?",
      opts: ["Deep 1-to-1", "Group hangs", "Shared hobbies", "Shy but warm up"],
    },
  ];
  const [personalityAnswers, setPersonalityAnswers] = useState<Record<string, string>>({});

  // Preferences
  const [prefScope, setPrefScope] = useState("Nearby schools");
  const [radius, setRadius] = useState(5);
  const [preferredTypes, setPreferredTypes] = useState<string[]>(["casual"]);

  const toggleInterest = (i: string) => {
    setSelectedInterests((prev) => (prev.includes(i) ? prev.filter((p) => p !== i) : [...prev, i]));
  };

  const selectPersonality = (id: string, opt: string) => {
    setPersonalityAnswers((p) => ({ ...p, [id]: opt }));
  };

  const handleFinishOnboarding = () => {
    const payload = {
      name,
      school,
      year,
      selectedInterests,
      personalityAnswers,
      prefScope,
      radius,
      preferredTypes,
    };

    console.log("onboarding finished:", payload);
    Alert.alert("Onboarding complete", "Proceed to verification", [
      { text: "Continue", onPress: () => router.push("/verify/singpass" as any) },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, backgroundColor: PALETTE.white, padding: 20, paddingTop: 40 }}>
        {/* Step indicator */}
        <Text style={{ color: PALETTE.graphite, fontWeight: "700", fontSize: 18, marginBottom: 12 }}>Onboarding — Step {step + 1} / 5</Text>

        {step === 0 && (
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Basic Info</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16 }}>Tell us your name, school and year.</Text>

            <Text style={{ marginBottom: 6, color: PALETTE.graphite }}>First / Preferred name</Text>
            <TextInput placeholder="Mei" value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: PALETTE.babyPink, padding: 12, borderRadius: 12, marginBottom: 12 }} />

            <Text style={{ marginBottom: 6, color: PALETTE.graphite }}>School</Text>
            <TextInput placeholder="e.g. NUS / NP" value={school} onChangeText={setSchool} style={{ borderWidth: 1, borderColor: PALETTE.babyPink, padding: 12, borderRadius: 12, marginBottom: 12 }} />

            <Text style={{ marginBottom: 6, color: PALETTE.graphite }}>Year of study</Text>
            <TextInput placeholder="1" value={year} onChangeText={setYear} keyboardType="numeric" style={{ borderWidth: 1, borderColor: PALETTE.babyPink, padding: 12, borderRadius: 12, marginBottom: 20 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => router.replace("/")} style={{ paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12 }}>
                <Text style={{ color: "#6b7280" }}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(1)} disabled={!name || !school} style={{ backgroundColor: !name || !school ? "#eee" : PALETTE.coral, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>What are you into right now?</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16 }}>Pick as many as you vibe with. Tap to select. You can rank later.</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {allInterests.map((i) => {
                const active = selectedInterests.includes(i);
                return (
                  <TouchableWithoutFeedback key={i} onPress={() => toggleInterest(i)}>
                    <View style={{ backgroundColor: active ? PALETTE.coral : PALETTE.babyPink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                      <Text style={{ color: active ? PALETTE.white : PALETTE.graphite, fontWeight: "700" }}>{i}</Text>
                    </View>
                  </TouchableWithoutFeedback>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
              <TouchableOpacity onPress={() => setStep(0)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: "#6b7280" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(2)} disabled={selectedInterests.length === 0} style={{ backgroundColor: selectedInterests.length === 0 ? "#eee" : PALETTE.coral, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Personality</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16 }}>Answer a few fun questions so we can match you better.</Text>

            {personalityQuestions.map((q) => (
              <View key={q.id} style={{ marginBottom: 14 }}>
                <Text style={{ fontWeight: "700", color: PALETTE.graphite, marginBottom: 8 }}>{q.q}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {q.opts.map((o) => (
                    <TouchableOpacity key={o} onPress={() => selectPersonality(q.id, o)} style={{ backgroundColor: personalityAnswers[q.id] === o ? PALETTE.coral : PALETTE.babyPink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                      <Text style={{ color: personalityAnswers[q.id] === o ? PALETTE.white : PALETTE.graphite }}>{o}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
              <TouchableOpacity onPress={() => setStep(1)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: "#6b7280" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(3)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Preferences</Text>
            <Text style={{ color: "#6b7280", marginBottom: 16 }}>Who do you want to meet and how far?</Text>

            <Text style={{ marginBottom: 6, color: PALETTE.graphite }}>Who can see you</Text>
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {[
                "Your school",
                "Nearby schools",
                "Whole-of-SG",
              ].map((s) => (
                <TouchableOpacity key={s} onPress={() => setPrefScope(s)} style={{ backgroundColor: prefScope === s ? PALETTE.coral : PALETTE.babyPink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8 }}>
                  <Text style={{ color: prefScope === s ? PALETTE.white : PALETTE.graphite }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ marginBottom: 6, color: PALETTE.graphite }}>Preferred meet types</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
              {[
                "casual",
                "study",
                "sports",
                "activities",
              ].map((t) => (
                <TouchableOpacity key={t} onPress={() => setPreferredTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))} style={{ backgroundColor: preferredTypes.includes(t) ? PALETTE.coral : PALETTE.babyPink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, marginRight: 8, marginBottom: 8 }}>
                  <Text style={{ color: preferredTypes.includes(t) ? PALETTE.white : PALETTE.graphite }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => setStep(2)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: "#6b7280" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(4)} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={{ fontSize: 24, fontWeight: "800", color: PALETTE.graphite, marginBottom: 8 }}>Review & Submit</Text>

            <View style={{ backgroundColor: PALETTE.lightGrey, padding: 12, borderRadius: 12, marginBottom: 12 }}>
              <Text style={{ fontWeight: "700", color: PALETTE.graphite }}>Name</Text>
              <Text style={{ color: "#6b7280" }}>{name}</Text>
              <Text style={{ fontWeight: "700", color: PALETTE.graphite, marginTop: 8 }}>Interests</Text>
              <Text style={{ color: "#6b7280" }}>{selectedInterests.join(", ")}</Text>
              <Text style={{ fontWeight: "700", color: PALETTE.graphite, marginTop: 8 }}>Personality</Text>
              <Text style={{ color: "#6b7280" }}>{Object.values(personalityAnswers).join(", ")}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => setStep(3)} style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: "#6b7280" }}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFinishOnboarding} style={{ backgroundColor: PALETTE.coral, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 }}>
                <Text style={{ color: PALETTE.white, fontWeight: "700" }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
