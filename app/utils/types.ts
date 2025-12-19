import { ElementType } from "react";

export interface EventProps {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  interest: string;
  image: string;
  description?: string;
  host?: string;
  details?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CommunityProps {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  privacyMode: boolean;
  rules: string[];
  faq: FaqItem[];
  profileImage: string;
  location: string;
}

export interface HeaderAction {
  icon: ElementType;
  onPress?: () => void;
  link?: string; // optional if you're using expo-router for navigation
}

export interface HeaderProps {
  title: string;
  actions: HeaderAction[];
}
