import { CommunityProps } from "@/utils/types";
import wildflowerImage from "../assets/images/cat.jpg";

export const usersCommunities: CommunityProps[] = [
  {
    id: "c1",
    name: "Pickleball United",
    description: "Pickleball @ Punggol for all skill levels.",
    dateCreated: "2025-01-01",
    privacyMode: false,
    rules: ["Be respectful", "No cheating", "No spam"],
    faq: [
      { question: "Can I join?", answer: "Yes, everyone is welcome!" },
      { question: "Do I need to register?", answer: "No registration needed." },
    ],
    profileImage: "https://picsum.photos/seed/c1/1980/1080",
    topics: ["Pickleball", "Sports", "Outdoor"],
  },
  {
    id: "c2",
    name: "Study Groups",
    description: "All study-related communities for students.",
    dateCreated: "2025-03-01",
    privacyMode: true,
    rules: ["Stay on topic", "No distractions"],
    faq: [
      { question: "Who can join?", answer: "Students only." },
      { question: "Can I create my own study group?", answer: "Yes!" },
    ],
    profileImage: "https://picsum.photos/seed/c2/1980/1080",
    topics: ["Study", "Homework", "Exams"],
  },
  {
    id: "c3",
    name: "Book Lovers",
    description: "Community for book readers and discussion.",
    dateCreated: "2025-04-01",
    privacyMode: false,
    rules: ["No spoilers without warning", "Respect opinions"],
    faq: [],
    profileImage: "https://picsum.photos/seed/c3/1980/1080",
    topics: ["Fiction", "Discussion", "Recommendations"],
  },
  {
    id: "c4",
    name: "Music",
    description:
      "Music lovers community for sharing and discovering new tunes.",
    dateCreated: "2025-05-01",
    privacyMode: false,
    rules: ["Share respectfully", "No copyright infringement"],
    faq: [{ question: "What genres?", answer: "All genres welcome!" }],
    profileImage: "https://picsum.photos/seed/c4/1980/1080",
    topics: ["Listening", "Discovery", "Genres"],
  },
  {
    id: "c5",
    name: "Social",
    description: "General social community for meeting new people.",
    dateCreated: "2025-06-01",
    privacyMode: false,
    rules: ["Be friendly", "No harassment"],
    faq: [],
    profileImage: "https://picsum.photos/seed/c5/1980/1080",
    topics: ["Meetups", "Networking", "Events"],
  },
  {
    id: "c6",
    name: "Art",
    description: "Creative community for artists and art enthusiasts.",
    dateCreated: "2025-07-01",
    privacyMode: false,
    rules: ["Respect all art forms", "Constructive criticism only"],
    faq: [
      { question: "All mediums?", answer: "Yes, digital, traditional, etc." },
    ],
    profileImage: "https://picsum.photos/seed/c6/1980/1080",
    topics: ["Painting", "Digital", "Exhibitions"],
  },
  {
    id: "wildflower-studio",
    name: "Wildflower Studio",
    description:
      "Wildflower Studio in Singapore is a social enterprise located at Enabling Village that combines art jamming with cat fostering. It acts as a therapeutic space where visitors can paint while socializing with rescue cats, helping them get adopted. They offer guided painting sessions and private events.",
    dateCreated: "2026-03-13",
    privacyMode: false,
    rules: [
      "Be gentle with the cats",
      "Respect others' artwork",
      "No outside food for cats",
    ],
    faq: [
      {
        question: "Do I need painting experience?",
        answer: "Not at all, we offer guided sessions!",
      },
      {
        question: "Can I adopt a cat?",
        answer: "Yes, we facilitate cat adoptions.",
      },
    ],
    profile_image: wildflowerImage,
    topics: ["Art Jamming", "Cats", "Social Enterprise"],
  },
];
