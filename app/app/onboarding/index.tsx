import { NeoButtonLoader } from "@/components/ui/neo-loader";
import { auth } from "@/lib/api";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  Camera,
  FileText,
  Sparkles,
  User,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INTERESTS = [
  "Tech",
  "Design",
  "Music",
  "Food",
  "Outdoors",
  "Gaming",
  "Art",
  "Business",
  "Wellness",
  "Party",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; password?: string }>();
  const { signIn } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const handleNext = async () => {
    // Validation
    if (step === 0) {
      if (!username.trim()) {
        Alert.alert("Hold up", "We need a username to call you by.");
        return;
      }
    }

    // Step Transition
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Final Step (Interests)
      if (selectedInterests.length < 3) {
        Alert.alert(
          "Almost there",
          "Pick at least 3 interests so your feed isn't empty.",
        );
        return;
      }

      // Submit everything via signup
      const email = params.email as string | undefined;
      const password = params.password as string | undefined;
      if (!email || !password) {
        Alert.alert(
          "Missing info",
          "Email or password not provided from signup.",
        );
        return;
      }

      setIsLoading(true);
      try {
        let avatarUrl = uploadedImageUrl;

        // 1. Upload Image to Supabase if new image selected
        if (
          profileImage &&
          !uploadedImageUrl &&
          !profileImage.startsWith("http")
        ) {
          const { uri } = await FileSystem.getInfoAsync(profileImage);
          if (uri) {
            const fileExt =
              profileImage.split(".").pop()?.toLowerCase() || "jpg";
            const safeEmail = email.replace(/[^a-zA-Z0-9-_]/g, "_");
            const fileName = `${safeEmail}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const base64 = await FileSystem.readAsStringAsync(profileImage, {
              encoding: "base64",
            });
            const fileData = decode(base64);

            const { error: uploadError } = await supabase.storage
              .from("profile_pictures")
              .upload(filePath, fileData, {
                contentType: `image/${fileExt}`,
                upsert: true,
              });

            if (uploadError) {
              console.error("Supabase upload error:", uploadError);
            }

            const {
              data: { publicUrl },
            } = supabase.storage
              .from("profile_pictures")
              .getPublicUrl(filePath);

            avatarUrl = publicUrl;
            setUploadedImageUrl(publicUrl);
          }
        }

        // 2. Call server signup (creates user + profile)
        const { signUpUser, signUpError } = await auth.signUp(
          email,
          password,
          username,
          avatarUrl || "",
          bio,
          selectedInterests,
        );

        if (signUpError) {
          Alert.alert(
            "Sign Up Error",
            signUpError.message || "Failed to sign up",
          );
          return;
        }

        const { user, error } = await signIn(email, password);
        if (error) {
          Alert.alert("Sign In Error", error.message || "Failed to sign in");
          return;
        }
        if (user) {
          router.replace("/");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // Mock Image Picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const StepIndicator = () => (
    <View className="flex-row justify-center mb-8 gap-3">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className={`h-3 w-3 border-[2px] border-black ${
            i <= step ? "bg-[#FF6B6B]" : "bg-white"
          } ${i === step ? "transform scale-125" : ""}`}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View className="px-6 pt-4 pb-2 flex-row justify-between items-center">
              <Text className="font-black text-xs uppercase tracking-widest text-[#FF6B6B]">
                Setup Profile
              </Text>
              <Text className="font-bold text-xs uppercase text-black/40">
                Step {step + 1}/3
              </Text>
            </View>

            <View className="flex-1 px-6 pt-4">
              <StepIndicator />

              {/* STEP 1: Photo & Username */}
              {step === 0 && (
                <View className="flex-1 items-center pt-8">
                  <Text className="font-black text-3xl uppercase mb-2 text-center">
                    Who are you?
                  </Text>
                  <Text className="font-medium text-black/60 mb-10 text-center uppercase text-sm">
                    Show us your face (or not) and pick a handle.
                  </Text>

                  {/* Photo Upload */}
                  <TouchableOpacity
                    onPress={pickImage}
                    activeOpacity={0.8}
                    className="mb-10 relative"
                  >
                    <View
                      className={`w-40 h-40 border-[4px] border-black bg-white items-center justify-center shadow-[8px_8px_0px_0px_#000] rotate-2 ${profileImage ? "overflow-hidden" : ""}`}
                    >
                      {profileImage ? (
                        <Image
                          source={{ uri: profileImage }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Camera size={48} color="#000" strokeWidth={2} />
                      )}
                    </View>
                    {!profileImage && (
                      <View className="absolute -bottom-4 -right-4 bg-[#FFD93D] border-[3px] border-black p-2 -rotate-12 shadow-[4px_4px_0px_0px_white]">
                        <Text className="font-black text-xs uppercase">
                          Upload
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Username Input */}
                  <View className="w-full">
                    <Text className="font-bold mb-2 uppercase text-xs tracking-wider">
                      Username
                    </Text>
                    <View className="bg-white border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_#000] flex-row items-center">
                      <User
                        size={24}
                        color="#000"
                        className="mr-3 opacity-50"
                      />
                      <TextInput
                        placeholder="@username"
                        value={username}
                        onChangeText={setUsername}
                        className="flex-1 font-bold text-xl h-full p-0 leading-none" // Reset padding to align with icon
                        style={{ textAlignVertical: "center" }}
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 2: Bio */}
              {step === 1 && (
                <View className="flex-1 pt-8">
                  <Text className="font-black text-3xl uppercase mb-2 text-center">
                    Your Vibe
                  </Text>
                  <Text className="font-medium text-black/60 mb-10 text-center uppercase text-sm">
                    What makes you... you? Keep it short or yap away.
                  </Text>

                  <View className="w-full flex-1 max-h-[300px]">
                    <View className="flex-row justify-between mb-2 items-end">
                      <Text className="font-bold uppercase text-xs tracking-wider">
                        Bio
                      </Text>
                      <Text className="font-bold text-xs text-black/40">
                        {bio.length}/150
                      </Text>
                    </View>

                    <View className="bg-white border-[3px] border-black p-4 shadow-[8px_8px_0px_0px_#000] flex-1 -rotate-1">
                      <View className="mb-2 opacity-50">
                        <FileText size={24} color="#000" />
                      </View>
                      <TextInput
                        placeholder="I'm a designer who loves coffee and..."
                        value={bio}
                        onChangeText={setBio}
                        multiline
                        maxLength={150}
                        className="flex-1 font-medium text-lg text-black p-0"
                        style={{ textAlignVertical: "top" }}
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* STEP 3: Interests */}
              {step === 2 && (
                <View className="flex-1 pt-4">
                  <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-[#C4B5FD] border-[3px] border-black items-center justify-center rotate-6 mb-4 shadow-[4px_4px_0px_0px_#000]">
                      <Sparkles
                        size={32}
                        color="white"
                        fill="black"
                        strokeWidth={1}
                      />
                    </View>
                    <Text className="font-black text-3xl uppercase mb-2 text-center">
                      Interests
                    </Text>
                    <Text className="font-bold text-gray-500 uppercase tracking-wider text-center">
                      Pick at least 3
                    </Text>
                  </View>

                  <ScrollView contentContainerClassName="flex-row flex-wrap gap-3 justify-center pb-4">
                    {INTERESTS.map((interest, index) => {
                      const isSelected = selectedInterests.includes(interest);
                      return (
                        <TouchableOpacity
                          key={interest}
                          onPress={() => toggleInterest(interest)}
                          activeOpacity={0.8}
                          className={`
                        px-4 py-3 border-[3px] border-black mb-2
                        ${isSelected ? "bg-[#A7F3D0] -translate-y-1 shadow-[4px_4px_0px_0px_#000]" : "bg-white"}
                        ${index % 2 === 0 ? "rotate-1" : "-rotate-1"}
                      `}
                        >
                          <Text className="font-black text-sm uppercase">
                            {interest}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Footer Navigation */}
            <View className="px-6 pb-6 pt-4 border-t-[4px] border-black bg-white flex-row gap-4">
              {step > 0 && (
                <TouchableOpacity
                  onPress={handleBack}
                  className="flex-1 bg-white border-[3px] border-black py-4 items-center active:translate-y-1 active:shadow-none justify-center"
                >
                  <Text className="font-black text-xl uppercase text-black">
                    Back
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleNext}
                className={`flex-1 bg-[#FF6B6B] border-[3px] border-black py-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none flex-row justify-center ${step === 0 ? "w-full flex-none" : ""}`} // flex-none to respect flex-1 if parent has gap but wait..
                // Actually if step > 0, footer has two buttons, if step 0, one button usually
                style={{ flex: step === 0 ? 1 : 1 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <NeoButtonLoader color="white" />
                ) : (
                  <>
                    <Text className="font-black text-xl uppercase text-white mr-2">
                      {step === 2 ? "Let's Go" : "Next"}
                    </Text>
                    <ArrowRight size={24} color="#FFF" strokeWidth={3} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
