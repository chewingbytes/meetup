import { TouchableOpacity, View, Text, Image } from "react-native";
import { EventProps } from "@/utils/types";
import { Calendar, MapPin, DollarSign } from "lucide-react-native";

export default function EventCard({
  event,
  onPress,
}: {
  event: EventProps;
  onPress: () => void;
}) {
  // Parse and format date/time
  const startDate = new Date(event.start_at);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row w-full rounded-xl"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Left Image */}
      {event.cover_image ? (
        <Image
          source={{ uri: event.cover_image }}
          className="w-20 h-auto rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View className="w-20 h-20 rounded-xl mr-4 bg-gray-600 justify-center items-center">
          <Text className="text-2xl">📅</Text>
        </View>
      )}

      {/* Right Content */}
      <View className="flex-1 justify-between">
        {/* Event Name */}
        <Text className="text-white text-xl font-semibold leading-tight">
          {event.name}
        </Text>

        {/* Date & Time */}
        <View className="flex-row items-center gap-1 mt-1">
          <Calendar size={14} color="#a3a3a3" />
          <Text className="text-white/60 text-sm font-normal">
            {formattedDate} • {formattedTime}
          </Text>
        </View>

        {/* Location */}
        {event.location_text && (
          <View className="flex-row items-center gap-1 mt-1">
            <MapPin size={14} color="#a3a3a3" />
            <Text className="text-white/60 text-sm font-normal" numberOfLines={1}>
              {event.location_text}
            </Text>
          </View>
        )}

        {/* {event.is_paid && (
          <View className="flex-row items-center gap-1 mt-1">
            <DollarSign size={14} color="#a3a3a3" />
            <Text className="text-white/60 text-sm font-normal">
              SGD ${event.price?.toFixed(2)}
            </Text>
          </View>
        )} */}
      </View>
    </TouchableOpacity>
  );
}