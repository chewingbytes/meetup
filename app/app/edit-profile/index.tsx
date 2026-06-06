import { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Camera, User, Mail, MapPin, FileText } from "lucide-react-native";

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("Bryan");
  const [username, setUsername] = useState("bryan_dev");
  const [bio, setBio] = useState("Building the next big thing. Coffee addict. Night owl.");
  const [location, setLocation] = useState("Singapore");

  const handleSave = () => {
    Alert.alert("PROFILE UPDATED", "Your changes have been saved to the stickerverse!");
    router.back();
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    multiline = false,
    icon: Icon 
  }: { 
    label: string, 
    value: string, 
    onChange: (t: string) => void, 
    placeholder: string,
    multiline?: boolean,
    icon: any
  }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-2">
        <View className="bg-black px-2 py-1 mr-2 transform -rotate-1">
          <Text className="text-white font-black text-xs uppercase">{label}</Text>
        </View>
      </View>
      
      <View className={`
        flex-row items-start bg-white border-[3px] border-black p-3 
        shadow-[4px_4px_0px_0px_#000]
        ${multiline ? 'h-32' : 'h-14'}
      `}>
        <Icon size={20} color="#000" className="mr-3 mt-1" strokeWidth={3} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          className="flex-1 font-bold text-lg text-black leading-tight"
          style={{ textAlignVertical: multiline ? 'top' : 'center' }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF5]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4 border-b-[4px] border-black bg-[#FFD93D] flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-white border-[3px] border-black items-center justify-center active:translate-y-1 shadow-[2px_2px_0px_0px_#000]"
        >
          <ChevronLeft size={24} color="#000" strokeWidth={3} />
        </TouchableOpacity>

        <Text className="font-black text-xl text-black uppercase tracking-wider">
          Edit Profile
        </Text>
        
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-5 pt-8">
        
        {/* Avatar Edit */}
        <View className="items-center mb-8">
          <View className="relative">
            <View className="w-32 h-32 bg-gray-200 border-[4px] border-black transform rotate-2">
              <Image 
                source={{ uri: "https://placehold.co/400x400/FF6B6B/000000.png?text=B" }} 
                className="w-full h-full"
              />
            </View>
            <TouchableOpacity 
              className="absolute -bottom-2 -right-2 bg-[#C4B5FD] border-[3px] border-black p-2 shadow-[2px_2px_0px_0px_#000] active:translate-y-1"
            >
              <Camera size={20} color="#000" strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <Text className="font-bold text-xs text-gray-500 mt-4 uppercase tracking-widest">
            Tap camera to change
          </Text>
        </View>

        {/* Form */}
        <InputField 
          label="Display Name" 
          value={name} 
          onChange={setName} 
          placeholder="e.g. Bryan" 
          icon={User}
        />

        <InputField 
          label="Username" 
          value={username} 
          onChange={setUsername} 
          placeholder="e.g. bryan_dev" 
          icon={User} // Could use AtSign
        />

        <InputField 
          label="Location" 
          value={location} 
          onChange={setLocation} 
          placeholder="e.g. Singapore" 
          icon={MapPin}
        />

        <InputField 
          label="Bio" 
          value={bio} 
          onChange={setBio} 
          placeholder="Tell us about yourself..." 
          multiline
          icon={FileText}
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.9}
          className="bg-[#A7F3D0] border-[4px] border-black py-4 items-center shadow-[6px_6px_0px_0px_#000] mb-20 active:translate-y-1 active:shadow-none"
        >
          <Text className="font-black text-xl uppercase tracking-widest text-black">
            Save Changes
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
