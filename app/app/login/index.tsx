import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/authContext';
import { validateSingaporeSchoolEmail } from '@/lib/schoolEmailValidation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PALETTE = {
  coral: '#FF8FA3',
  apricot: '#FFBC8F',
  beige: '#FFE0B2',
  graphite: '#2C2C2C',
  lightGrey: '#F5F5F5',
  white: '#FFFFFF',
  babyPink: '#FFD7E9',
};

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    try {
      // Validate input
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (!validateSingaporeSchoolEmail(email)) {
        Alert.alert('Invalid Email', 'Please use a valid Singapore school email (e.g., name@tp.edu.sg)');
        return;
      }

      setIsLoading(true);

      const { user, error } = await signIn(email, password);

      if (error) {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in');
        return;
      }

      if (user) {
        // Check if email is verified
        if (!user.email_confirmed_at) {
          // Redirect to OTP verification
          await AsyncStorage.setItem('pending_email_verification', email);
          router.push('/verify/email');
        } else {
          // Successfully signed in
          router.replace('/');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, backgroundColor: PALETTE.white, padding: 20, paddingTop: 80, justifyContent: 'space-between' }}>
        {/* Header */}
        <View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: PALETTE.graphite, marginBottom: 8 }}>Welcome Back</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>Sign in with your school email</Text>

          {/* Email Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>School Email</Text>
          <TextInput
            placeholder="name@tp.edu.sg"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            style={{
              borderWidth: 1,
              borderColor: PALETTE.babyPink,
              padding: 14,
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: isLoading ? PALETTE.lightGrey : PALETTE.white,
            }}
          />

          {/* Password Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>Password</Text>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              style={{
                borderWidth: 1,
                borderColor: PALETTE.babyPink,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
                paddingRight: 50,
                backgroundColor: isLoading ? PALETTE.lightGrey : PALETTE.white,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, top: 14 }}
            >
              <Text style={{ color: PALETTE.coral }}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 18 }}>
              Only Singapore school emails are allowed (tp.edu.sg, np.edu.sg, ite.edu.sg, jc emails, universities, etc.)
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View>
          <TouchableOpacity
            onPress={handleSignIn}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#ddd' : PALETTE.coral,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={PALETTE.white} />
            ) : (
              <Text style={{ color: PALETTE.white, fontWeight: '700', fontSize: 16 }}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: '#6b7280' }}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={isLoading}>
              <Text style={{ color: PALETTE.coral, fontWeight: '700' }}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
