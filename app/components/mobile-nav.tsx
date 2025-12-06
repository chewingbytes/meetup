import { Link, usePathname } from "expo-router";
import { CalendarPlus, Hash, Home, MessageCircle, User } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface MobileNavProps {
  active: "groups" | "explore" | "inbox" | "host" | "profile";
}

export default function MobileNav({ active }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    { id: "explore", icon: Hash, label: "Discover", href: "/explore" },
    { id: "inbox", icon: MessageCircle, label: "Alerts", href: "/inbox" },
    { id: "host", icon: CalendarPlus, label: "Host", href: "/host" },
    { id: "profile", icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#eee", paddingBottom: 12, paddingTop: 8, zIndex: 50 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8 }}>
        {navItems.map((item) => {
          const Icon = item.icon as any;
          const isActive = pathname === item.href;

          return (
            <Link href={item.href as any} asChild key={item.id}>
              <TouchableOpacity style={{ alignItems: "center" }}>
                <Icon size={26} color={isActive ? "#111" : "#9CA3AF"} />
                <Text style={{ fontSize: 11, marginTop: 4, color: isActive ? "#111" : "#9CA3AF", fontWeight: isActive ? "700" : "400" }}>{item.label}</Text>
              </TouchableOpacity>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
