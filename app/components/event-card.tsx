import { TouchableOpacity, View, Text, Image } from "react-native";
import { EventProps } from "@/utils/types";

export default function EventCard({
  event,
  onPress,
}: {
  event: EventProps;
  onPress: () => void;
}) {
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "TBD";
  const formattedTime = (!event.startAnytime && event.startTime)
    ? new Date(event.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : event.startAnytime ? "Anytime" : "";

  const isPaid = event.is_paid && (event.price ?? 0) > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      className="w-full bg-white border-2 border-black mb-6 shadow-[4px_4px_0px_0px_#000] active:translate-y-[2px] active:shadow-none"
    >
      {/* Image Section - Default aspect ratio 16:9 or similar */}
      <View className="w-full h-48 border-b-4 border-black bg-neo-bg relative overflow-hidden">
        {event.cover_image ? (
          <Image
            source={{ uri: event.cover_image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
            <View className="flex-1 items-center justify-center bg-neo-yellow">
                <Text className="text-6xl">📅</Text>
            </View>
        )}
        
        {/* Date Sticker */}
        <View className="absolute top-4 left-4 bg-white border-4 border-black p-2 -rotate-3">
            <Text className="text-black font-black uppercase text-xs">{formattedDate}</Text>
        </View>

        {/* Price Sticker */}
        <View className="absolute bottom-4 right-4 bg-neo-red border-4 border-black px-3 py-1 rotate-2">
            <Text className="text-white font-black uppercase text-sm">
                {isPaid ? `$${event.price?.toFixed(2)}` : "FREE"}
            </Text>
        </View>
      </View>

      {/* Content Section */}
      <View className="p-4 bg-white">
        <Text className="text-3xl font-black uppercase text-black leading-none mb-2" numberOfLines={2}>
            {event.name}
        </Text>
        
        <View className="flex-row items-center gap-2 mb-2">
            <View className="bg-neo-bg border-2 border-black px-2 py-0.5">
                <Text className="text-xs font-bold uppercase">{formattedTime}</Text>
            </View>
            {event.location && (
                <Text className="text-black font-bold uppercase text-xs truncate max-w-[200px]" numberOfLines={1}>
                    @ {event.location}
                </Text>
            )}
        </View>

        {event.description && (
             <Text className="text-black/60 font-medium text-sm leading-tight" numberOfLines={2}>
                {event.description}
            </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
