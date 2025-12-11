import { TouchableOpacity, View, Text, Image } from "react-native";
import { EventProps } from "@/utils/types";

export default function EventCard({
  event,
  onPress,
}: {
  event: EventProps;
  onPress: () => void;

}) 
{
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
      <Image
        source={{ uri: event.image }}
        className="w-20 h-20 rounded-xl mr-4"
        resizeMode="cover"
      />

      {/* Right Content */}
      <View className="flex-1 justify-between">
        <Text className="text-white/70 text-lg font-normal">
          {event.interest}
        </Text>

        <Text className="text-white text-xl font-medium leading-tight mt-1">
          {event.title}
        </Text>

        <Text className="text-white/60 text-lg font-normal mt-1">
          {event.date} • {event.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
