import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { useAuth } from '@/lib/authContext';

interface EventParticipant {
  user_id: string;
  full_name: string;
  avatar_url: string;
  joined_at: string;
  role?: 'organizer' | 'participant';
}

export default function EventParticipantsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const event_id = (params.event_id as string) || '';

  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    // TODO: Implement fetching participants from event_attendees table
    setLoading(false);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleInviteFriend = () => {
    Alert.alert('Invite Friend', 'Select a friend to invite', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Invite', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#27272a' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 12 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>
          Participants ({participants.length})
        </Text>
        <TouchableOpacity onPress={handleInviteFriend} style={{ padding: 8 }}>
          <UserPlus size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : participants.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>No participants yet</Text>
          </View>
        ) : (
          participants.map((participant) => (
            <TouchableOpacity
              key={participant.user_id}
              onPress={() => handleViewProfile(participant.user_id)}
              style={{
                backgroundColor: '#18181b',
                borderRadius: 16,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
            >
              <Image
                source={{ uri: participant.avatar_url || 'https://via.placeholder.com/50' }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 12,
                  backgroundColor: '#27272a',
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                  {participant.full_name}
                </Text>
                <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                  {participant.role === 'organizer' ? '👑 Organizer' : 'Joined ' + new Date(participant.joined_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>View</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
