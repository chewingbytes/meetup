export interface EventProps {
  title: string;
  location: string;
  date: string;
  time: string;
  interest: string;
  image: string;
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
}
