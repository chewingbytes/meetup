import { ScrollView, View, Dimensions, Text } from "react-native";
import { ArrowDownRight } from "lucide-react-native";

interface HorizontalCarouselProps<T> {
  heading: string;
  chunks: T[][];
  cardComponent: React.ComponentType<any>;
  dataKey: string;
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
  const cardWidth = width * 0.9; // bigger, image-first
  return (
    <View className="mb-8">
      <View className="flex-row w-full px-5 gap-x-1.5 items-center mb-6">
        <Text className="text-white text-2xl font-semibold">{heading}</Text>
        <ArrowDownRight color="grey" size={18} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + spacing}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: spacing }}
      >
        {chunks.flat().map((item, idx) => (
          <View key={idx} style={{ width: cardWidth }}>
            <Card
              {...{ [dataKey]: item }}
              onPress={() => onItemPress?.(item)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default HorizontalCarousel;
