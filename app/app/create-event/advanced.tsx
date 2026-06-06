import { useAuth } from "@/lib/authContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Plus,
  Users,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Assuming these API interactions remain the same
// In a real scenario, I'd check the exact signature of createEvent
// But based on the file read, it takes an object.
import { NeoButtonLoader, NeoLoader } from "@/components/ui/neo-loader";
import { createEvent, getEventTemplates } from "@/lib/api";

/* Types for templates */
interface EventTemplate {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_capacity: number;
  color: string;
  icon: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const community_id = (params.community_id as string) || "";
  const organizer_id = user?.id || "";

  const [step, setStep] = useState<"template" | "details">("template");
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EventTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // HH:MM
  const [capacity, setCapacity] = useState("50");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  useEffect(() => {
    loadTemplates();
  }, [community_id]);

  const loadTemplates = async () => {
    if (!community_id) {
      setLoading(false);
      return;
    }
    try {
      const data = await getEventTemplates(community_id);
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setCapacity(String(template.default_capacity));
    setStep("details");
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setName("");
    setDescription("");
    setCapacity("50");
    setStep("details");
  };

  const handleCreateEvent = async () => {
    if (!name || !startDate || !startTime) {
      Alert.alert("Error", "Please fill in Name, Date, and Time");
      return;
    }

    try {
      setSubmitting(true);

      // Basic ISO string construction
      // Ideally use a date library like date-fns or dayjs
      const startAt = `${startDate}T${startTime}:00Z`;
      // Calculcate end time roughly (2 hours)
      const endDate = new Date(
        new Date(startAt).getTime() + 2 * 60 * 60 * 1000,
      );
      const endAt = endDate.toISOString();

      await createEvent({
        name,
        description,
        start_at: startAt,
        end_at: endAt,
        location_text: location,
        community_id,
        organizer_id,
        capacity: parseInt(capacity) || 50,
        is_paid: isPaid,
        price: isPaid ? parseFloat(price) : 0,
        visibility: "public",
        organizerId: organizer_id,
        communityId: community_id,
      });

      Alert.alert("Success", "Hangout created!");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <NeoLoader />
      </View>
    );
  }

  /*
   * STEP 1: TEMPLATE SELECTION
   */
  if (step === "template") {
    return (
      <View className="flex-1 bg-[#FFFDF5]">
        {/* Header */}
        <View
          style={{ paddingTop: insets.top }}
          className="bg-[#FFD93D] border-b-4 border-black pb-4 px-4 sticky top-0 z-50 flex-row items-center justify-between"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
          >
            <ArrowLeft size={24} color="black" strokeWidth={3} />
          </TouchableOpacity>
          <Text className="text-xl font-black uppercase tracking-tighter text-black">
            Select Template
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_#000]">
            <Text className="font-bold text-lg mb-1">FAST TRACK </Text>
            <Text className="text-sm text-gray-800">
              Pick a blueprint to launch your event in seconds.
            </Text>
          </View>

          {/* Create from Scratch Button */}
          <TouchableOpacity
            onPress={handleCreateFromScratch}
            activeOpacity={1}
            className="bg-white border-4 border-black border-dashed p-6 items-center justify-center mb-8 active:bg-gray-50"
          >
            <Plus size={32} color="black" strokeWidth={3} />
            <Text className="font-black text-lg uppercase mt-2 text-center">
              Start from Scratch
            </Text>
          </TouchableOpacity>

          {/* Templates List */}
          {templates.length > 0 ? (
            <View className="gap-4">
              <Text className="font-black text-xl uppercase mb-2">
                Saved Templates
              </Text>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  onPress={() => handleSelectTemplate(template)}
                  activeOpacity={0.9}
                  className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="w-12 h-12 bg-neo-purple border-2 border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] mr-3">
                      <Text className="text-2xl">{template.icon || ""}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-xl uppercase leading-6">
                        {template.name}
                      </Text>
                      <View className="flex-row gap-2 mt-1">
                        <View className="bg-neo-green px-2 py-0.5 border border-black rounded-full">
                          <Text className="text-xs font-bold">
                            {template.duration_minutes}m
                          </Text>
                        </View>
                        <View className="bg-neo-blue px-2 py-0.5 border border-black rounded-full">
                          <Text className="text-xs font-bold">
                            {template.default_capacity} ppl
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text className="font-medium text-gray-800 border-t-2 border-black pt-2 border-dashed">
                    {template.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-10 opacity-50">
              <Text className="font-bold text-gray-500">
                No custom templates found.
              </Text>
            </View>
          )}

          <View className="h-20" />
        </ScrollView>
      </View>
    );
  }

  /*
   * STEP 2: DETAILS FORM
   */
  return (
    <View className="flex-1 bg-[#FFFDF5]">
      {/* Details Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-[#C4B5FD] border-b-4 border-black pb-4 px-4 sticky top-0 z-50 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => setStep("template")}
          className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
        >
          <ArrowLeft size={24} color="black" strokeWidth={3} />
        </TouchableOpacity>
        <Text className="text-xl font-black uppercase tracking-tighter text-black">
          Finalize Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Name Input */}
        <View className="mb-6">
          <Text className="font-black text-sm uppercase mb-1">Hangout Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="E.G. SUMMER BASH"
            placeholderTextColor="#999"
            className="bg-white border-4 border-black p-4 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000]"
          />
        </View>

        {/* Date & Time Row (Simplified text inputs for now) */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-1">
              Date (YYYY-MM-DD)
            </Text>
            <View className="relative">
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="2024-12-31"
                placeholderTextColor="#999"
                className="bg-white border-4 border-black p-3 font-bold text-md text-black shadow-[4px_4px_0px_0px_#000]"
              />
              <Calendar
                size={20}
                color="black"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-1">
              Time (24h)
            </Text>
            <View className="relative">
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="14:00"
                placeholderTextColor="#999"
                className="bg-white border-4 border-black p-3 font-bold text-md text-black shadow-[4px_4px_0px_0px_#000]"
              />
              <Clock
                size={20}
                color="black"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            </View>
          </View>
        </View>

        {/* Location */}
        <View className="mb-6">
          <Text className="font-black text-sm uppercase mb-1">Location</Text>
          <View className="relative">
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="WHERE WE MEETING?"
              placeholderTextColor="#999"
              className="bg-white border-4 border-black p-4 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000]"
            />
            <MapPin
              size={24}
              color="black"
              style={{ position: "absolute", right: 16, top: 16 }}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text className="font-black text-sm uppercase mb-1">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="TELL US MORE..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            className="bg-white border-4 border-black p-4 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000] min-h-[120px]"
            textAlignVertical="top"
          />
        </View>

        {/* Capacity & Price */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-1">Capacity</Text>
            <View className="relative">
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder="50"
                keyboardType="numeric"
                placeholderTextColor="#999"
                className="bg-white border-4 border-black p-3 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000]"
              />
              <Users
                size={20}
                color="black"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-black text-sm uppercase mb-1">Price ($)</Text>
            <View className="relative">
              <TextInput
                value={price}
                onChangeText={(t) => {
                  setPrice(t);
                  setIsPaid(t !== "" && t !== "0");
                }}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#999"
                className="bg-white border-4 border-black p-3 font-bold text-lg text-black shadow-[4px_4px_0px_0px_#000]"
              />
              <DollarSign
                size={20}
                color="black"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleCreateEvent}
          disabled={submitting}
          activeOpacity={1}
          className="bg-neo-accent border-4 border-black p-5 items-center shadow-[6px_6px_0px_0px_#000] active:translate-y-1 active:shadow-none mb-10"
        >
          {submitting ? (
            <NeoButtonLoader color="white" />
          ) : (
            <Text className="font-black text-2xl text-white uppercase tracking-widest">
              Launch Hangout
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
