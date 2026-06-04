import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Send, ChevronLeft, MessageSquare, MoreVertical, Phone, Video } from 'lucide-react-native';
import { useChat } from '@/lib/useChat';
import { useChatNotificationStore } from '@/lib/stores/chatNotificationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NeoLoader, NeoButtonLoader } from '@/components/ui/neo-loader';

export default function ChatScreen() {
  const { channelId, channelName } = useLocalSearchParams<{ channelId: string; channelName: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  
  const markRead = useChatNotificationStore((s) => s.markRead);
  const setActiveChannel = useChatNotificationStore((s) => s.setActiveChannel);
  
  // Initialize chat hook
  const { messages, onlineUsers, sendMessage, isLoading, error } = useChat(channelId);
  const readableError = error ?? null;

  // Mark as read and active when entering
  useEffect(() => {
    if (channelId) {
      setActiveChannel(channelId);
      markRead(channelId);
    }
    return () => {
      setActiveChannel(null);
    };
  }, [channelId, markRead, setActiveChannel]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !channelId) return;
    
    setSending(true);
    try {
      await sendMessage(trimmed);
      setText('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length > 0 && !sending;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal'
        }} 
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color="#000" strokeWidth={3} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                #{channelName || 'general'}
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>
              {onlineUsers?.length || 0} online
            </Text>
          </View>

          {/* <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
               <Phone size={20} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
               <Video size={20} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>
          </View> */}
        </View>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
      >
        <View style={styles.chatBackground}>
          {isLoading ? (
            <View style={styles.loader}>
              <NeoLoader />
            </View>
          ) : (
            <FlatList
              data={[...messages].reverse()}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              renderItem={({ item, index }) => {
                // Determine if we should show the sender name (if previous message was from different user)
                // Note: list is inverted, so "previous" visual message is actually next in array
                const isMyMessage = false; // logic would need current user id to be perfect, assuming left/right for now if we had auth id
                // For now, using the neo-brutalist style from before where all messages are cards on the left
                
                return (
                  <View style={styles.messageCard}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageAuthor}>{item.username}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.messageBody}>{item.text}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <MessageSquare size={40} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyTitle}>Welcome to #{channelName}</Text>
                  <Text style={styles.emptySubtitle}>This is the start of the conversation.</Text>
                </View>
              }
            />
          )}
          
          {readableError && (
             <View style={styles.errorContainer}>
               <Text style={styles.errorText}>{readableError}</Text>
             </View>
          )}
        </View>

        {/* Input Area */}
        <View style={[styles.inputSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.inputRow}>
            <View style={styles.textFieldWrapper}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Message..."
                placeholderTextColor="#999"
                multiline
                style={styles.textInput}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            >
              {sending ? (
                <NeoButtonLoader color="#000" />
              ) : (
                <Send size={24} color="#000" strokeWidth={3} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  header: {
    backgroundColor: '#FFD93D',
    borderBottomWidth: 4,
    borderColor: '#000',
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  backButton: {
    marginRight: 12,
    marginLeft: -8,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 20,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#000',
    paddingBottom: 4,
    marginBottom: 6,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#FF6B6B',
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
  },
  messageBody: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    opacity: 0.7,
    transform: [{ scaleY: -1 }] // Counteract inverted list
  },
  emptyIconContainer: {
    marginBottom: 16,
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#94a3b8',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#94a3b8',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#fee2e2',
    margin: 16,
    borderWidth: 2,
    borderColor: '#991b1b',
  },
  errorText: {
    color: '#991b1b',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputSection: {
    borderTopWidth: 4,
    borderColor: '#000',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textFieldWrapper: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#000',
    backgroundColor: '#fff',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    minHeight: 50,
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    maxHeight: 120,
    textAlignVertical: 'top',
    color: '#000'
  },
  sendButton: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD93D',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
});
