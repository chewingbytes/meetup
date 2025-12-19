import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";

type ListRowProps = {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export default function ListRow({ icon: Icon, title, subtitle, onPress }: ListRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.left}>
        <Icon size={20} color="#fff" />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <ChevronRight size={20} color="#777" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  left: { flexDirection: "row", alignItems: "center" },
  title: { color: "#fff", fontWeight: "600" },
  subtitle: { color: "#888", fontSize: 12, marginTop: 4 },
});