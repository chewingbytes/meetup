import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  // Initialize session from AsyncStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Retrieve session from storage
        const storedSession = await AsyncStorage.getItem('supabase_session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          setSession(session);
          
          // Fetch user profile and settings
          await fetchUserProfile();
          await fetchUserSettings();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(session));
        await fetchUserProfile();
        await fetchUserSettings();
      } else {
        await AsyncStorage.removeItem('supabase_session');
        setUserProfile(null);
        setUserSettings(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, onboardingData: OnboardingData) => {
    try {
      // Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { user: null, error: authError };
      }

      if (data.user) {
        // Store onboarding data in AsyncStorage for later use
        await AsyncStorage.setItem('onboarding_data', JSON.stringify(onboardingData));

        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username: email.split('@')[0],
            full_name: onboardingData.name,
            bio: '',
            avatar_url: '',
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
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
          console.error('Error creating user settings:', settingsError);
        }
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (data.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(data.session));
        setSession(data.session);
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('supabase_session');
      await AsyncStorage.removeItem('onboarding_data');
      setSession(null);
      setUserProfile(null);
      setUserSettings(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        return { user: null, error };
      }

      if (data.session) {
        await AsyncStorage.setItem('supabase_session', JSON.stringify(data.session));
        setSession(data.session);
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!session?.user?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      await fetchUserProfile();
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user settings:', error);
        return;
      }

      setUserSettings(data);
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
    }
  };

  const updateUserSettings = async (updates: Partial<UserSettings>) => {
    try {
      if (!session?.user?.id) return;

      const { error } = await supabase
        .from('user_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating user settings:', error);
        return;
      }

      await fetchUserSettings();
    } catch (error) {
      console.error('Error in updateUserSettings:', error);
    }
  };

  const value: AuthContextType = {
    session,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
