// Updated archetypes based on new prompt
export type PersonalityType =
  | "Connector"
  | "Nurturer"
  | "Organizer"
  | "Catalyst"
  | "Listener"
  | "Facilitator"
  | "Diplomat";

export interface AnswerOption {
  text: string;
  points: Partial<Record<PersonalityType, number>>;
}

export interface Question {
  id: number;
  text: string;
  type: "binary" | "multiple";
  options: AnswerOption[];
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "The Newcomer: A new student is sitting alone at lunch and looks lost.",
    type: "binary",
    options: [
      {
        text: "Give a friendly nod but don’t intrude.",
        points: { Listener: 2, Facilitator: 2 },
      },
      {
        text: "Head over and introduce them to everyone.",
        points: { Connector: 2 },
      },
    ],
  },
  {
    id: 2,
    text: "The Group Crisis: Two teammates are arguing and the project is stalling.",
    type: "multiple",
    options: [
      {
        text: "Remind everyone of the deadline and refocus on tasks.",
        points: { Organizer: 2 },
      },
      {
        text: "Pull them aside to help them see each other’s view.",
        points: { Diplomat: 2 },
      },
      {
        text: "Crack a joke or call a break to lower tension.",
        points: { Facilitator: 2 },
      },
      {
        text: "Listen to both sides and make sure everyone feels heard.",
        points: { Nurturer: 2 },
      },
    ],
  },
  {
    id: 3,
    text: "The Idea Pitch: Someone suggests a wild experimental event idea.",
    type: "binary",
    options: [
      {
        text: "Let’s stick to what we know works—safer.",
        points: { Organizer: 1, Listener: 1 },
      },
      {
        text: "Sounds amazing! How can we make it even crazier?",
        points: { Catalyst: 2 },
      },
    ],
  },
  {
    id: 4,
    text: "The Stress Test: Deadline just moved to tomorrow and everyone’s panicking.",
    type: "multiple",
    options: [
      {
        text: "It’s fine—stay focused and we’ll get it done.",
        points: { Facilitator: 2 },
      },
      {
        text: "Does everyone need a hug or snack? Let’s calm down together.",
        points: { Nurturer: 2 },
      },
      {
        text: "I’ll create a new schedule to divide the work.",
        points: { Organizer: 2 },
      },
      {
        text: "I’ll start researching the hardest part while others brainstorm.",
        points: { Listener: 2 },
      },
    ],
  },
  {
    id: 5,
    text: "The Social Invite: You need people to show up to the school play.",
    type: "binary",
    options: [
      {
        text: "Design a beautiful, thoughtful poster explaining why it matters.",
        points: { Catalyst: 2, Listener: 2 },
      },
      {
        text: "Personally invite everyone I know until the room is full.",
        points: { Connector: 2 },
      },
    ],
  },
  {
    id: 6,
    text: "The Feedback Session: You see a flaw in a friend’s plan.",
    type: "multiple",
    options: [
      {
        text: "Wait for a quiet moment to bring it up gently, one-on-one.",
        points: { Listener: 2 },
      },
      {
        text: "Explain why it won’t work and offer a better solution.",
        points: { Catalyst: 2 },
      },
      {
        text: "Ask questions so they realize the flaw themselves.",
        points: { Diplomat: 2 },
      },
      {
        text: "Offer to help fix the mess if it goes wrong later.",
        points: { Nurturer: 2 },
      },
    ],
  },
  {
    id: 7,
    text: "The Routine: How do you keep your locker or bag?",
    type: "binary",
    options: [
      {
        text: "It’s a mess but I know where everything is.",
        points: { Catalyst: 1, Connector: 1 },
      },
      {
        text: "Everything is labeled, color-coded, and in its place.",
        points: { Organizer: 2 },
      },
    ],
  },
  {
    id: 8,
    text: "The Party Scene: At a big gathering, where are you?",
    type: "multiple",
    options: [
      {
        text: "In the middle of the dance floor or hosting a game.",
        points: { Connector: 2 },
      },
      {
        text: "In a deep 1-on-1 conversation in a quiet corner.",
        points: { Listener: 2 },
      },
      {
        text: "Making sure snacks are filled and everyone’s comfy.",
        points: { Nurturer: 2 },
      },
      {
        text: "Floating between groups, keeping vibes smooth.",
        points: { Diplomat: 2 },
      },
    ],
  },
  {
    id: 9,
    text: "The Change: School is changing a long-standing tradition.",
    type: "binary",
    options: [
      {
        text: "Skeptical—traditions matter for community.",
        points: { Organizer: 2, Listener: 2 },
      },
      {
        text: "Excited—change is a chance to make it better.",
        points: { Catalyst: 2 },
      },
    ],
  },
  {
    id: 10,
    text: "The Motivation: What makes you feel most successful?",
    type: "multiple",
    options: [
      {
        text: "Finishing everything on my to-do list.",
        points: { Organizer: 2 },
      },
      {
        text: "Helping a friend through a tough time.",
        points: { Nurturer: 2 },
      },
      {
        text: "Coming up with a solution no one else thought of.",
        points: { Catalyst: 2 },
      },
      {
        text: "Feeling like I’m part of a big, happy group.",
        points: { Connector: 2 },
      },
    ],
  },
];
