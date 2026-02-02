import { Link, usePathname } from "expo-router";
import {
  CalendarPlus,
  Hash,
  Home,
  MessageCircle,
  User,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { BlurView } from "expo-blur"; // add this

interface MobileNavProps {
  active: "home" | "explore" | "chat" | "profile";
}

export default function MobileNav({ active }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/home" },
    { id: "explore", icon: Hash, label: "Discover", href: "/explore" },
    { id: "profile", icon: User, label: "Profile", href: "/settings" },
  ];

  return (
    <BlurView
      intensity={50}
      tint="default"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 30,
        paddingTop: 12,
        zIndex: 50,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingHorizontal: 8,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = pathname === item.href;

          return (
            <Link href={item.href as any} asChild key={item.id}>
              <TouchableOpacity style={{ alignItems: "center" }}>
                <Icon size={24} color={isActive ? "#C1341E" : "#A9A9A9"} />
                <Text
                  style={{
                    fontSize: 11,
                    marginTop: 4,
                    color: isActive ? "#C1341E" : "#A9A9A9",
                    fontWeight: isActive ? "700" : "400",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </BlurView>
  );
}
