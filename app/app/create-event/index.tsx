import { useEffect, useState } from "react";
import { Alert, View, Text, TouchableOpacity, TextInput, Image, ScrollView, Platform, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { NeoButtonLoader } from '@/components/ui/neo-loader';
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import DateTimePicker from "@react-native-community/datetimepicker";
import Markdown from "react-native-markdown-display";
import { Check, X, MapPin, Calendar, Clock, DollarSign, Users, ChevronDown, Upload } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker"; 

import { getCommunities, createEvent as createEventApi } from "@/lib/api";
import { useEventStore } from "@/lib/stores/eventStore";
import { useAuth } from "@/lib/authContext";

const SINGAPORE_AREAS = [
  "Marina Bay",
  "Orchard",
  "Bugis",
  "Tiong Bahru",
  "Holland Village",
  "Sentosa",
  "Woodlands",
  "Jurong East",
];

export default function CreateEvent() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ communityId?: string; communityName?: string }>();

  const [communities, setCommunities] = useState<Array<{ id: string; name: string }>>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // cover + basic
  const [cover, setCover] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [name, setName] = useState("");
  
  // date/time
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<{
    field: "start" | "end" | null;
    mode: "date" | "time";
  }>({ field: null, mode: "date" });

  // location
  const [locationChoice, setLocationChoice] = useState<"none" | "current" | "choose" | "manual">("none");
  const [chosenLocation, setChosenLocation] = useState<string>("");
  const [manualLocation, setManualLocation] = useState("");
  const [locationInstructions, setLocationInstructions] = useState("");

  // markdown description
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(false);

  // ticketing
  const [requireApproval, setRequireApproval] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("0");

  // options
  const [isPublic, setIsPublic] = useState(true);
  const [unlimited, setUnlimited] = useState(true);
  const [capacity, setCapacity] = useState<string>("");

  // misc
  const [error, setError] = useState<string | null>(null);

  // Fetch communities from backend
  useEffect(() => {
    let isMounted = true;
    const loadCommunities = async () => {
      setCommunitiesLoading(true);
      setFetchError(null);
      try {
        const data = await getCommunities();
        if (!isMounted) return;
        const list: Array<{ id: string; name: string }> = Array.isArray(data) ? data : data?.communities || [];
        setCommunities(list);
        if (params.communityId) {
          const matched = list.find((c) => c.id === params.communityId);
          if (matched) setSelectedCommunity(matched.id);
        }
      } catch (e: any) {
        if (!isMounted) return;
        setFetchError(e?.message || "Failed to load communities");
      } finally {
        if (isMounted) setCommunitiesLoading(false);
      }
    };
    loadCommunities();
    return () => { isMounted = false; };
  }, [params.communityId, params.communityName]);

  async function pickCover() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!r.canceled) setCover(r.assets[0].uri);
  }

  function hasUnsavedChanges() {
    return (
      cover !== null || name.trim() !== "" || start !== null || end !== null ||
      chosenLocation !== "" || description.trim() !== "" ||
      price !== "0" || capacity.trim() !== ""
    );
  }

  function handleExit() {
    if (!hasUnsavedChanges()) {
      router.back();
      return;
    }
    Alert.alert(
      "DISCARD?",
      "Unsaved changes will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]
    );
  }

  async function useCurrentLocation() {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const addr = [place.name, place.street, place.subregion, place.city].filter(Boolean).join(", ");
      setLocationChoice("current");
      setChosenLocation(addr || `${pos.coords.latitude}, ${pos.coords.longitude}`);
    } catch (e) {
      setError("Could not fetch location.");
    }
  }

  function showDateTime(field: "start" | "end", mode: "date" | "time") {
    setShowPicker({ field, mode });
  }

  function onChangeDateTime(event: any, selected?: Date) {
    const { field } = showPicker;
    setShowPicker({ field: null, mode: "date" });
    if (!selected) return;
    if (field === "start") setStart(selected);
    if (field === "end") setEnd(selected);
  }

  function canSubmit() {
    if (!selectedCommunity) return false;
    if (name.trim().length < 3) return false;
    if (!start || !end) return false;
    if (start > end) return false;
    if (!chosenLocation) return false;
    if (description.trim().length < 10) return false;
    if (isPaid && Number(price) <= 0) return false;
    if (!unlimited && Number(capacity) <= 0) return false;
    return true;
  }

  function handleCreate() {
    if (!canSubmit()) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    const selected = communities.find((c) => c.id === selectedCommunity);
    if (!selected) return;

    const payload: any = {
      communityId: selected.id,
      organizerId: user?.id || null,
      name: name.trim(),
      cover_url: cover || undefined,
      start_at: start?.toISOString(),
      end_at: end?.toISOString(),
      location_text: chosenLocation,
      location_instructions: locationInstructions.trim() || undefined,
      description: description,
      require_approval: requireApproval,
      is_paid: isPaid,
      price: isPaid ? Number(price) : 0,
      visibility: isPublic ? "public" : "private",
      capacity: unlimited ? null : Number(capacity) || null,
    };

    setIsSubmitting(true);
    createEventApi(payload)
      .then(async () => {
        const { fetchEvents } = useEventStore.getState();
        await fetchEvents(true);
        Alert.alert("SUCCESS", "Event created!");
        router.push("/home");
      })
      .catch((e: any) => setError(e?.message || "Failed to create event."))
      .finally(() => setIsSubmitting(false));
  }

  return (
    <View className="flex-1 bg-neo-bg">
      {/* HEADER */}
      <View className="bg-neo-yellow border-b-4 border-black px-4 pt-12 pb-4 flex-row items-center justify-between z-10">
        <TouchableOpacity onPress={handleExit} className="bg-neo-red border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]">
          <X size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
        <Text className="text-xl font-black uppercase text-black tracking-widest hidden sm:flex">Create Event</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canSubmit() || isSubmitting}
          className={`border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000] ${(!canSubmit() || isSubmitting) ? 'bg-gray-300 opacity-50' : 'bg-neo-bg'}`}
        >
          <Check size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        
        {/* TEMPLATE BANNER */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/create-event/advanced', params: selectedCommunity ? { community_id: selectedCommunity } : {} })}
          className="bg-black border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_#888] active:translate-y-1 active:shadow-none flex-row items-center justify-between"
        >
          <View>
            <Text className="text-white font-black uppercase text-lg">✨ Use a Template</Text>
            <Text className="text-gray-300 font-bold text-xs">Fast-track your event creation</Text>
          </View>
          <Text className="text-white text-2xl">→</Text>
        </TouchableOpacity>

        {/* COVER IMAGE */}
        <TouchableOpacity onPress={pickCover} className="mb-8 w-full h-48 bg-white border-4 border-black border-dashed items-center justify-center shadow-[4px_4px_0px_0px_#000] active:bg-neo-bg">
          {cover ? (
             <Image source={{ uri: cover }} className="w-full h-full" resizeMode="cover" />
          ) : (
             <View className="items-center">
                <Upload size={32} color="#000" strokeWidth={3} className="mb-2" />
                <Text className="font-black uppercase text-gray-500">Upload Cover</Text>
             </View>
          )}
        </TouchableOpacity>

        {/* DETAILS SECTION */}
        <View className="bg-white border-4 border-black p-4 mb-8 shadow-[8px_8px_0px_0px_#000]">
           <Text className="font-black text-2xl uppercase mb-6 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
             Basics
           </Text>

           {/* COMMUNITY */}
           <Text className="font-bold uppercase text-xs mb-2">Host Community</Text>
           <View className="border-4 border-black bg-neo-bg mb-4">
              <Picker
                selectedValue={selectedCommunity}
                onValueChange={(itemValue) => setSelectedCommunity(itemValue)}
                style={{ height: 50, width: '100%' }}
              >
                <Picker.Item label="Select Community..." value={null} color="#999" />
                {communities.map((c) => (
                  <Picker.Item key={c.id} label={c.name} value={c.id} color="#000" />
                ))}
              </Picker>
           </View>

           {/* NAME */}
           <Text className="font-bold uppercase text-xs mb-2">Event Title</Text>
           <TextInput
              className="bg-white border-4 border-black p-4 font-bold text-lg text-black mb-4 focus:bg-neo-yellow focus:outline-none"
              placeholder="e.g. Friday Night Coding"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
           />

           {/* DATE/TIME */}
           <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                 <Text className="font-bold uppercase text-xs mb-2">Start</Text>
                 <TouchableOpacity onPress={() => showDateTime("start", "date")} className="bg-neo-bg border-4 border-black p-3 h-14 justify-center">
                    <Text className="font-bold text-black">{start ? start.toLocaleDateString() : "Date"}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => showDateTime("start", "time")} className="mt-2 bg-neo-bg border-4 border-black p-3 h-14 justify-center">
                    <Text className="font-bold text-black">{start ? start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Time"}</Text>
                 </TouchableOpacity>
              </View>
              <View className="flex-1">
                 <Text className="font-bold uppercase text-xs mb-2">End</Text>
                 <TouchableOpacity onPress={() => showDateTime("end", "date")} className="bg-neo-bg border-4 border-black p-3 h-14 justify-center">
                    <Text className="font-bold text-black">{end ? end.toLocaleDateString() : "Date"}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => showDateTime("end", "time")} className="mt-2 bg-neo-bg border-4 border-black p-3 h-14 justify-center">
                    <Text className="font-bold text-black">{end ? end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Time"}</Text>
                 </TouchableOpacity>
              </View>
           </View>

           {showPicker.field && (
              <DateTimePicker
                value={showPicker.field === "start" ? (start || new Date()) : (end || new Date())}
                mode={showPicker.mode}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(e, val) => onChangeDateTime(e, val as Date | undefined)}
              />
           )}
        </View>

        {/* LOCATION SECTION */}
        <View className="bg-white border-4 border-black p-4 mb-8 shadow-[8px_8px_0px_0px_#000] rotate-1">
           <Text className="font-black text-2xl uppercase mb-6 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
             Location
           </Text>
           
           <View className="flex-row gap-2 mb-4 flex-wrap">
              <TouchableOpacity onPress={useCurrentLocation} className="bg-black border-2 border-black px-3 py-2 rounded-full active:bg-gray-800">
                 <Text className="text-white font-bold text-xs uppercase">📍 Current</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLocationChoice("choose")} className="bg-white border-2 border-black px-3 py-2 rounded-full active:bg-neo-yellow">
                 <Text className="text-black font-bold text-xs uppercase">List</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLocationChoice("manual")} className="bg-white border-2 border-black px-3 py-2 rounded-full active:bg-neo-yellow">
                 <Text className="text-black font-bold text-xs uppercase">Type</Text>
              </TouchableOpacity>
           </View>

           {locationChoice === "choose" && (
              <View className="flex-row flex-wrap gap-2 mb-4">
                 {SINGAPORE_AREAS.map(a => (
                    <TouchableOpacity key={a} onPress={() => { setChosenLocation(a); setLocationChoice("none"); }} className="bg-neo-bg border-2 border-black px-2 py-1">
                       <Text className="font-bold text-xs">{a}</Text>
                    </TouchableOpacity>
                 ))}
              </View>
           )}

           {locationChoice === "manual" && (
              <TextInput
                className="bg-white border-2 border-black p-2 font-bold mb-4"
                placeholder="Type address..."
                value={manualLocation}
                onChangeText={(t) => { setManualLocation(t); setChosenLocation(t); }}
              />
           )}

           {chosenLocation ? (
              <View className="bg-neo-yellow border-2 border-black p-3 mb-4">
                 <Text className="font-black uppercase text-xs mb-1">Selections:</Text>
                 <Text className="font-bold text-lg leading-5">{chosenLocation}</Text>
              </View>
           ) : null}

           <TextInput
              className="bg-white border-4 border-black p-3 font-bold"
              placeholder="Directions / Landmark details..."
              value={locationInstructions}
              onChangeText={setLocationInstructions}
           />
        </View>

        {/* DESCRIPTION SECTION */}
        <View className="bg-white border-4 border-black p-4 mb-8 shadow-[8px_8px_0px_0px_#000]">
           <View className="flex-row justify-between items-center mb-4 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
              <Text className="font-black text-2xl uppercase">Description</Text>
              <TouchableOpacity onPress={() => setPreview(!preview)}>
                 <Text className="font-black underline uppercase text-sm">{preview ? "Edit" : "Preview"}</Text>
              </TouchableOpacity>
           </View>
           
           {!preview ? (
              <TextInput
                className="bg-white border-4 border-black p-4 font-bold text-lg min-h-[200px] text-black focus:bg-neo-yellow focus:outline-none"
                multiline
                textAlignVertical="top"
                placeholder="Markdown supported. # Heading, **bold**."
                value={description}
                onChangeText={setDescription}
              />
           ) : (
              <View className="bg-neo-bg border-4 border-black p-4 min-h-[200px]">
                 <Markdown style={{ body: {fontFamily: 'SpaceGrotesk_700Bold'} }}>{description}</Markdown>
              </View>
           )}
        </View>

        {/* SETTINGS SECTION */}
        <View className="bg-white border-4 border-black p-4 mb-8 shadow-[8px_8px_0px_0px_#000] -rotate-1">
           <Text className="font-black text-2xl uppercase mb-6 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
             Settings
           </Text>
           
           {/* Approval */}
           <View className="flex-row justify-between items-center mb-4 pb-4 border-b-2 border-gray-200">
              <Text className="font-black uppercase">Require Approval</Text>
              <Switch value={requireApproval} onValueChange={setRequireApproval} trackColor={{false: '#000', true: '#FFD93D'}} thumbColor={requireApproval ? '#000' : '#fff'} />
           </View>

            {/* Paid */}
           <View className="flex-row justify-between items-center mb-4 pb-4 border-b-2 border-gray-200">
              <Text className="font-black uppercase">Paid Event</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{false: '#000', true: '#FF6B6B'}} thumbColor={isPaid ? '#000' : '#fff'} />
           </View>
           {isPaid && (
              <View className="flex-row items-center border-4 border-black p-2 mb-4 bg-neo-bg">
                 <DollarSign size={20} color="#000" />
                 <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" className="flex-1 font-black text-lg ml-2" />
              </View>
           )}
           
           {/* Public */}
           <View className="flex-row mb-4">
             <TouchableOpacity onPress={() => setIsPublic(true)} className={`flex-1 border-2 border-black p-3 items-center ${isPublic ? 'bg-black' : 'bg-white'}`}>
                <Text className={`font-black uppercase ${isPublic ? 'text-white' : 'text-black'}`}>Public</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setIsPublic(false)} className={`flex-1 border-2 border-black p-3 items-center ${!isPublic ? 'bg-black' : 'bg-white'}`}>
                <Text className={`font-black uppercase ${!isPublic ? 'text-white' : 'text-black'}`}>Private</Text>
             </TouchableOpacity>
           </View>

           {/* Capacity */}
           <View className="flex-row mb-4">
             <TouchableOpacity onPress={() => setUnlimited(true)} className={`flex-1 border-2 border-black p-3 items-center ${unlimited ? 'bg-black' : 'bg-white'}`}>
                <Text className={`font-black uppercase ${unlimited ? 'text-white' : 'text-black'}`}>Unlimited</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setUnlimited(false)} className={`flex-1 border-2 border-black p-3 items-center ${!unlimited ? 'bg-black' : 'bg-white'}`}>
                <Text className={`font-black uppercase ${!unlimited ? 'text-white' : 'text-black'}`}>Limit</Text>
             </TouchableOpacity>
           </View>
           {!unlimited && (
              <View className="flex-row items-center border-4 border-black p-2 mb-4 bg-neo-bg">
                 <Users size={20} color="#000" />
                 <TextInput value={capacity} onChangeText={setCapacity} keyboardType="numeric" placeholder="Max Attendees" className="flex-1 font-black text-lg ml-2" />
              </View>
           )}
        </View>

        {error && (
            <View className="bg-neo-red border-4 border-black p-4 mb-4 shadow-[4px_4px_0px_0px_#000]">
                <Text className="font-black uppercase text-black">⚠ {error}</Text>
            </View>
        )}

        <TouchableOpacity 
            onPress={handleCreate} 
            disabled={!canSubmit() || isSubmitting}
            className={`p-5 border-4 border-black items-center shadow-[6px_6px_0px_0px_#000] active:translate-y-1 active:shadow-none bg-neo-accent ${(!canSubmit() || isSubmitting) ? 'bg-gray-400 opacity-50' : 'bg-neo-red'}`} 
        >
             {isSubmitting ? <NeoButtonLoader /> : <Text className="font-black uppercase text-2xl text-white">🚀 Launch Event</Text>}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
