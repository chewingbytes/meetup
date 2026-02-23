import { useState } from "react";
import { Alert, View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ChevronLeft, X, Plus, Trash2, Upload } from "lucide-react-native";

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
  const [currentRule, setCurrentRule] = useState("");
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
      "DISCARD CHANGES?",
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

  function addRule() {
    if (currentRule.trim().length > 0) {
      setRules([...rules, currentRule.trim()]);
      setCurrentRule("");
    }
  }

  function handleSubmit() {
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
    router.push("/explore");
  }

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <View className="flex-1 bg-neo-bg">
      {/* HEADER */}
      <View className="bg-neo-yellow border-b-4 border-black px-4 pt-12 pb-4 flex-row items-center justify-between z-10">
        <TouchableOpacity
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="bg-white border-2 border-black p-2 active:translate-x-1 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
        >
          <ChevronLeft size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>

        <Text className="text-xl font-black uppercase text-black tracking-widest hidden sm:flex">
          Create Community
        </Text>

        <TouchableOpacity 
          onPress={handleExit}
          className="bg-neo-red border-2 border-black p-2 active:translate-x-1 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
        >
          <X size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* PROGRESS BAR */}
      <View className="px-6 py-6 border-b-4 border-black bg-white">
        <View className="flex-row justify-between mb-2">
          <Text className="font-bold text-black uppercase tracking-wider">Start Building</Text>
          <Text className="font-bold text-black font-space-bold">
            {step} / {TOTAL_STEPS}
          </Text>
        </View>
        <View className="h-6 w-full bg-white border-4 border-black">
          <View
            className="h-full bg-neo-red border-r-4 border-black"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        
        {/* STEP 1: TOPICS */}
        {step === 1 && (
          <View>
            <Text className="text-4xl md:text-6xl font-black uppercase text-black mb-2 leading-none">
              Choose 3 Topics
            </Text>
            <Text className="text-black font-bold text-lg mb-8 border-l-4 border-neo-yellow pl-4">
              What is your community about?
            </Text>
            
            <View className="flex-row flex-wrap gap-3">
              {ALL_TOPICS.map((t) => {
                const active = topics.includes(t);
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => toggleTopic(t)}
                    activeOpacity={0.8}
                    className={`border-4 border-black px-4 py-3 transform transition-all duration-100 ${
                      active 
                        ? "bg-neo-yellow translate-x-[2px] translate-y-[2px] shadow-none rotate-1" 
                        : "bg-white shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1"
                    }`}
                  >
                    <Text className="font-bold text-black uppercase tracking-tight">
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: NAME */}
        {step === 2 && (
          <View>
             <Text className="text-4xl md:text-6xl font-black uppercase text-black mb-2 leading-none">
              Name It
            </Text>
            <Text className="text-black font-bold text-lg mb-8 border-l-4 border-neo-yellow pl-4">
              Give your community a punchy name.
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-black uppercase mb-2 ml-1 tracking-widest">Community Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="E.g. The Night Owls"
                placeholderTextColor="#999"
                className="bg-white border-4 border-black p-4 font-bold text-xl text-black shadow-[4px_4px_0px_0px_#000] focus:bg-neo-yellow focus:outline-none h-16"
              />
            </View>
            {name.length > 0 && name.length < 5 && (
               <View className="bg-neo-red border-2 border-black p-2 mt-2 transform -rotate-1">
                 <Text className="text-black font-bold uppercase">
                   ⚠ Name must be at least 5 characters!
                 </Text>
               </View>
            )}
          </View>
        )}

        {/* STEP 3: DESCRIPTION */}
        {step === 3 && (
          <View>
            <Text className="text-4xl md:text-6xl font-black uppercase text-black mb-2 leading-none">
              Describe It
            </Text>
            <Text className="text-black font-bold text-lg mb-8 border-l-4 border-neo-yellow pl-4">
              Tell people what to expect.
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-black uppercase mb-2 ml-1 tracking-widest">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                placeholder="What do you do? Who is this for?"
                placeholderTextColor="#999"
                textAlignVertical="top"
                className="bg-white border-4 border-black p-4 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000] h-48 focus:bg-neo-yellow focus:outline-none"
              />
            </View>
          </View>
        )}

        {/* STEP 4: EXTRAS */}
        {step === 4 && (
          <View>
             <Text className="text-4xl md:text-6xl font-black uppercase text-black mb-2 leading-none">
              Final Touches
            </Text>
            <Text className="text-black font-bold text-lg mb-8 border-l-4 border-neo-yellow pl-4">
              Add rules, FAQs, and a cover image.
            </Text>

            {/* RULES SECTION */}
            <View className="mb-10 border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] rotate-1">
              <Text className="font-black text-2xl uppercase mb-4 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
                House Rules
              </Text>
              
              {rules.map((r, i) => (
                <View key={i} className="flex-row items-center justify-between mb-3 bg-neo-bg border-2 border-black p-3">
                  <Text className="font-bold flex-1 mr-2">{i+1}. {r}</Text>
                  <TouchableOpacity
                    onPress={() => setRules(rules.filter((_, idx) => idx !== i))}
                    className="bg-neo-red border-2 border-black p-1 active:translate-y-1"
                  >
                    <Trash2 size={16} color="#000" />
                  </TouchableOpacity>
                </View>
              ))}

              <View className="flex-row items-center mt-2">
                <TextInput
                  placeholder="Add a rule..."
                  placeholderTextColor="#999"
                  value={currentRule}
                  onChangeText={setCurrentRule}
                  onSubmitEditing={addRule}
                  className="flex-1 bg-white border-2 border-black p-3 font-bold mr-2 h-12"
                />
                <TouchableOpacity 
                  onPress={addRule}
                  className="bg-black p-3 border-2 border-black active:translate-y-1 active:bg-neo-yellow h-12 justify-center"
                >
                  <Plus size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* FAQs */}
            <View className="mb-10 border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000] -rotate-1">
               <Text className="font-black text-2xl uppercase mb-4 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
                FAQs
              </Text>
              
              {faqs.map((f, i) => (
                <View key={i} className="mb-6 bg-neo-bg border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
                   <View className="flex-row justify-between mb-2 border-b-2 border-black pb-1">
                      <Text className="font-black uppercase">Q&A #{i+1}</Text>
                      <TouchableOpacity
                        onPress={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                      >
                         <Trash2 size={20} color="#FF6B6B" strokeWidth={3} />
                      </TouchableOpacity>
                   </View>
                   
                   <TextInput
                      className="border-2 border-black bg-white p-2 font-bold mb-2 focus:bg-neo-yellow"
                      placeholder="Question"
                      value={f.q}
                      onChangeText={(q) =>
                        setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, q } : x)))
                      }
                    />
                    <TextInput
                      className="border-2 border-black bg-white p-2 h-20 font-bold focus:bg-neo-yellow"
                      multiline
                      textAlignVertical="top"
                      placeholder="Answer"
                      value={f.a}
                      onChangeText={(a) =>
                        setFaqs(faqs.map((x, idx) => (idx === i ? { ...x, a } : x)))
                      }
                    />
                </View>
              ))}

              <TouchableOpacity
                onPress={() => setFaqs([...faqs, { q: "", a: "" }])}
                className="bg-neo-yellow border-4 border-black p-3 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none"
              >
                <Text className="font-black uppercase text-lg">+ Add Question</Text>
              </TouchableOpacity>
            </View>

            {/* IMAGE */}
            <View className="mb-8">
               <Text className="font-black text-xl uppercase mb-2 ml-1 tracking-widest">Cover Image</Text>
               <TouchableOpacity 
                onPress={pickImage}
                className="bg-white border-4 border-black border-dashed h-48 items-center justify-center mb-4 active:bg-neo-bg"
               >
                  {imagePreview ? (
                    <Image source={{ uri: imagePreview }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="items-center">
                        <Upload size={32} color="#000" strokeWidth={3} className="mb-2" />
                        <Text className="font-bold text-gray-500 uppercase">Tap to upload</Text>
                    </View>
                  )}
               </TouchableOpacity>
            </View>
          </View>
        )}

        {error && (
          <View className="bg-neo-red border-4 border-black p-4 mb-4 rotate-1 shadow-[4px_4px_0px_0px_#000]">
             <Text className="font-black text-black text-lg uppercase">⚠ {error}</Text>
          </View>
        )}
      </ScrollView>

      {/* FOOTER ACTION */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-neo-bg border-t-4 border-black pb-8">
        <TouchableOpacity
          className={`${step === TOTAL_STEPS ? 'bg-neo-red' : 'bg-black'} p-4 border-4 border-black items-center shadow-[4px_4px_0px_0px_#888] active:translate-y-1 active:shadow-none active:translate-x-1`}
          onPress={() => {
            if (step < TOTAL_STEPS) {
              if (validateStep()) setStep(step + 1);
            } else {
              handleSubmit();
            }
          }}
        >
          <Text className={`font-black uppercase text-2xl ${step === TOTAL_STEPS ? 'text-black' : 'text-white'}`}>
            {step === TOTAL_STEPS ? "Create Community!" : "Continue →"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
