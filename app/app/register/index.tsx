import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { validateSingaporeSchoolEmail } from '@/lib/schoolEmailValidation';

const PALETTE = {
  coral: '#FF8FA3',
  apricot: '#FFBC8F',
  beige: '#FFE0B2',
  graphite: '#2C2C2C',
  lightGrey: '#F5F5F5',
  white: '#FFFFFF',
  babyPink: '#FFD7E9',
};

export default function RegisterScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProceedToOnboarding = () => {
    // Validate input
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateSingaporeSchoolEmail(email)) {
      Alert.alert('Invalid Email', 'Please use a valid Singapore school email (e.g., name@tp.edu.sg)');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Store credentials temporarily and proceed to onboarding
    // The onboarding screen will then call signUp with these credentials
    router.push({
      pathname: '/onboarding',
      params: {
        email,
        password,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, backgroundColor: PALETTE.white, padding: 20, paddingTop: 80, justifyContent: 'space-between' }}>
        {/* Header */}
        <View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: PALETTE.graphite, marginBottom: 8 }}>Create Account</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32 }}>Sign up with your school email</Text>

          {/* Email Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>School Email</Text>
          <TextInput
            placeholder="name@tp.edu.sg"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: PALETTE.babyPink,
              padding: 14,
              borderRadius: 12,
              marginBottom: 20,
              fontSize: 16,
            }}
          />

          {/* Password Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>Password</Text>
          <View style={{ position: 'relative', marginBottom: 20 }}>
            <TextInput
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={{
                borderWidth: 1,
                borderColor: PALETTE.babyPink,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
                paddingRight: 50,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 14, top: 14 }}
            >
              <Text style={{ color: PALETTE.coral, fontSize: 12 }}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>Confirm Password</Text>
          <View style={{ position: 'relative', marginBottom: 24 }}>
            <TextInput
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              style={{
                borderWidth: 1,
                borderColor: PALETTE.babyPink,
                padding: 14,
                borderRadius: 12,
                fontSize: 16,
                paddingRight: 50,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ position: 'absolute', right: 14, top: 14 }}
            >
              <Text style={{ color: PALETTE.coral, fontSize: 12 }}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 24 }}>
            <Text style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 18 }}>
              Password must be at least 8 characters. Only Singapore school emails are allowed.
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View>
          <TouchableOpacity
            onPress={handleProceedToOnboarding}
            style={{
              backgroundColor: PALETTE.coral,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ color: PALETTE.white, fontWeight: '700', fontSize: 16 }}>Continue to Onboarding</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: '#6b7280' }}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={{ color: PALETTE.coral, fontWeight: '700' }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
