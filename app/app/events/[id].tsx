import { NeoButtonLoader, NeoLoader } from "@/components/ui/neo-loader";
import {
  checkEventMembership,
  createEventTestimonial,
  joinEvent,
  leaveEvent,
} from "@/lib/api";
import { useEventStore } from "@/lib/stores/eventStore";
import { useAuthRedirect } from "@/lib/useAuthRedirect";
import { EventProps } from "@/utils/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Share2,
  Star,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthRedirect("/login");
  const [joined, setJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialRating, setTestimonialRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState("");
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);

  const { eventDetails, fetchEventById, isLoading } = useEventStore();
  const event = id
    ? (eventDetails[id as string] as EventProps | undefined)
    : null;

  console.log("EVENT DETAILS:", event);

  useEffect(() => {
    let mounted = true;
    async function loadEvent() {
      if (!id || !user) return;
      try {
        await fetchEventById(id as string);
        if (mounted) {
          try {
            const result = await checkEventMembership(user.id, id as string);
            setJoined(result?.isMember || false);
          } catch (err) {
            setJoined(false);
          }
        }
      } catch (err) {}
    }
    loadEvent();
    return () => {
      mounted = false;
    };
  }, [id, user, fetchEventById]);

  const formattedStart = useMemo(() => {
    if (!event?.start_at) return null;
    return new Date(event.start_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
  }, [event?.start_at]);

  const formattedTime = useMemo(() => {
    if (!event?.start_at) return null;
    return new Date(event.start_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [event?.start_at]);

  const priceLabel = useMemo(() => {
    if (event?.is_paid && event.price && event.price > 0)
      return `$${event.price.toFixed(2)}`;
    return "FREE";
  }, [event]);

  const isPastEvent = useMemo(() => {
    if (!event?.end_at) return false;
    return new Date(event.end_at) < new Date();
  }, [event?.end_at]);

  const onShare = async () => {
    try {
      await Share.share({ message: `Check out ${event?.name} on Meetup!` });
    } catch (error) {}
  };

  const handleJoin = async () => {
    if (!user || !event) return;
    try {
      setIsJoining(true);
      await joinEvent(user.id, event.id);
      setJoined(true);
      Alert.alert("YOU'RE IN!", "See you there.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!user || !event) return;
    Alert.alert("LEAVE EVENT?", "Are you sure?", [
      { text: "Stay", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLeaving(true);
            await leaveEvent(user.id, event.id);
            setJoined(false);
          } catch (err: any) {
            Alert.alert("Error", err.message);
          } finally {
            setIsLeaving(false);
          }
        },
      },
    ]);
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonialText.trim()) {
      Alert.alert("Error", "Please write something!");
      return;
    }
    try {
      setIsSubmittingTestimonial(true);
      await createEventTestimonial({
        user_id: user?.id,
        event_id: event?.id,
        rating: testimonialRating,
        text: testimonialText,
      });
      setShowTestimonialModal(false);
      setTestimonialText("");
      Alert.alert("THANKS!", "Your feedback rocks.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center">
        <NeoLoader />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neo-bg">
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER */}
        <View className="px-4 py-4 pt-12 bg-neo-bg border-b-4 border-black flex-row justify-between items-center z-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-white border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <ArrowLeft color="black" size={24} strokeWidth={3} />
          </TouchableOpacity>
          <Text
            className="font-black uppercase text-xl truncate max-w-[200px]"
            numberOfLines={1}
          >
            Event Details
          </Text>
          <TouchableOpacity
            onPress={onShare}
            className="bg-neo-yellow border-2 border-black p-2 active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
          >
            <Share2 color="black" size={24} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View className="h-64 w-full border-b-4 border-black bg-black relative">
          {event.cover_image ? (
            <Image
              source={{ uri: event.cover_image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-neo-bg flex items-center justify-center">
              <Text className="text-6xl">🎉</Text>
            </View>
          )}
          {/* PRICE TAG */}
          <View className="absolute bottom-4 right-8 bg-neo-accent border-4 border-black px-6 py-2 rotate-3 shadow-[4px_4px_0px_0px_#000]">
            <Text className="font-black text-2xl uppercase text-white">
              {priceLabel}
            </Text>
          </View>
        </View>

        <View className="p-5 pt-10">
          {/* TITLE */}
          <View className="mb-8">
            <Text className="text-4xl md:text-5xl font-black uppercase leading-9 mb-2">
              {event.name}
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {event.visibility === "private" && (
                <View className="bg-black px-2 py-1 border-2 border-transparent">
                  <Text className="text-neo-yellow font-bold uppercase text-xs">
                    Private Event
                  </Text>
                </View>
              )}
              {event.require_approval && (
                <View className="bg-neo-red px-2 py-1 border-2 border-black">
                  <Text className="text-white font-bold uppercase text-xs">
                    Approval Req.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* INFO CARD */}
          <View className="bg-white border-4 border-black p-5 mb-8 shadow-[8px_8px_0px_0px_#000]">
            <View className="flex-row items-center gap-4 mb-4 border-b-2 border-black pb-4">
              <View className="bg-neo-yellow border-2 border-black p-2">
                <Calendar color="black" size={24} />
              </View>
              <View>
                <Text className="font-black uppercase text-lg">
                  {formattedStart}
                </Text>
                <Text className="font-bold text-gray-500">{formattedTime}</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-4 mb-4 border-b-2 border-black pb-4">
              <View className="bg-neo-yellow border-2 border-black p-2">
                <MapPin color="black" size={24} />
              </View>
              <View className="flex-1">
                <Text className="font-black uppercase text-lg">
                  {event.location_text || "TBD"}
                </Text>
                {event.location_instructions && (
                  <Text className="font-bold text-gray-500 text-xs mt-1">
                    {event.location_instructions}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <View className="bg-neo-yellow border-2 border-black p-2">
                <Users color="black" size={24} />
              </View>
              <View>
                <Text className="font-black uppercase text-lg">
                  Who's Going?
                </Text>
                <Text className="font-bold text-gray-500">
                  {event.capacity
                    ? `Capacity: ${event.capacity}`
                    : "Unlimited space"}
                </Text>
              </View>
            </View>

            {/* Participants Previews */}
            {(event as any).participants &&
              (event as any).participants.length > 0 && (
                <View className="mt-4 pt-4 border-t-2 border-black">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="pl-1 pb-2 pt-1"
                  >
                    <View className="flex-row items-center">
                      {(event as any).participants
                        .slice(0, 6)
                        .map((p: any, index: number) => {
                          const colors = [
                            "bg-neo-blue",
                            "bg-neo-red",
                            "bg-neo-green",
                            "bg-neo-violet",
                            "bg-neo-yellow",
                            "bg-neo-pink",
                          ];
                          const bgColor = colors[index % colors.length];
                          return (
                            <TouchableOpacity
                              key={p.id}
                              onPress={() =>
                                router.push(`/profile/${p.id}` as any)
                              }
                              className={`w-12 h-12 ${bgColor} border-2 border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] mr-3 active:translate-y-[2px] active:shadow-none`}
                            >
                              {p.avatar_url ? (
                                <Image
                                  source={{ uri: p.avatar_url }}
                                  className="w-full h-full"
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text className="font-black text-white text-lg">
                                  {p.full_name?.charAt(0).toUpperCase() || "?"}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      {(event as any).participants.length > 6 && (
                        <TouchableOpacity
                          onPress={() =>
                            router.push(`/events/participants?id=${event.id}`)
                          }
                          className="w-12 h-12 bg-white border-2 border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none mr-4"
                        >
                          <Text className="font-black text-black">
                            +{(event as any).participants.length - 6}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </View>
              )}
          </View>

          {/* ACTIONS */}
          <View className="flex-row gap-4 mb-8">
            {!isPastEvent &&
              (!joined ? (
                <TouchableOpacity
                  onPress={handleJoin}
                  disabled={isJoining}
                  className="flex-1 bg-neo-red border-4 border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none"
                >
                  {isJoining ? (
                    <NeoButtonLoader color="white" />
                  ) : (
                    <Text className="font-black text-xl text-white uppercase">
                      RSVP Now
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleLeave}
                  disabled={isLeaving}
                  className="flex-1 bg-black border-4 border-black p-4 items-center shadow-[4px_4px_0px_0px_#888] active:translate-y-1 active:shadow-none"
                >
                  {isLeaving ? (
                    <NeoButtonLoader color="white" />
                  ) : (
                    <Text className="font-black text-xl text-white uppercase">
                      Attending ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
          </View>

          {/* PAST EVENT ACTION */}
          {isPastEvent && joined && (
            <TouchableOpacity
              className="bg-neo-yellow border-4 border-black p-4 mb-8 flex-row justify-center items-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-y-1"
              onPress={() => setShowTestimonialModal(true)}
            >
              <Star size={24} color="black" fill="black" />
              <Text className="font-black text-lg uppercase">Rate Event</Text>
            </TouchableOpacity>
          )}

          {/* ABOUT */}
          {event.description && (
            <View className="mb-8 p-4 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] -rotate-1">
              <Text className="font-black text-2xl uppercase mb-4 border-b-4 border-black pb-2 bg-neo-yellow -mx-4 -mt-4 px-4 pt-4">
                The Plan
              </Text>
              <Text className="font-bold text-lg leading-6">
                {event.description}
              </Text>
            </View>
          )}

          {/* ORGANIZER */}
          <View className="items-center py-6">
            <Text className="font-bold text-gray-500 uppercase text-xs">
              Organized by {event.organizer_id ?? "Unknown"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* TESTIMONIAL MODAL */}
      <Modal visible={showTestimonialModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-neo-bg border-t-4 border-black p-6 rounded-t-3xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-black text-2xl uppercase">
                Rate & Review
              </Text>
              <TouchableOpacity
                onPress={() => setShowTestimonialModal(false)}
                className="bg-neo-red border-2 border-black p-1"
              >
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setTestimonialRating(i)}
                >
                  <Star
                    size={40}
                    color="black"
                    fill={i <= testimonialRating ? "#FFD93D" : "transparent"}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              className="bg-white border-4 border-black p-4 font-bold text-lg min-h-[120px] mb-6 shadow-[4px_4px_0px_0px_#000]"
              multiline
              placeholder="How was it? Spill the tea..."
              textAlignVertical="top"
              value={testimonialText}
              onChangeText={setTestimonialText}
            />

            <TouchableOpacity
              onPress={handleSubmitTestimonial}
              disabled={isSubmittingTestimonial}
              className="bg-neo-red border-4 border-black p-4 items-center shadow-[4px_4px_0px_0px_#000] active:translate-y-1"
            >
              {isSubmittingTestimonial ? (
                <NeoButtonLoader color="white" />
              ) : (
                <Text className="font-black text-xl text-white uppercase">
                  Post Review
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
