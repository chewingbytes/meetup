import { TouchableOpacity, View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, MapPin, DollarSign } from "lucide-react-native";
import { EventProps } from "@/utils/types";

export default function EventCard({
  event,
  onPress,
}: {
  event: EventProps;
  onPress: () => void;
}) {
  const startDate = new Date(event.start_at);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = event.is_paid && (event.price ?? 0) > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full rounded-2xl overflow-hidden mb-4"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View className="w-full h-56 bg-slate-800">
        {event.cover_image ? (
          <Image
            source={{ uri: event.cover_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-slate-800 items-center justify-center">
            <Text className="text-3xl">📅</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
          style={{
            position: "absolute",
            inset: 0,
            padding: 16,
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          {/* Top-left pill (date) */}
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "rgba(0,0,0,0.55)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text className="text-white text-xs font-semibold">
              {formattedDate}
            </Text>
          </View>

          {/* Top-right pill (price/free) */}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.65)",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text className="text-white text-xs font-semibold">
              {isPaid ? `SGD $${event.price?.toFixed(2)}` : "Free"}
            </Text>
          </View>

          {/* Title */}
          <Text className="text-white text-xl font-semibold" numberOfLines={2}>
            {event.name}
          </Text>

          {/* Meta rows */}
          <View className="flex-row items-center gap-2">
            <Calendar size={14} color="#e5e7eb" />
            <Text className="text-white/80 text-sm">
              {formattedDate} · {formattedTime}
            </Text>
          </View>

          {event.location_text && (
            <View className="flex-row items-center gap-2">
              <MapPin size={14} color="#e5e7eb" />
              <Text className="text-white/80 text-sm" numberOfLines={1}>
                {event.location_text}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
}