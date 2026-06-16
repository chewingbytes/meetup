/**
 * Activity category config — shared between the wizard and map pins.
 * Uses Lucide icons so everything stays consistent with the rest of the UI.
 *
 * Soonest pivot: categories reflect what driven 20-somethings actually link up
 * for — building/networking, training, and lower-key social time.
 */

import { Briefcase, Dumbbell, Coffee } from "lucide-react-native";
import { C } from "@/theme/clay";

export interface CategoryConfig {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  gradient: readonly [string, string];
}

export const CATEGORIES: CategoryConfig[] = [
  { id: "network", label: "Network & Collab", Icon: Briefcase, gradient: C.Gradients.primary },
  { id: "fitness", label: "Fitness & Sports", Icon: Dumbbell,  gradient: C.Gradients.green },
  { id: "chill",   label: "Chill & Social",   Icon: Coffee,    gradient: C.Gradients.amber },
];

export function getCategoryConfig(categoryId: string | undefined): CategoryConfig {
  return CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[CATEGORIES.length - 1];
}
