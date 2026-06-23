import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import { createEventTemplate } from "@/lib/api";
import { NeoButtonLoader } from '@/components/ui/neo-loader';

const ICON_OPTIONS = ["📅", "🎉", "🎓", "🃏", "☕", "🎬", "🎵", "🎮", "🕰️", "🌭"];
const COLOR_OPTIONS = [
  "#FF6B6B",
  "#FFD93D",
  "#C4B5FD",
  "#6EE7B7",
  "#93C5FD",
  "#F472B6",
];

export default function CreateTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const community_id = (params.community_id as string) || "";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [defaultCapacity, setDefaultCapacity] = useState("50");
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTemplate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a template name");
      return;
    }

    try {
      setIsSubmitting(true);

      await createEventTemplate({
        community_id,
        name: name.trim(),
        description: description.trim(),
        duration_minutes: parseInt(durationMinutes, 10) || 120,
        default_capacity: parseInt(defaultCapacity, 10) || 50,
        icon: selectedIcon,
        color: selectedColor,
      });

      Alert.alert("Success", "Event template created successfully!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFFDF5]">
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 bg-[#FFD93D] border-b-4 border-black pb-4"
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={1}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
          >
            <ArrowLeft size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter text-black">New Template</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 120,
          paddingBottom: 100,
          paddingHorizontal: 20,
        }}
      >
        <View className="bg-white border-4 border-black p-4 mb-8 shadow-[4px_4px_0px_0px_#000] rotate-1">
          <Text className="font-black text-2xl uppercase mb-2">Build a Clone</Text>
          <Text className="font-bold text-sm">
            Create a reusable template for your recurring events. Save time, stay consistent.
          </Text>
        </View>

        <View className="mb-6">
          <Text className="font-black text-lg uppercase mb-2 bg-neo-green-light self-start px-2 border-2 border-black">
            Template Name <Text className="text-red-600">*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="E.G. WEEKLY COFFEE"
            placeholderTextColor="#999"
            className="bg-white border-4 border-black p-4 font-bold text-md text-black shadow-[4px_4px_0px_0px_#000] focus:bg-[#FFFDF5]"
          />
        </View>

        <View className="mb-6">
          <Text className="font-black text-lg uppercase mb-2">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="WHAT'S THE VIBE?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            className="bg-white border-4 border-black p-4 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000] min-h-[120px] focus:bg-[#FFFDF5]"
            textAlignVertical="top"
          />
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-2">Duration (Min)</Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="120"
              placeholderTextColor="#999"
              keyboardType="numeric"
              className="bg-white border-4 border-black p-3 font-bold text-lg text-center text-black shadow-[4px_4px_0px_0px_#000]"
            />
          </View>
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-2">Capacity</Text>
            <TextInput
              value={defaultCapacity}
              onChangeText={setDefaultCapacity}
              placeholder="50"
              placeholderTextColor="#999"
              keyboardType="numeric"
              className="bg-white border-4 border-black p-3 font-bold text-lg text-center text-black shadow-[4px_4px_0px_0px_#000]"
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="font-black text-lg uppercase mb-3 border-l-4 border-black pl-2">Choose Icon</Text>
          <View className="flex-row flex-wrap gap-3 justify-center">
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                activeOpacity={1}
                onPress={() => setSelectedIcon(icon)}
                className={`w-14 h-14 items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000]
                  ${selectedIcon === icon ? 'bg-neo-yellow translate-y-1 shadow-none' : 'bg-white'}`}
              >
                <Text className="text-2xl">{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-10">
          <Text className="font-black text-lg uppercase mb-3 border-l-4 border-black pl-2">Theme Color</Text>
          <View className="flex-row flex-wrap gap-4 justify-center">
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                activeOpacity={1}
                onPress={() => setSelectedColor(color)}
                style={{ backgroundColor: color }}
                className={`w-12 h-12 border-4 border-black items-center justify-center shadow-[4px_4px_0px_0px_#000]
                  ${selectedColor === color ? 'translate-y-1 shadow-none' : ''}`}
              >
                {selectedColor === color && <Check size={20} color="black" strokeWidth={4} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreateTemplate}
          disabled={isSubmitting}
          activeOpacity={1}
          className={`bg-neo-red border-4 border-black p-4 items-center mb-8 shadow-[6px_6px_0px_0px_#000]
            active:translate-y-1 active:shadow-none ${isSubmitting ? 'opacity-60' : ''}`}
        >
          {isSubmitting ? (
            <NeoButtonLoader color="white" />
          ) : (
            <Text className="font-black text-2xl text-white uppercase tracking-widest">Create Template</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
