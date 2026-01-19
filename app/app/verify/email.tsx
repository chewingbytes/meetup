import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
// import { useAuth } from '@/lib/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PALETTE = {
  coral: '#FF8FA3',
  white: '#FFFFFF',
  graphite: '#2C2C2C',
  lightGrey: '#F5F5F5',
  babyPink: '#FFD7E9',
};

export default function EmailVerify() {
  const router = useRouter();
  // const { verifyOtp } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    // Retrieve email from AsyncStorage (set during signup)
    const getEmail = async () => {
      const savedEmail = await AsyncStorage.getItem('pending_email_verification');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    };
    getEmail();
  }, []);

  // Timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !canResend) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setIsLoading(true);
      // DEV MODE: Mock OTP send
      Alert.alert('Success', `🔧 DEV MODE: Use code 123456 to verify`);
      setCanResend(false);
      setTimeLeft(60);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);

      // DEV MODE: Only accept 123456
      if (otp === '123456') {
        Alert.alert('Success', '✅ Email verified! Redirecting...');
        await AsyncStorage.removeItem('pending_email_verification');
        router.replace('/');
        return;
      }

      // Invalid code
      Alert.alert('Invalid Code', '🔧 DEV MODE: Use 123456');
      setOtp('');

      // COMMENTED OUT: Original verifyOtp logic
      // const { user, error } = await verifyOtp(email, otp);
      // if (error) {
      //   Alert.alert('Verification Failed', error.message || 'Invalid code');
      //   return;
      // }
      // if (user) {
      //   await AsyncStorage.removeItem('pending_email_verification');
      //   router.replace('/');
      // }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View
        style={{
          flex: 1,
          padding: 20,
          backgroundColor: PALETTE.white,
          justifyContent: 'space-between',
          paddingTop: 60,
        }}
      >
        {/* Header */}
        <View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '800',
              color: PALETTE.graphite,
              marginBottom: 8,
            }}
          >
            Verify Your Email
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 24, fontSize: 16 }}>
            We've sent a verification code to:
          </Text>

          {/* Email Display */}
          <View
            style={{
              backgroundColor: PALETTE.lightGrey,
              padding: 14,
              borderRadius: 12,
              marginBottom: 28,
            }}
          >
            <Text style={{ textAlign: 'center', color: PALETTE.graphite, fontWeight: '600' }}>
              {email}
            </Text>
          </View>

          {/* OTP Input */}
          <Text style={{ marginBottom: 8, color: PALETTE.graphite, fontWeight: '600' }}>
            Enter Verification Code
          </Text>
          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            editable={!isLoading}
            style={{
              borderWidth: 1,
              borderColor: PALETTE.babyPink,
              padding: 14,
              borderRadius: 12,
              marginBottom: 24,
              fontSize: 20,
              letterSpacing: 8,
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: isLoading ? PALETTE.lightGrey : PALETTE.white,
            }}
          />

          {/* Info - DEV MODE */}
          <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#F59E0B' }}>
            <Text style={{ fontSize: 13, color: '#92400E', lineHeight: 18, fontWeight: '600' }}>
              🔧 DEV MODE: Enter 123456 to verify
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View>
          <TouchableOpacity
            onPress={handleVerifyOtp}
            disabled={isLoading || otp.length < 6}
            style={{
              backgroundColor:
                isLoading || otp.length < 6 ? '#ddd' : PALETTE.coral,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={PALETTE.white} />
            ) : (
              <Text
                style={{
                  color: PALETTE.white,
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={!canResend || isLoading}
            style={{
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: !canResend ? '#ccc' : PALETTE.coral,
                fontWeight: '600',
              }}
            >
              {canResend
                ? 'Resend Code'
                : `Resend in ${timeLeft}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}