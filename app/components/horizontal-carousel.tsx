import React from "react";
import { View, Text, FlatList, Dimensions } from "react-native";
import { ArrowDownRight } from "lucide-react-native";

interface HorizontalCarouselProps<T> {
  heading: string;
  chunks: T[][]; // generic chunks
  cardComponent: React.ComponentType<any>;
  dataKey: string; // prop name to pass (ex: "event")
  spacing?: number;
  onItemPress?: (item: T) => void;
}

function HorizontalCarousel<T>({
  heading,
  chunks,
  cardComponent: Card,
  dataKey,
  spacing = 16,
  onItemPress,
}: HorizontalCarouselProps<T>) {
  const { width } = Dimensions.get("window");
  const cardWidth = width * 0.8;
  const snapInterval = cardWidth + spacing;

  return (
    <View>
      {/* Heading */}
      <View className="flex-row w-full px-5 gap-x-1.5 items-center mb-6">
        <Text className="text-white font-medium text-2xl">{heading}</Text>
        <ArrowDownRight color="grey" size={18} />
      </View>

      <View>
        <FlatList
          data={chunks}
          keyExtractor={(_, index) => index.toString()}
          horizontal
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          snapToInterval={snapInterval}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
          renderItem={({ item: chunk }) => (
            <View
              className="gap-y-6"
              style={{
                width: cardWidth,
                marginRight: spacing,
                flexDirection: "column",
              }}
            >
              {chunk.map((item: T, idx: number) => (
                <Card
                  key={idx}
                  {...{ [dataKey]: item }} // dynamic prop name
                  onPress={onItemPress ? () => onItemPress(item) : () => console.log("Pressed:", item)}
                />
              ))}
            </View>
          )}
        />
      </View>
    </View>
  );
}

export default HorizontalCarousel;
