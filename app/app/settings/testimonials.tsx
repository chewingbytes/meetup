import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star, X } from 'lucide-react-native';
import { useAuth } from '@/lib/authContext';
import { getUserEventTestimonials, updateEventTestimonial, deleteEventTestimonial } from '@/lib/api';

interface Testimonial {
  id: string;
  user_id: string;
  event_id: string;
  rating: number;
  text: string;
  created_at: string;
  events?: {
    id: string;
    name: string;
    cover_image?: string;
  };
}

export default function TestimonialsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      if (user?.id) {
        const data = await getUserEventTestimonials(user.id);
        setTestimonials(data || []);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingId(testimonial.id);
      setRating(testimonial.rating);
      setText(testimonial.text);
    } else {
      setEditingId(null);
      setRating(5);
      setText('');
    }
    setShowModal(true);
  };

  const handleSaveTestimonial = async () => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please write a testimonial');
      return;
    }

    try {
      setSubmitting(true);

      if (editingId) {
        await updateEventTestimonial(editingId, { rating, text });
      }

      await loadTestimonials();
      setShowModal(false);
      Alert.alert('Success', 'Testimonial updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save testimonial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventTestimonial(id);
            await loadTestimonials();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete testimonial');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#27272a' }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>My Testimonials</Text>
        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
          {testimonials.length} {testimonials.length === 1 ? 'testimonial' : 'testimonials'}
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {testimonials.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#888', fontSize: 14 }}>No testimonials yet</Text>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              Share your experience with events & communities
            </Text>
          </View>
        ) : (
          testimonials.map((testimonial) => (
            <View
              key={testimonial.id}
              style={{
                backgroundColor: '#18181b',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#27272a',
              }}
            >
              {/* Event Name */}
              {testimonial.events && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#4f46e5', fontSize: 12, fontWeight: '700' }}>
                    {testimonial.events.name}
                  </Text>
                </View>
              )}

              {/* Stars */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Text key={i} style={{ fontSize: 14, marginRight: 2 }}>
                      {i < testimonial.rating ? '⭐' : '☆'}
                    </Text>
                  ))}
                <Text style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
                  {new Date(testimonial.created_at).toLocaleDateString()}
                </Text>
              </View>

              {/* Text */}
              <Text style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
                {testimonial.text}
              </Text>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleOpenModal(testimonial)}
                  style={{
                    flex: 1,
                    backgroundColor: '#4f46e5',
                    borderRadius: 8,
                    paddingVertical: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTestimonial(testimonial.id)}
                  style={{
                    flex: 1,
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    paddingVertical: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>


      {/* Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              justifyContent: 'flex-end',
            }}
            onPress={() => setShowModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{
                  backgroundColor: '#111',
                  borderRadius: 20,
                  maxHeight: '100%',
                }}
                contentContainerStyle={{
                  padding: 20,
                }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
                    {editingId ? 'Edit' : 'Add'} Testimonial
                  </Text>
                  <TouchableOpacity onPress={() => setShowModal(false)}>
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Rating */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                    Rating
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TouchableOpacity key={i} onPress={() => setRating(i)}>
                        <Text style={{ fontSize: 32 }}>{i <= rating ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Text */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                    Your Experience
                  </Text>
                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Share your thoughts..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={6}
                    style={{
                      backgroundColor: '#18181b',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      color: '#fff',
                      fontSize: 14,
                      borderWidth: 1,
                      borderColor: '#27272a',
                      textAlignVertical: 'top',
                      minHeight: 120,
                    }}
                  />
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setShowModal(false)}
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
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveTestimonial}
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
                        {editingId ? 'Update' : 'Share'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
