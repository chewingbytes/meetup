import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { NeoButtonLoader } from '@/components/ui/neo-loader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, GripVertical, Check } from 'lucide-react-native';
import { useAuth } from '@/lib/authContext';
import { saveUserInterests } from '@/lib/api';

const ALL_INTERESTS = [
  { name: 'Gaming', emoji: '🎮' },
  { name: 'Fitness', emoji: '💪' },
  { name: 'Study', emoji: '📚' },
  { name: 'Arts', emoji: '🎨' },
  { name: 'Cafe Hopping', emoji: '☕' },
  { name: 'Sunrise Walks', emoji: '🌅' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Movies/Anime', emoji: '🎬' },
  { name: 'Thrifting', emoji: '👔' },
  { name: 'Career & Tech', emoji: '💻' },
  { name: 'Volunteering', emoji: '🤝' },
  { name: 'Food', emoji: '🍜' },
  { name: 'Travel', emoji: '✈️' },
  { name: 'Photography', emoji: '📸' },
];

interface InterestItem {
  name: string;
  emoji: string;
  rank?: number;
}

export default function InterestRankingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [selectedInterests, setSelectedInterests] = useState<InterestItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectInterest = (interest: InterestItem) => {
    const isSelected = selectedInterests.find((i) => i.name === interest.name);

    if (isSelected) {
      setSelectedInterests(selectedInterests.filter((i) => i.name !== interest.name));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newInterests = [...selectedInterests];
      [newInterests[index], newInterests[index - 1]] = [
        newInterests[index - 1],
        newInterests[index],
      ];
      setSelectedInterests(newInterests);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedInterests.length - 1) {
      const newInterests = [...selectedInterests];
      [newInterests[index], newInterests[index + 1]] = [
        newInterests[index + 1],
        newInterests[index],
      ];
      setSelectedInterests(newInterests);
    }
  };

  const handleSaveInterests = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Select at least one interest');
      return;
    }

    try {
      setIsSubmitting(true);
      const interestNames = selectedInterests.map((i) => i.name);

      if (user?.id) {
        await saveUserInterests(user.id, interestNames);
      }

      // Navigate back to onboarding to continue
      router.replace({ pathname: '/onboarding', params: { step: '2' } });
    } catch (error) {
      Alert.alert('Error', 'Failed to save interests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableInterests = ALL_INTERESTS.filter(
    (i) => !selectedInterests.find((s) => s.name === i.name)
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 12, flex: 1 }}>
          What do you love?
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {/* Selected Interests (Ranked) */}
        {selectedInterests.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 12 }}>
              YOUR INTERESTS (IN ORDER)
            </Text>
            {selectedInterests.map((interest, index) => (
              <View
                key={interest.name}
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 2,
                  borderColor: '#4f46e5',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{interest.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      {interest.name}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 12 }}>#{index + 1} priority</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{
                      padding: 8,
                      opacity: index === 0 ? 0.3 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>⬆️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleMoveDown(index)}
                    disabled={index === selectedInterests.length - 1}
                    style={{
                      padding: 8,
                      opacity: index === selectedInterests.length - 1 ? 0.3 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>⬇️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSelectInterest(interest)}
                    style={{ padding: 8 }}
                  >
                    <Text style={{ fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Available Interests */}
        <View>
          <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 12 }}>
            BROWSE INTERESTS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
            {availableInterests.map((interest) => (
              <TouchableOpacity
                key={interest.name}
                onPress={() => handleSelectInterest(interest)}
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: '#27272a',
                }}
              >
                <Text style={{ fontSize: 16, marginRight: 6 }}>
                  {interest.emoji} {interest.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#27272a' }}>
        <TouchableOpacity
          onPress={handleSaveInterests}
          disabled={isSubmitting || selectedInterests.length === 0}
          style={{
            backgroundColor: selectedInterests.length > 0 ? '#4f46e5' : '#333',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <NeoButtonLoader color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              Save {selectedInterests.length} Interest{selectedInterests.length !== 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
