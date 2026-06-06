/**
 * Event category config — shared between the wizard and map pins.
 * Uses Lucide icons so everything stays consistent with the rest of the UI.
 */

import {
  Car,
  Coffee,
  Dumbbell,
  HeartPulse,
  Landmark,
  Music,
  ShoppingBag,
  Sparkles,
  Users,
  Clapperboard,
} from "lucide-react-native";
import { C } from "@/theme/clay";

export interface CategoryConfig {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  gradient: readonly [string, string];
}

export const CATEGORIES: CategoryConfig[] = [
  { id: "food",          label: "Food & Drinks",   Icon: Coffee,       gradient: C.Gradients.amber },
  { id: "nightlife",     label: "Nightlife",        Icon: Music,        gradient: C.Gradients.pink },
  { id: "outdoor",       label: "Outdoor & Active", Icon: Dumbbell,     gradient: C.Gradients.green },
  { id: "sightseeing",   label: "Sightseeing",      Icon: Landmark,     gradient: C.Gradients.blue },
  { id: "entertainment", label: "Entertainment",    Icon: Clapperboard, gradient: C.Gradients.primary },
  { id: "shopping",      label: "Shopping",         Icon: ShoppingBag,  gradient: C.Gradients.coral },
  { id: "wellness",      label: "Wellness",         Icon: HeartPulse,   gradient: ["#34D399", "#059669"] as const },
  { id: "rideshare",     label: "Rideshare",        Icon: Car,          gradient: ["#60A5FA", "#2563EB"] as const },
  { id: "social",        label: "Social",           Icon: Users,        gradient: C.Gradients.primary },
  { id: "other",         label: "Other",            Icon: Sparkles,     gradient: C.Gradients.amber },
];

export function getCategoryConfig(categoryId: string | undefined): CategoryConfig {
  return CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}
