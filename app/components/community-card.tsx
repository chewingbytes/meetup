import { MessageCircle, Users } from "lucide-react-native";
import { Image, Text, TouchableOpacity, View } from "react-native";

const PALETTE = {
  coral: "#FF8FA3",
  apricot: "#FFBC8F",
  beige: "#FFE0B2",
  graphite: "#2C2C2C",
  lightGrey: "#F5F5F5",
  white: "#FFFFFF",
  babyPink: "#FFD7E9",
};

interface CommunityCardProps {
  name: string;
  members: number;
  avatar?: string;
  color?: string;
}

export function CommunityCard({
  name,
  members,
  avatar,
  color,
}: CommunityCardProps) {
  return (
    <View style={{ backgroundColor: PALETTE.white, padding: 12, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2, borderWidth: 1, borderColor: PALETTE.babyPink }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Avatar with Gradient Container */}
        <View
          style={{
            borderRadius: 12,
            padding: 8,
            backgroundColor: PALETTE.babyPink,
            width: 56,
            height: 56,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 40, height: 40, borderRadius: 10 }}
            />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: PALETTE.lightGrey, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: PALETTE.coral }}>
                {name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Name + Members */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "600", fontSize: 16, color: PALETTE.graphite }}>{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <Users size={14} color="#9CA3AF" />
            <Text style={{ fontSize: 13, color: "#6B7280" }}>{members} members</Text>
          </View>
        </View>

        {/* Message Button */}
        <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: PALETTE.babyPink }}>
          <MessageCircle size={18} color={PALETTE.coral} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
