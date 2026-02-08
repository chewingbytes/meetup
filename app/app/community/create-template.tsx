import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { createEventTemplate } from '@/lib/api';

const ICON_OPTIONS = ['📅', '🎉', '🎓', '🏃', '☕', '🎬', '🎵', '🎮', '🍕', '🌍'];
const COLOR_OPTIONS = [
  '#FF8FA3', // Coral
  '#FFBC8F', // Apricot
  '#FFE0B2', // Beige
  '#A78BFA', // Purple
  '#60A5FA', // Blue
  '#34D399', // Green
  '#FBBF24', // Amber
  '#F87171', // Red
];

export default function CreateTemplateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const community_id = (params.community_id as string) || '';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('120');
  const [defaultCapacity, setDefaultCapacity] = useState('50');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTemplate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    try {
      setIsSubmitting(true);

      await createEventTemplate({
        community_id,
        name: name.trim(),
        description: description.trim(),
        duration_minutes: parseInt(durationMinutes) || 120,
        default_capacity: parseInt(defaultCapacity) || 50,
        icon: selectedIcon,
        color: selectedColor,
      });

      Alert.alert('Success', 'Event template created successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error creating template:', error);
      Alert.alert('Error', error.message || 'Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#27272a' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 12 }}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>
          Create Event Template
        </Text>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
        {/* Template Name */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            Template Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Study Session, Coffee Meetup"
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
            placeholder="Describe what this template is for..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
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

        {/* Duration and Capacity */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Duration (minutes)
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="120"
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
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Default Capacity
            </Text>
            <TextInput
              value={defaultCapacity}
              onChangeText={setDefaultCapacity}
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
        </View>

        {/* Icon Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
            Choose an Icon
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ICON_OPTIONS.map((icon) => (
              <TouchableOpacity
                key={icon}
                onPress={() => setSelectedIcon(icon)}
                style={{
                  width: '22%',
                  aspectRatio: 1,
                  backgroundColor: selectedIcon === icon ? '#4f46e5' : '#18181b',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: selectedIcon === icon ? '#4f46e5' : '#27272a',
                }}
              >
                <Text style={{ fontSize: 28 }}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
            Choose a Color
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: '22%',
                  aspectRatio: 1,
                  backgroundColor: color,
                  borderRadius: 12,
                  borderWidth: 3,
                  borderColor: selectedColor === color ? '#fff' : 'transparent',
                }}
              />
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
            Preview
          </Text>
          <TouchableOpacity
            disabled
            style={{
              backgroundColor: selectedColor,
              borderRadius: 16,
              padding: 20,
              opacity: 0.85,
            }}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>{selectedIcon}</Text>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              {name || 'Template Name'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {description || 'Template description will appear here'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 8 }}>
              ~{durationMinutes} min · {defaultCapacity} cap.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#27272a', flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
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
          onPress={handleCreateTemplate}
          disabled={isSubmitting}
          style={{
            flex: 1,
            backgroundColor: '#4f46e5',
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Create Template</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
