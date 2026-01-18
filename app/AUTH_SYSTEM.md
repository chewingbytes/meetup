# Authentication System Implementation

## Overview

This document outlines the complete authentication system implementation for the meetup app using Supabase, React Native AsyncStorage, and personality-based onboarding.

## System Architecture

### 1. **Supabase Setup** (`lib/supabase.ts`)
- Self-hosted Supabase at IP: `46.62.247.253`
- AsyncStorage adapter for session persistence
- Automatic session refresh and detection

### 2. **Auth Context** (`lib/authContext.tsx`)
- Centralized auth state management using React Context
- Session persistence across app restarts via AsyncStorage
- Methods: `signUp`, `signIn`, `signOut`, `verifyOtp`
- Profile management: `fetchUserProfile`, `updateUserProfile`
- Settings management: `fetchUserSettings`, `updateUserSettings`

### 3. **Authentication Flow**

```
App Launch (splash.tsx)
    ↓
Check Auth State
    ├─ Session exists + Onboarding done → Home Screen (/)
    ├─ Session exists + No onboarding → Home Screen (/)
    ├─ No session + Onboarding done → Login Screen (/login)
    └─ No session + No onboarding → Welcome Screen (/welcome)
```

### 4. **Signup/Registration Flow**

1. **Register Screen** (`app/register/index.tsx`)
   - Email validation (Singapore school emails only)
   - Password validation (min 8 characters)
   - Routes to onboarding with email/password as params

2. **Onboarding** (`app/onboarding/index.tsx`)
   - 5-step wizard:
     - Step 1: Basic info (name, school, year)
     - Step 2: Interests selection
     - Step 3: Personality questionnaire (3 questions)
     - Step 4: Preferences (scope, radius, meet types)
     - Step 5: Review & Submit
   - On submission: Calls `signUp()` with onboarding data
   - Redirects to email verification after signup

3. **Email Verification** (`app/verify/email.tsx`)
   - OTP input (6 digits)
   - Resend OTP with 60s cooldown
   - Calls `verifyOtp()` to verify email
   - Redirects to home on success

4. **Login Screen** (`app/login/index.tsx`)
   - School email validation
   - Password input
   - Redirects to OTP verification if email not confirmed
   - Redirects to home if already verified

## Database Schema

### `profiles` table
```sql
id (uuid) - Primary key
username (text)
full_name (text)
bio (text)
avatar_url (text)
created_at (timestamptz)
updated_at (timestamptz)
```

### `user_settings` table
```sql
user_id (uuid) - Foreign key to auth.users
push_notifications (boolean)
email_notifications (boolean)
appearance (text) - 'light' | 'dark' | 'auto'
created_at (timestamptz)
updated_at (timestamptz)
```

## Singapore School Email Validation

File: `lib/schoolEmailValidation.ts`

Allowed domains:
- Polytechnics: `tp.edu.sg`, `np.edu.sg`, `rp.edu.sg`, `sp.edu.sg`
- ITE: `ite.edu.sg`
- Junior Colleges: `ac.edu.sg`, `vjc.edu.sg`, `tjc.edu.sg`, etc.
- Universities: `u.nus.edu`, `ntu.edu.sg`, `smu.edu.sg`, `sutd.edu.sg`, `sit.edu.sg`

Functions:
- `validateSingaporeSchoolEmail(email)` - Returns boolean
- `getSchoolFromEmail(email)` - Returns school name

## Settings Page

File: `app/settings/index.tsx`

Features:
- Display user profile information
- Edit profile button
- Toggle push notifications
- Toggle email notifications
- Appearance selector (light/dark/auto)
- Sign out button

## Session Persistence

AsyncStorage keys:
- `supabase_session` - Stores auth session
- `pending_email_verification` - Email awaiting verification
- `onboarding_data` - Completed onboarding data

## Error Handling

- Email validation errors
- Password validation errors
- OTP verification failures
- Network errors
- Server errors

## Testing

### Test Account Creation
1. Use email: `test@tp.edu.sg`
2. Password: `Test@123456`
3. Complete onboarding
4. Verify email (mock: use 123456)
5. Access home screen

### Test Login
1. Login with created account
2. System should skip email verification if already verified
3. Should redirect to home on successful login

## Future Enhancements

- [ ] Password reset functionality
- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Biometric authentication
- [ ] Profile image upload
- [ ] Email domain verification
- [ ] Admin dashboard for user management
- [ ] Advanced personality matching algorithm
- [ ] Onboarding data analysis and recommendations

## Security Considerations

- Passwords never stored in AsyncStorage
- Session tokens handled by Supabase
- Email validation on both client and server
- OTP verification required for email confirmation
- School email domain whitelist
- HTTPS/SSL for all connections

## File Structure

```
app/
├── app/
│   ├── _layout.tsx (Updated with AuthProvider)
│   ├── splash.tsx (Auth state check)
│   ├── login/
│   │   └── index.tsx (New)
│   ├── register/
│   │   └── index.tsx (Updated)
│   ├── onboarding/
│   │   └── index.tsx (Updated)
│   ├── settings/
│   │   └── index.tsx (Updated)
│   └── verify/
│       └── email.tsx (Updated)
├── lib/
│   ├── supabase.ts (New)
│   ├── authContext.tsx (New)
│   └── schoolEmailValidation.ts (New)
```

## Installation Requirements

Install the following packages:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

Or with yarn:
```bash
yarn add @supabase/supabase-js @react-native-async-storage/async-storage
```

For Expo projects:
```bash
expo install @react-native-async-storage/async-storage
```

## Configuration

Update `lib/supabase.ts` with your Supabase credentials:
- `SUPABASE_URL`: http://46.62.247.253:8000
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Usage Examples

### Sign Up
```typescript
const { signUp } = useAuth();

const { user, error } = await signUp(
  'user@tp.edu.sg',
  'Password123',
  onboardingData
);
```

### Sign In
```typescript
const { signIn } = useAuth();

const { user, error } = await signIn(
  'user@tp.edu.sg',
  'Password123'
);
```

### Verify OTP
```typescript
const { verifyOtp } = useAuth();

const { user, error } = await verifyOtp(
  'user@tp.edu.sg',
  '123456'
);
```

### Update Settings
```typescript
const { updateUserSettings } = useAuth();

await updateUserSettings({
  push_notifications: false,
  appearance: 'dark'
});
```

## Troubleshooting

### Session not persisting
- Check AsyncStorage permissions in app.json
- Verify Supabase client is initialized correctly
- Check network connectivity

### Email validation failing
- Ensure email ends with valid Singapore school domain
- Check `schoolEmailValidation.ts` for supported domains
- Add new domains if needed

### OTP not being sent
- In development, use mock OTP: `123456`
- Ensure Supabase email service is configured
- Check email templates in Supabase dashboard

### Settings not updating
- Verify user is authenticated
- Check user_settings table exists with correct schema
- Ensure user_id foreign key constraint is correct
