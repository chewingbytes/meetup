import { Calendar, Heart, MapPin, Users } from "lucide-react-native";
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

interface EventCardProps {
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  hostName: string;
  hostAvatar?: string;
  image?: string;
  tags?: string[];
}

export function EventCard({
  title,
  category,
  date,
  time,
  location,
  attendees,
  maxAttendees,
  hostName,
  hostAvatar,
  image,
  tags = [],
}: EventCardProps) {
  return (
    <View style={{ backgroundColor: PALETTE.white, borderRadius: 16, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2, overflow: "hidden", borderWidth: 1, borderColor: PALETTE.babyPink }}>
      {/* Image */}
      <View style={{ position: "relative", height: 176, width: "100%", backgroundColor: PALETTE.lightGrey }}>
        <Image
          source={{
            uri:
              image ||
              `https://placehold.co/400x200?text=${category.replace(" ", "+")}`,
          }}
          style={{ height: "100%", width: "100%" }}
          resizeMode="cover"
        />

        {/* Like Button */}
        <TouchableOpacity style={{ position: "absolute", right: 12, top: 12, height: 40, width: 40, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.9)", alignItems: "center", justifyContent: "center" }}>
          <Heart size={20} color={PALETTE.graphite} />
        </TouchableOpacity>

        {/* Category Badge */}
        <View style={{ position: "absolute", left: 12, top: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: `rgba(255, 143, 163, 0.9)` }}>
          <Text style={{ color: PALETTE.white, fontSize: 12, fontWeight: "600" }}>{category}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Title */}
        <Text style={{ fontSize: 16, fontWeight: "600", color: PALETTE.graphite }}>{title}</Text>

        {/* Tags */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: PALETTE.babyPink,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: "#6B7280" }}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Details */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Calendar size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              {date} • {time}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MapPin size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: "#6B7280", flex: 1 }} numberOfLines={1}>
              {location}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Users size={16} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: "#6B7280" }}>
              {attendees}/{maxAttendees} going
            </Text>
          </View>
        </View>

        {/* Host + Join Button */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderColor: PALETTE.babyPink }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={{ uri: hostAvatar || "https://placehold.co/40" }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
            <Text style={{ fontSize: 14, fontWeight: "600", color: PALETTE.graphite }}>{hostName}</Text>
          </View>

          <TouchableOpacity style={{ backgroundColor: PALETTE.coral, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ color: PALETTE.white, fontSize: 12, fontWeight: "700" }}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
