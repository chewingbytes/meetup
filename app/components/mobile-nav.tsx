import { router } from "expo-router";
import { Hash, Home, User } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface MobileNavProps {
  active?: "home" | "explore" | "chat" | "profile";
}

export default function MobileNav({ active }: MobileNavProps) {
  const navItems = [
    { id: "home", icon: Home, label: "HOME", href: "/home" },
    { id: "explore", icon: Hash, label: "EXPLORE", href: "/explore" },
    { id: "profile", icon: User, label: "YOU", href: "/settings" },
  ];

  return (
    <View
      className="absolute bottom-0 left-0 right-0 z-50 bg-neo-bg border-t-4 border-black pb-8 pt-4 px-4 flex-row justify-around items-center"
      style={{ paddingBottom: 34 }}
    >
      {navItems.map((item) => {
        const Icon = item.icon as any;
        const isActive = active === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(item.href as any)}
            className={`items-center justify-center ${isActive ? "-translate-y-4" : ""}`}
            activeOpacity={1}
          >
            <View 
              className={`items-center justify-center w-14 h-14 border-4 border-black ${isActive ? "bg-neo-red  w-16 h-16 shadow-[4px_4px_0px_0px_#000]" : "bg-white"}`}
            >
              <Icon 
                  size={24} 
                  color={"#000"} 
                  strokeWidth={isActive ? 3 : 2}
              />
            </View>
            {isActive && (
              <View className="absolute -bottom-7 bg-neo-yellow border-2 border-black px-1 rotate-2">
                  <Text className="text-[10px] font-bold uppercase">{item.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

