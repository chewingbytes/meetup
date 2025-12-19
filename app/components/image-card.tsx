import React from "react";
import { View, Text, ImageBackground, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { CommunityProps } from "@/utils/types";

export interface CommunityCardProps {
  card: any;
  onPress?: () => void;
}

export interface FaqItem {
  question: string;
  answer: string;
}

const ImageCard: React.FC<CommunityCardProps> = ({ card, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
        <View
          className="rounded-xl overflow-hidden"
          style={{
            width: "100%",
            height: 220,
          }}
        >
          <ImageBackground
            source={{ uri: card.image || card.profileImage }}
            resizeMode="cover"
            style={{
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            {/* Top-left Icon */}
            <View
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "rgba(0,0,0,0.4)",
                padding: 6,
                borderRadius: 50,
              }}
            >
              <Users color="white" size={18} />
            </View>

            {/* Bottom Gradient + Text */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.95)"]}
              style={{
                width: "100%",
                paddingVertical: 18,
                paddingHorizontal: 16,
              }}
            >
              <Text className="text-white font-semibold" style={{ fontSize: 18 }}>
                {card.name}
              </Text>
            </LinearGradient>
          </ImageBackground>
        </View>
    </TouchableOpacity>
  );
};

export default ImageCard;
