import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send, X, Users } from 'lucide-react-native';
import { useChat } from '@/lib/useChat';

interface ChatDrawerProps {
  channelId: string | null;
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatDrawer({
  channelId,
  channelName,
  isOpen,
  onClose,
}: ChatDrawerProps) {
  const drawerWidth = 380;
  const slide = useRef(new Animated.Value(drawerWidth)).current;
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { messages, onlineUsers, sendMessage, isLoading, error } =
    useChat(channelId);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isOpen ? 0 : drawerWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen, slide]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !channelId) return;

    try {
      setIsSending(true);
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: drawerWidth,
        transform: [{ translateX: slide }],
        backgroundColor: '#0f0f12',
        borderLeftWidth: 1,
        borderLeftColor: '#18181b',
        zIndex: 50,
        flex: 1,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#27272a',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              #{channelName}
            </Text>
            <Text
              style={{
                color: '#71717a',
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {onlineUsers.length} online
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Online Users List */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#27272a',
            maxHeight: 120,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Users size={14} color='#a1a1aa' />
            <Text
              style={{
                color: '#a1a1aa',
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              Online Now
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ gap: 8 }}
          >
            {onlineUsers.map((user) => (
              <View
                key={user.id}
                style={{
                  backgroundColor: '#18181b',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#4f46e5',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {user.username}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {}}
        >
          {isLoading ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <ActivityIndicator color='#4f46e5' />
            </View>
          ) : messages.length === 0 ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#71717a', textAlign: 'center' }}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          ) : (
            messages.map((msg, idx) => (
              <View
                key={msg.id}
                style={{
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {msg.username}
                  </Text>
                  <Text
                    style={{
                      color: '#71717a',
                      fontSize: 11,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text
                  style={{
                    color: '#e4e4e7',
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  {msg.text}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: '#27272a',
            gap: 8,
          }}
        >
          {error && (
            <Text
              style={{
                color: '#ef4444',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#18181b',
              borderWidth: 1,
              borderColor: '#27272a',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder={`Message #${channelName}...`}
              placeholderTextColor='#71717a'
              multiline
              maxLength={500}
              editable={!isSending}
              style={{
                flex: 1,
                color: '#fff',
                fontSize: 13,
                paddingVertical: 4,
              }}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              style={{ padding: 4 }}
            >
              {isSending ? (
                <ActivityIndicator size={18} color='#4f46e5' />
              ) : (
                <Send
                  size={18}
                  color={messageText.trim() ? '#4f46e5' : '#71717a'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
