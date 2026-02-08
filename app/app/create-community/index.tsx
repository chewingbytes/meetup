import { useState } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, X } from "lucide-react-native";

const TOTAL_STEPS = 4;

const ALL_TOPICS = [
  "Gaming",
  "Study",
  "Books",
  "Music",
  "Social",
  "Art",
  "Food",
  "Tech",
  "Outdoors",
  "Wellness",
  "Coding",
  "Design",
  "Photography",
  "Movies",
  "Language",
];

export default function CreateCommunity() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [topics, setTopics] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleTopic(t: string) {
    setTopics((prev) => {
      if (prev.includes(t)) return prev.filter((p) => p !== t);
      if (prev.length >= 3) return prev;
      return [...prev, t];
    });
  }

  function validateStep() {
    setError(null);
    if (step === 1 && topics.length !== 3) {
      setError("Select exactly 3 topics.");
      return false;
    }
    if (step === 2 && name.trim().length < 5) {
      setError("Name must be at least 5 characters.");
      return false;
    }
    if (step === 3 && description.trim().length < 30) {
      setError("Description must be at least 30 characters.");
      return false;
    }
    return true;
  }

  function hasUnsavedChanges() {
    return (
      topics.length > 0 ||
      name.trim() !== "" ||
      description.trim() !== "" ||
      rules.length > 0 ||
      faqs.length > 0 ||
      imagePreview !== null
    );
  }

  function handleExit() {
    if (!hasUnsavedChanges()) {
      router.back();
      return;
    }

    Alert.alert(
      "Discard changes?",
      "All unsaved changes will be lost if you leave this page.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImagePreview(result.assets[0].uri);
    }
  }

  function handleSubmit() {
    // remove empty FAQs
    const cleanedFaqs = faqs.filter(
      (f) => f.q.trim().length > 0 && f.a.trim().length > 0
    );

    const community = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      topics,
      rules,
      faq: cleanedFaqs,
      profileImage: imagePreview ?? null,
      privacyMode: false,
      dateCreated: new Date().toISOString(),
    };

    console.log("📌 Community created:", community);

    // OPTIONAL: log nicely formatted JSON
    console.log("📦 Community JSON:", JSON.stringify(community, null, 2));

    router.push("/");
  }

  const progress = `${(step / TOTAL_STEPS) * 100}%`;

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
        >
          <ChevronLeft size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Create community</Text>

        <TouchableOpacity onPress={handleExit}>
          <X size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* PROGRESS */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progress }]} />
        </View>
        <Text style={styles.progressText}>
          Step {step} of {TOTAL_STEPS}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1 */}
        {step === 1 && (
          <View style={styles.card}>
            <Text style={styles.title}>Choose 3 topics</Text>
            <View style={styles.grid}>
              {ALL_TOPICS.map((t) => {
                const active = topics.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleTopic(t)}
                    style={[styles.topic, active && styles.topicActive]}
                  >
                    <Text style={styles.topicText}>
                      {t} {active && "✓"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.title}>Community name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter name"
              placeholderTextColor="#777"
              style={styles.input}
            />
          </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.title}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, { height: 120 }]}
              placeholder="Describe your community"
              placeholderTextColor="#777"
            />
          </View>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.title}>Extras (optional)</Text>

            {/* RULES */}
            <Text style={styles.subTitle}>Rules</Text>
            {rules.map((r, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.item}>• {r}</Text>
                <TouchableOpacity
                  onPress={() => setRules(rules.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TextInput
              placeholder="Add rule and press enter"
              placeholderTextColor="#777"
              style={styles.input}
              onSubmitEditing={(e) => {
                const val = e.nativeEvent.text.trim();
                if (val) setRules([...rules, val]);
              }}
            />

            {/* FAQS */}
            <Text style={styles.subTitle}>FAQs</Text>

            {faqs.map((f, i) => (
              <View key={i} style={styles.faqCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Question"
                  placeholderTextColor="#777"
                  value={f.q}
                  onChangeText={(q) =>
                    setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, q } : x)))
                  }
                />
                <TextInput
                  style={[styles.input, { height: 80 }]}
                  multiline
                  placeholder="Answer"
                  placeholderTextColor="#777"
                  value={f.a}
                  onChangeText={(a) =>
                    setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, a } : x)))
                  }
                />
                <TouchableOpacity
                  onPress={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.remove}>Remove FAQ</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setFaqs([...faqs, { q: "", a: "" }])}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add FAQ</Text>
            </TouchableOpacity>

            {/* IMAGE */}
            <Text style={styles.subTitle}>Profile image</Text>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.primaryText}>Choose image</Text>
            </TouchableOpacity>

            {imagePreview && (
              <Image source={{ uri: imagePreview }} style={styles.image} />
            )}
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* ACTION BUTTON */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            if (step < TOTAL_STEPS) {
              if (validateStep()) setStep(step + 1);
            } else {
              handleSubmit();
            }
          }}
        >
          <Text style={styles.primaryButtonText}>
            {step === TOTAL_STEPS ? "Create community" : "Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  progressTrack: {
    height: 4,
    backgroundColor: "#222",
    borderRadius: 2,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
  },

  progressText: {
    color: "#888",
    fontSize: 12,
    marginTop: 6,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  subTitle: {
    color: "#bbb",
    marginTop: 16,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  topic: {
    backgroundColor: "#222",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  topicActive: {
    backgroundColor: "#4f46e5",
  },

  topicText: {
    color: "#fff",
  },

  item: {
    color: "#ccc",
    marginBottom: 4,
  },

  imagePicker: {
    paddingVertical: 10,
  },

  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginTop: 10,
  },

  primaryButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  primaryText: {
    color: "#4f46e5",
  },

  error: {
    color: "#ff4d4f",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  faqCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  remove: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 4,
  },

  addButton: {
    paddingVertical: 10,
  },

  addButtonText: {
    color: "#4f46e5",
    fontSize: 16,
    fontWeight: "500",
  },
});
