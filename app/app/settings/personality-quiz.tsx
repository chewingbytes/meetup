import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { PersonalityType, QUIZ_QUESTIONS } from "@/data/quiz";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "expo-router";
import { ArrowLeft, Check, Sparkles } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PersonalityQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateUserProfile } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleSelect = async (optionIndex: number) => {
    // Save answer (string keys/values to match backend typing)
    const newAnswers = {
      ...answers,
      [String(currentQuestion.id)]: String(optionIndex),
    };
    setAnswers(newAnswers);

    // If more questions, go next
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 250); // Small delay for visual feedback
    } else {
      // Calculate result and save
      await submitQuiz(newAnswers);
    }
  };

  const calculateWinner = (
    finalAnswers: Record<string, string>,
  ): PersonalityType => {
    const scores: Record<PersonalityType, number> = {
      Connector: 0,
      Nurturer: 0,
      Organizer: 0,
      Catalyst: 0,
      Listener: 0,
      Facilitator: 0,
      Diplomat: 0,
    };

    QUIZ_QUESTIONS.forEach((q) => {
      const rawIdx = finalAnswers[String(q.id)];
      const selectedIdx = rawIdx != null ? parseInt(rawIdx, 10) : NaN;
      if (Number.isNaN(selectedIdx)) return;
      const points = q.options[selectedIdx]?.points;
      if (!points) return;
      Object.entries(points).forEach(([type, val]) => {
        scores[type as PersonalityType] += val;
      });
    });

    // Find highest score
    let winner: PersonalityType = "Connector";
    let maxScore = -1;

    (Object.keys(scores) as PersonalityType[]).forEach((t) => {
      if (scores[t] > maxScore) {
        maxScore = scores[t];
        winner = t;
      }
    });

    return winner;
  };

  const submitQuiz = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const result = calculateWinner(finalAnswers);

      // We'll store the raw answers (indices) and the result type
      // personality_answers needs to be JSON potentially, or just map of Q_ID -> OptionIdx

      await updateUserProfile({
        personality_type: result,
        personality_answers: finalAnswers,
      });

      Alert.alert("Quiz Complete!", `You are The ${result}!`, [
        { text: "Cool", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", "Failed to save results. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFDF5" }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="bg-[#FFD93D] px-5 pb-4 border-b-4 border-black flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1 active:shadow-none"
        >
          <ArrowLeft size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
        <Text className="text-2xl font-black uppercase tracking-tighter">
          Vibe Check
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Progress Bar */}
        <View className="mb-8">
          <View className="flex-row justify-between mb-2">
            <Text className="font-bold text-xs uppercase">
              Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
            </Text>
            <Text className="font-black text-xs uppercase">
              {Math.round(progress)}%
            </Text>
          </View>
          <View className="h-4 w-full bg-white border-2 border-black p-[2px]">
            <View
              className="h-full bg-neo-green border-r-2 border-black"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Question Card */}
        <View className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] mb-8">
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-[#C4B5FD] border-2 border-black items-center justify-center rounded-full mb-4 shadow-[4px_4px_0px_0px_#000]">
              <Sparkles size={32} color="#000" strokeWidth={2.5} />
            </View>
            <Text className="text-2xl font-black text-center uppercase leading-7">
              {currentQuestion.text}
            </Text>
          </View>

          <View className="gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected =
                answers[String(currentQuestion.id)] === String(idx);
              return (
                <TouchableOpacity
                  key={idx}
                  disabled={isSubmitting}
                  onPress={() => handleSelect(idx)}
                  activeOpacity={1}
                  className={`
                                p-4 border-4 border-black flex-row items-center justify-between
                                ${isSelected ? "bg-neo-blue" : "bg-white"}
                                active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_#000]
                            `}
                >
                  <Text
                    className={`font-bold text-lg flex-1 mr-4 ${isSelected ? "text-white" : "text-black"}`}
                  >
                    {opt.text}
                  </Text>
                  {isSelected && (
                    <View className="bg-white border-2 border-black p-1">
                      <Check size={16} color="#000" strokeWidth={4} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isSubmitting && (
          <View className="items-center">
            <NeoButtonLoader color="#000" />
            <Text className="font-bold uppercase mt-2">
              Calculating Vibe...
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
