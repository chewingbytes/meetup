# MVP Roadmap – Navigation Experience & Task Flow (Investor Brief)

## 1) Core User Journey (Happy Path)

### A. Entry & Verification
- Open app → Welcome screen
- Register → Email/password → Onboarding
- Complete onboarding (personality + interests + preferences)
- Login → Home
- Optional: Singpass verification flow (planned milestone)

### B. Discover & Join Communities
- Home → Community sidebar
- Browse communities → View detail → Join
- Community content view opens (chat + calendar + events)

### C. Engage in Events
- Community content → Calendar → Select date → View events
- Create event (owner) → Template or manual → Publish
- Join event → Event detail → Attendance status

### D. Social Connection & Trust
- Chat within community drawer
- Unread chat badge/notifications
- Testimonials & ratings (post-event feedback)

---

## 2) Current MVP Navigation Map (Based on Code)

### Authentication & Onboarding
- Welcome: app/index.tsx
- Register: app/register
- Login: app/login
- Onboarding: app/onboarding (steps + interest ranking)

### Core Tabs / Main Areas
- Home: app/home
  - Community sidebar + community content
  - Community chat drawer + calendar + events
- Explore: app/explore
- Map: app/map
- Inbox/Chat: app/inbox
- Notifications: app/notifications
- Profile/Account: app/account, app/edit-profile
- Settings: app/settings + preference screens

### Community Flow
- Community detail: app/community/[id]
- Community content (home): components/community-content.tsx
- Create community: app/create-community
- Browse communities: app/browse-communities

### Events Flow
- Create event: app/create-event
- Advanced template flow: app/create-event/advanced
- Event detail: app/events/[id]
- Participants: app/events/participants
- My events: app/my-events

### Chat Flow
- Community chat drawer: components/chat-drawer.tsx
- Chat room: app/chat/[id]

---

## 3) MVP Task Roadmap (Aligned to Investor Pitch)

### Phase 1 – MVP Hardening (Now → Demo)
- Global background consistency (#09090b)
- Event templates + community-owner controls
- Calendar-based event browsing
- Unread chat notifications + badges
- Push token registration (local notifications)

### Phase 2 – Verification & Safety Layer
- Singpass biometric verification (IdentiFace)
- MyInfo DOB + Institution retrieval
- Age-gating logic + segmentation bubbles
- Permanent ban enforcement via identity

### Phase 3 – Trust & Reputation Engine
- Vibe points + badges
- Peer reviews after events
- Host quality metrics

### Phase 4 – Growth & Engagement
- “Pull Up” mechanic (low-commit RSVP)
- Social battery toggle
- Personality-first discovery filters

---

## 4) Suggested Slide Structure (PowerPoint)

1. Problem & Market Context
2. Verified SG Student Hub (Mission)
3. Safety & Moat (Singpass + MyInfo)
4. MVP Screens & Navigation Flow
5. Community → Event → Trust Loop
6. Roadmap & Launch Milestones

---

## 5) Quick Talking Points (Investor)
- Exclusive ecosystem for verified SG students
- Real identity + strict age bubble enforcement
- Offline-to-online bridge via community events
- Trust engine = long-term defensibility

