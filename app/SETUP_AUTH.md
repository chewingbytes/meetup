# Authentication System Setup Guide

## Quick Start

### Prerequisites
- ✅ Supabase self-hosted at `46.62.247.253`
- ✅ Packages installed: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
- ✅ Database tables created: `profiles`, `user_settings`

## Setup Steps

### 1. Update Supabase Configuration (IMPORTANT)

Edit `lib/supabase.ts` and update with your actual Supabase credentials:

```typescript
const SUPABASE_URL = 'http://46.62.247.253:8000'; // Already set
const SUPABASE_ANON_KEY = 'YOUR_ACTUAL_ANON_KEY_HERE'; // Update this!
```

Get your keys from Supabase console:
- Project Settings → API → anon (public) key

### 2. Create Database Tables

Run these SQL queries in Supabase SQL editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  appearance TEXT DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for user_settings
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3. Enable Email Authentication

In Supabase console:
- Go to Authentication → Providers
- Enable Email
- Configure email templates (optional)

### 4. Test the Flow

#### Test Signup
1. Launch app
2. Should show splash screen
3. Tap "Get started"
4. Should redirect to Welcome screen
5. Register with: `test@tp.edu.sg` / `TestPassword123`
6. Complete onboarding (5 steps)
7. Should redirect to email verification
8. Enter OTP (in dev: use `123456` for mock)
9. Should redirect to home

#### Test Login
1. From home, tap settings
2. Scroll down and tap "Sign out"
3. Should redirect to login screen
4. Login with same credentials
5. If email verified, should go straight to home
6. If not verified, should go to OTP screen

### 5. Check Auth Flow

The app now uses this routing logic:

```
App Starts (splash.tsx)
    ↓
[1s delay to show splash]
    ↓
Check AsyncStorage for session
    ├─ Session exists → Go to Home (/)
    └─ No session
        ├─ Onboarding data exists → Go to Login (/login)
        └─ No onboarding → Go to Welcome (/welcome)
```

### 6. UI Components

#### Login Page (`/login`)
- Email input with school email validation
- Password toggle (show/hide)
- Error messages for invalid credentials
- Link to signup

#### Register Page (`/register`)
- Email validation
- Password requirements (8+ chars, match)
- Link to signin

#### Onboarding (`/onboarding`)
5-step wizard:
1. Basic Info (name, school, year)
2. Interests (multi-select)
3. Personality (3 questions)
4. Preferences (scope, distance, types)
5. Review & Submit

#### Email Verification (`/verify/email`)
- OTP input (6 digits)
- Resend with 60s cooldown
- Error handling

#### Settings (`/settings`)
- Profile display with avatar
- Basic info (username, email, school, joined date)
- Notification toggles
- Appearance selector
- Logout button

## Features

✅ **Email Validation**
- Singapore school emails only
- Supported domains: TP, NP, RP, SP, ITE, JCs, Universities
- Real-time validation

✅ **Session Persistence**
- AsyncStorage saves session automatically
- Survives app restart
- Auto-refresh tokens

✅ **Personality Questionnaire**
- 3 questions about social style
- Weekend preferences
- Connection style
- Data stored in onboarding_data

✅ **Email Verification**
- OTP confirmation required
- Resend functionality with cooldown
- Mock OTP in development

✅ **Settings Management**
- Update notification preferences
- Change appearance theme
- View profile info
- Logout functionality

## API Endpoints Used

The app integrates with Supabase which provides:
- `auth.signUp()` - Create account
- `auth.signInWithPassword()` - Login
- `auth.signOut()` - Logout  
- `auth.verifyOtp()` - Verify email
- REST API for profiles and user_settings tables

## Debugging

### Enable Console Logs
In `lib/authContext.tsx`, error logs are already included.

### Check AsyncStorage
Install React Native Debugger and inspect AsyncStorage keys:
- `supabase_session`
- `onboarding_data`
- `pending_email_verification`

### Test Email Domain Validation
```typescript
import { validateSingaporeSchoolEmail } from '@/lib/schoolEmailValidation';

console.log(validateSingaporeSchoolEmail('test@tp.edu.sg')); // true
console.log(validateSingaporeSchoolEmail('test@gmail.com')); // false
```

## Future Improvements

1. **Email Verification by Domain**
   - Auto-whitelist verified domains
   - Institution-specific features

2. **Personality Matching**
   - Algorithm to find compatible users
   - Recommendation engine

3. **Profile Completeness**
   - Nudge users to add avatar, bio
   - Scoring system

4. **Advanced Analytics**
   - Track personality types
   - Identify trending interests
   - User retention metrics

5. **Admin Dashboard**
   - Manage user accounts
   - View analytics
   - Moderate content

## Troubleshooting

### "Constructor Map requires 'new'" Error
- Make sure you import icons from lucide-react-native
- Don't use native JavaScript Map in JSX

### Session not persisting
```typescript
// Check if AsyncStorage is working
const test = await AsyncStorage.getItem('test_key');
console.log('AsyncStorage works:', test);
```

### Email validation not working
```typescript
// Test the validation function
import { SINGAPORE_SCHOOL_DOMAINS } from '@/lib/schoolEmailValidation';
console.log(SINGAPORE_SCHOOL_DOMAINS); // Check if domains are there
```

### OTP not sending
In development, use mock OTP: `123456`
For production:
1. Configure email provider in Supabase
2. Update email templates if needed
3. Test with real email

## Support

For issues, check:
1. Console logs (Ctrl+J in Expo)
2. Network tab (check API calls)
3. AsyncStorage contents
4. Supabase dashboard logs
5. Email templates configuration

---

**Status**: ✅ Ready for development
**Last Updated**: January 2026
