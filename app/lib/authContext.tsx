import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  personality_type?: string | null;
  social_preference?: string | null;
  interests?: string[] | string | null;
  school?: string | null;
  year_of_study?: string | null;
  personality_answers?: Record<string, string> | null;
}

interface UserSettings {
  user_id: string;
  push_notifications: boolean;
  email_notifications: boolean;
  appearance: string;
  created_at: string;
  updated_at: string;
}

interface OnboardingData {
  name: string;
  school: string;
  year: string;
  selectedInterests: string[];
  personalityAnswers: Record<string, string>;
  prefScope: string;
  radius: number;
  preferredTypes: string[];
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userProfile: UserProfile | null;
  userSettings: UserSettings | null;
  onboardingData: OnboardingData | null;
  
  // Auth methods
  signUp: (email: string, password: string, onboardingData: OnboardingData) => Promise<{ user: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ user: any; error: any }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ user: any; error: any }>;
  
  // Profile methods
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  fetchUserSettings: () => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  // Initialize session from Supabase (not AsyncStorage - Supabase handles this)
  useEffect(() => {
    console.log('🔵 AuthProvider: Initializing...');
    
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get session from Supabase (it auto-loads from storage)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('📱 Initial session check:', session ? `Found user: ${session.user.email}` : 'No session');
        
        if (error) {
          console.error('❌ Session error:', error);
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          console.log('✅ Session set:', session.user.email);
          
          // Fetch user data
          await fetchUserProfileInternal(session.user.id);
          await fetchUserSettingsInternal(session.user.id);
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        console.log('✅ Auth initialization complete');
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session ? `User: ${session.user.email}` : 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        await fetchUserProfileInternal(session.user.id);
        await fetchUserSettingsInternal(session.user.id);
      } else {
        setUserProfile(null);
        setUserSettings(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      console.log('🔴 Unsubscribing from auth changes');
      subscription.unsubscribe();
    };
  }, []);

  // Internal fetch methods that accept userId
  const fetchUserProfileInternal = async (userId: string) => {
    try {
      console.log('🔵 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        return;
      }

      console.log('✅ Profile loaded:', data?.username);
      setUserProfile(data);
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
    }
  };

  const fetchUserSettingsInternal = async (userId: string) => {
    try {
      console.log('🔵 Fetching settings for user:', userId);
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user settings:', error);
        return;
      }

      console.log('✅ Settings loaded');
      setUserSettings(data);
    } catch (error) {
      console.error('❌ Error in fetchUserSettings:', error);
    }
  };

  const signUp = async (email: string, password: string, onboardingData: OnboardingData) => {
    try {
      console.log('🔵 Signing up:', email);
      
      // Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0],
            full_name: onboardingData.name,
          }
        }
      });

      if (authError) {
        console.error('❌ Sign up error:', authError);
        return { user: null, error: authError };
      }

      console.log('✅ Sign up successful:', data.user?.email);

      if (data.user) {
        // Store onboarding data
        await AsyncStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

        // Create profile entry with personality data
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: email.split('@')[0],
            full_name: onboardingData.name,
            bio: '',
            avatar_url: '',
            school: onboardingData.school,
            year_of_study: onboardingData.year,
            interests: onboardingData.selectedInterests,
            personality_answers: onboardingData.personalityAnswers,
            // Derive personality_type and social_preference from answers
            personality_type: onboardingData.personalityAnswers?.social || null,
            social_preference: onboardingData.personalityAnswers?.connect || null,
          });

        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
        }

        // Create user_settings entry
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: data.user.id,
            push_notifications: true,
            email_notifications: true,
            appearance: 'light',
          });

        if (settingsError) {
          console.error('❌ Error creating user settings:', settingsError);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { user: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔵 Signing in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        return { user: null, error };
      }

      console.log('✅ Sign in successful:', data.user?.email);
      
      // Session is automatically set by onAuthStateChange
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔵 Signing out');
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('onboarding_data');
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setUserSettings(null);
      console.log('✅ Signed out');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      console.log('🔵 Verifying OTP for:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        console.error('❌ OTP verification error:', error);
        return { user: null, error };
      }

      console.log('✅ OTP verified:', data.user?.email);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('❌ OTP verification exception:', error);
      return { user: null, error };
    }
  };

  const fetchUserProfile = async () => {
    if (!user?.id) {
      console.warn('⚠️ Cannot fetch profile: No user');
      return;
    }
    await fetchUserProfileInternal(user.id);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user?.id) {
        console.warn('⚠️ Cannot update profile: No user');
        return;
      }

      console.log('🔵 Updating profile');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error updating profile:', error);
        return;
      }

      console.log('✅ Profile updated');
      await fetchUserProfile();
    } catch (error) {
      console.error('❌ Error in updateUserProfile:', error);
    }
  };

  const fetchUserSettings = async () => {
    if (!user?.id) {
      console.warn('⚠️ Cannot fetch settings: No user');
      return;
    }
    await fetchUserSettingsInternal(user.id);
  };

  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    try {
      if (!user?.id) {
        console.warn('⚠️ Cannot update settings: No user');
        return;
      }

      console.log('🔵 Updating settings');

      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error updating user settings:', error);
        return;
      }

      console.log('✅ Settings updated');
      await fetchUserSettings();
    } catch (error) {
      console.error('❌ Error in updateUserSettings:', error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    userProfile,
    userSettings,
    onboardingData,
    signUp,
    signIn,
    signOut,
    verifyOtp,
    fetchUserProfile,
    updateUserProfile,
    fetchUserSettings,
    updateUserSettings,
  };

  console.log('🟢 AuthContext render - Loading:', isLoading, 'User:', user?.email || 'None');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}