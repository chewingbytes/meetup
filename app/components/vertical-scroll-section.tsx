import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { ArrowDownRight } from "lucide-react-native";
import CommunityCard from "@/components/community-card";
import { CommunityProps } from "@/utils/types";

interface CommunityListProps {
  communities: CommunityProps[];
  heading: string;
}

const verticalList: React.FC<CommunityListProps> = ({
  communities,
  heading,
}) => {
  return (
    <ScrollView>
      <View className="flex-row w-full px-5 gap-x-1.5 items-center mb-6">
        <Text className="text-white font-medium text-2xl">{heading}</Text>
        <ArrowDownRight color="grey" size={18} />
      </View>

      <View className="gap-y-8">
        {communities.map((community) => (
          <View key={community.id} className="px-5">
            <CommunityCard
              community={community}
              onPress={() => console.log("Clicked:", community.name)}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default verticalList;
