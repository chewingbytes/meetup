import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { useAuth } from '@/lib/authContext';
import { createEvent, getEventTemplates } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  default_capacity: number;
  color: string;
  icon: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const community_id = (params.community_id as string) || '';
  const organizer_id = user?.id || '';

  const [step, setStep] = useState<'template' | 'details'>(('template' as any) || 'template');
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getEventTemplates(community_id);
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setDescription(template.description);
    setCapacity(String(template.default_capacity));
    setStep('details');
  };

  const handleCreateEvent = async () => {
    if (!name || !startDate || !startTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const start_at = `${startDate}T${startTime}:00Z`;
      // Assume 2 hour duration if not specified
      const endTime = new Date(new Date(start_at).getTime() + 2 * 60 * 60 * 1000).toISOString();

      await createEvent({
        name,
        description,
        start_at,
        end_at: endTime,
        location_text: location,
        community_id,
        organizer_id,
        capacity: parseInt(capacity),
        is_paid: isPaid,
        price: isPaid ? parseFloat(price) : null,
        visibility: 'public',
      });

      Alert.alert('Success', 'Event created!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#27272a' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 12 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>
          {step === 'template' ? 'Choose a Template' : 'Event Details'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {step === 'template' ? (
          <View>
            <Text style={{ color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 16 }}>
              SELECT A TEMPLATE OR START FROM SCRATCH
            </Text>

            {/* Template Cards */}
            {templates.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                {templates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleSelectTemplate(template)}
                    style={{
                      backgroundColor: template.color,
                      borderRadius: 16,
                      padding: 20,
                      marginBottom: 12,
                      opacity: 0.85,
                    }}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 8 }}>{template.icon}</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                      {template.name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                      {template.description}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>
                      ~{template.duration_minutes} min · {template.default_capacity} cap.
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Blank Event */}
            <TouchableOpacity
              onPress={() => {
                setSelectedTemplate(null);
                setStep('details');
              }}
              style={{
                backgroundColor: '#18181b',
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: '#4f46e5',
                borderStyle: 'dashed',
                alignItems: 'center',
              }}
            >
              <Plus size={32} color="#4f46e5" />
              <Text style={{ color: '#4f46e5', fontSize: 16, fontWeight: '700', marginTop: 8 }}>
                Create from Scratch
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Event Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Event Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Coffee & Study"
                placeholderTextColor="#666"
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#fff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#27272a',
                }}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Description
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell us about your event..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#fff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#27272a',
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Location */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Location
              </Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="e.g., Central Library, Level 7"
                placeholderTextColor="#666"
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#fff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#27272a',
                }}
              />
            </View>

            {/* Date & Time */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Date *
                </Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#666"
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: '#27272a',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Time *
                </Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#666"
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: '#27272a',
                  }}
                />
              </View>
            </View>

            {/* Capacity */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Capacity
              </Text>
              <TextInput
                value={capacity}
                onChangeText={setCapacity}
                placeholder="50"
                placeholderTextColor="#666"
                keyboardType="numeric"
                style={{
                  backgroundColor: '#18181b',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#fff',
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#27272a',
                }}
              />
            </View>

            {/* Price Toggle */}
            <TouchableOpacity
              onPress={() => setIsPaid(!isPaid)}
              style={{
                backgroundColor: '#18181b',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Paid Event</Text>
              <View
                style={{
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isPaid ? '#4f46e5' : '#333',
                  justifyContent: 'center',
                  alignItems: isPaid ? 'flex-end' : 'flex-start',
                  paddingHorizontal: 2,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#fff',
                  }}
                />
              </View>
            </TouchableOpacity>

            {/* Price Input */}
            {isPaid && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Price ($)
                </Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  style={{
                    backgroundColor: '#18181b',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    color: '#fff',
                    fontSize: 14,
                    borderWidth: 1,
                    borderColor: '#27272a',
                  }}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#27272a', flexDirection: 'row', gap: 12 }}>
        {step === 'details' && (
          <TouchableOpacity
            onPress={() => setStep('template')}
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#27272a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step === 'template' ? undefined : handleCreateEvent}
          disabled={submitting}
          style={{
            flex: 1,
            backgroundColor: '#4f46e5',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {step === 'template' ? 'Next' : 'Create Event'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
