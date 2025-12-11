import React from "react";
import { View, Text, ScrollView } from "react-native";
import { ArrowDownRight } from "lucide-react-native";

interface VerticalListProps<T> {
  heading: string;
  items: T[];
  cardComponent: React.ComponentType<any>; // flexible card
  dataKey: string; // prop name to pass the item under (e.g. "community")
}

function VerticalList<T>({
  heading,
  items,
  cardComponent: Card,
  dataKey,
}: VerticalListProps<T>) {
  return (
    <ScrollView>
      {/* Heading */}
      <View className="flex-row w-full px-5 gap-x-1.5 items-center mb-6">
        <Text className="text-white font-medium text-2xl">{heading}</Text>
        <ArrowDownRight color="grey" size={18} />
      </View>

      {/* Cards */}
      <View className="gap-y-6">
        {items.map((item, idx) => {
          return (
            <View key={idx} className="px-5">
              <Card
                {...{ [dataKey]: item }} // dynamically passes correct prop
                onPress={() => console.log("Clicked:", item)}
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default VerticalList;
