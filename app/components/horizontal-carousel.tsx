import React from "react";
import { View, Text, FlatList, Dimensions } from "react-native";
import { ArrowDownRight } from "lucide-react-native";
import EventCard from "@/components/event-card";
import { EventProps } from "@/utils/types";

interface HorizontalCarouselProps {
  heading: string;
  eventChunks: EventProps[][];
  spacing?: number;
}

const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  heading,
  eventChunks,
  spacing = 16,
}) => {
  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.8;
  const computedSnapInterval = cardWidth + spacing;

  return (
    <View>
      {/* Heading */}
      <View className="flex-row w-full px-5 gap-x-1.5 items-center">
        <Text className="text-white font-medium text-2xl">{heading}</Text>
        <ArrowDownRight color="grey" size={18} />
      </View>

      <View style={{ marginTop: 4 }}>
        <FlatList
          data={eventChunks}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          snapToInterval={computedSnapInterval}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
          renderItem={({ item: chunk }) => (
            <View
              style={{
                width: cardWidth,
                marginRight: spacing,
                flexDirection: "column",
              }}
            >
              {chunk.map((ev: EventProps) => (
                <EventCard
                  key={ev.title} // or ev.id if available
                  event={ev}
                  onPress={() => console.log("Pressed:", ev.title)}
                />
              ))}
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default HorizontalCarousel;
