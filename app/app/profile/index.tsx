import { useRef } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, Share2, Edit3, MapPin, Calendar, Users, Star } from "lucide-react-native";
import MobileNav from "@/components/mobile-nav";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Mock Data
  const user = {
    name: "BRYAN",
    username: "@bryan_dev",
    bio: "Building the next big thing. Coffee addict. Night owl.",
    location: "Singapore",
    avatar: "https://placehold.co/400x400/FF6B6B/000000.png?text=B",
    stats: {
      events: 42,
      communities: 8,
      friends: 156,
    },
    interests: ["Tech", "Design", "Music", "Coffee", "Startups"]
  };

  const ActionButton = ({ icon: Icon, label, onPress, color = "bg-white" }: { icon: any, label: string, onPress?: () => void, color?: string }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={`
        flex-row items-center justify-center
        ${color} border-[3px] border-black px-4 py-3
        shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:translate-x-1 active:shadow-none
        mb-3
      `}
    >
      <Icon size={20} color="#000" strokeWidth={3} className="mr-2" />
      <Text className="font-black text-sm uppercase tracking-wide">{label}</Text>
    </TouchableOpacity>
  );

  const StatBox = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <View className={`flex-1 items-center justify-center border-[3px] border-black p-4 ${color} shadow-[4px_4px_0px_0px_#000]`}>
      <Text className="font-black text-3xl mb-1">{value}</Text>
      <Text className="font-bold text-xs uppercase tracking-tighter">{label}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#FFFDF5]">
      {/* Sticky Header */}
      <View
        style={{ paddingTop: insets.top, zIndex: 50 }}
        className="absolute top-0 left-0 right-0 bg-white border-b-[4px] border-black flex-row justify-between items-center px-4 pb-4 pt-2"
      >
        <Text className="font-black text-3xl italic uppercase tracking-tighter">
          PROFILE
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          className="w-10 h-10 bg-[#C4B5FD] border-[3px] border-black items-center justify-center shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
        >
          <Settings size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 80, // Approximate header height
          paddingBottom: 100
        }}
      >
        {/* Banner / Avatar Section */}
        <View className="items-center pt-8 pb-6 px-4 bg-[#FFD93D] border-b-[4px] border-black relative">
          {/* Avatar */}
          <View className="w-32 h-32 bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] mb-4 overflow-hidden transform -rotate-2">
            <Image 
              source={{ uri: user.avatar }} 
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          
          <Text className="font-black text-4xl uppercase tracking-tighter text-center leading-tight">
            {user.name}
          </Text>
          <Text className="font-bold text-lg text-black bg-white border-[2px] border-black px-2 mt-2 transform rotate-1">
            {user.username}
          </Text>

          {/* Location */}
          <View className="flex-row items-center mt-4 opacity-80 bg-white/50 px-3 py-1 border-[2px] border-black rounded-none">
            <MapPin size={16} color="#000" strokeWidth={3} className="mr-1" />
            <Text className="font-bold uppercase">{user.location}</Text>
          </View>
        </View>

        {/* Bio Section */}
        <View className="p-6 border-b-[4px] border-black bg-white">
          <Text className="font-medium text-lg text-center leading-6 border-[2px] border-dashed border-gray-400 p-4">
            "{user.bio}"
          </Text>

           {/* Interests Tags */}
           <View className="flex-row flex-wrap justify-center gap-2 mt-6">
            {user.interests.map((tag, i) => (
              <View 
                key={i}
                className={`
                  border-[2px] border-black px-3 py-1 
                  ${i % 2 === 0 ? 'bg-[#A7F3D0] -rotate-1' : 'bg-[#FECACA] rotate-1'}
                `}
              >
                <Text className="font-bold text-xs uppercase">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4 p-4">
          <StatBox label="Events" value={user.stats.events} color="bg-[#FF6B6B]" />
          <StatBox label="Groups" value={user.stats.communities} color="bg-[#C4B5FD]" />
          <StatBox label="Friends" value={user.stats.friends} color="bg-[#6EE7B7]" />
        </View>

        {/* Actions */}
        <View className="px-6 py-2 gap-2">
          <ActionButton 
            icon={Edit3} 
            label="Edit Profile" 
            onPress={() => router.push("/edit-profile")}
            color="bg-white"
          />
          <ActionButton 
            icon={Share2} 
            label="Share Profile" 
            onPress={() => {}}
            color="bg-[#bfdbfe]" // blue-200
          />
        </View>

        {/* Recent Activity Mock */}
        <View className="mt-6 px-4">
          <View className="flex-row items-center mb-4">
             <Star size={24} color="#000" fill="#FFD93D" className="mr-2" />
             <Text className="font-black text-xl uppercase">Recent Activity</Text>
          </View>
            
          <View className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000] mb-4">
            <Text className="font-bold mb-2">ATTENDED 'LATE NIGHT CODING'</Text>
            <Text className="text-xs text-gray-500">2 DAYS AGO</Text>
          </View>

          <View className="border-[3px] border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000]">
            <Text className="font-bold mb-2">JOINED 'REACT NATIVE SG'</Text>
            <Text className="text-xs text-gray-500">1 WEEK AGO</Text>
          </View>
        </View>

      </ScrollView>
      <MobileNav active="profile" />
    </View>
  );
}
