import React from "react";
import { View, Text, FlatList, Dimensions } from "react-native";
import { ArrowDownRight } from "lucide-react-native";

interface SingleRowCarouselProps<T> {
  heading: string;
  data: T[];
  cardComponent: React.ComponentType<any>;
  dataKey: string; // ex: "event"
  spacing?: number;
  onItemPress?: (item: T) => void;
}

function SingleRowCarousel<T>({
  heading,
  data,
  cardComponent: Card,
  dataKey,
  spacing = 16,
  onItemPress,
}: SingleRowCarouselProps<T>) {
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

      <FlatList
        data={data}
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
        renderItem={({ item }) => (
          <View
            style={{
              width: cardWidth,
              marginRight: spacing,
              height: "auto",
            }}
          >
            <Card
              {...{ [dataKey]: item }}
              onPress={
                onItemPress
                  ? () => onItemPress(item)
                  : () => ""
              }
            />
          </View>
        )}
      />
    </View>
  );
}

export default SingleRowCarousel;
