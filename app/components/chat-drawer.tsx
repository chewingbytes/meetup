import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  Keyboard,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { NeoLoader, NeoButtonLoader } from '@/components/ui/neo-loader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, X, MessageSquare } from 'lucide-react-native';
import { useChat } from '@/lib/useChat';
import { useChatNotificationStore } from '@/lib/stores/chatNotificationStore';

const MOBILE_NAV_HEIGHT = 100; // Adjusted to match MobileNav visual height better and close gap

interface ChatDrawerProps {
  channelId: string | null;
  channelName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatDrawer({ channelId, channelName, isOpen, onClose }: ChatDrawerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(360, Math.max(280, width * 0.92));
  const slide = useRef(new Animated.Value(drawerWidth)).current;
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const markRead = useChatNotificationStore((s) => s.markRead);
  const setActiveChannel = useChatNotificationStore((s) => s.setActiveChannel);
  const { messages, onlineUsers, sendMessage, isLoading, error } = useChat(channelId);
  const readableError = error ?? null;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isOpen ? 0 : drawerWidth,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isOpen, drawerWidth, slide]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      // Calculate offset needed to push input above keyboard
      // Keyboard height relative to screen bottom
      const keyboardHeight = event.endCoordinates.height;
      
      // Our drawer is positioned at bottom: MOBILE_NAV
      // So we need to add padding equal to: Keyboard Top - Drawer Bottom
      // Wait, Keyboard Top is (Screen Height - Keyboard Height)
      // Drawer Bottom is (Screen Height - MOBILE_NAV_HEIGHT)
      
      // If Keyboard Height > MOBILE_NAV_HEIGHT, we need to push up by (Keyboard Height - MOBILE_NAV_HEIGHT)
      // If Keyboard Height < MOBILE_NAV_HEIGHT (unlikely for full keyboard), no push needed.
      
      const offset = Math.max(0, keyboardHeight - MOBILE_NAV_HEIGHT);
      setKeyboardOffset(offset);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOffset(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    if (!channelId) {
      return;
    }
    if (isOpen) {
      setActiveChannel(channelId);
      markRead(channelId);
    } else {
      setActiveChannel(null);
    }
  }, [channelId, isOpen, markRead, setActiveChannel]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !channelId) {
      return;
    }
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
  const keyboardVerticalOffset = 0; // Not used if we manually handle padding

  // Calculate the actual visual height of the mobile nav including bottom safe area
  // MobileNav has pb-8 (32) + pt-4 (16) + border-t-4 (4) + icon height (approx 60) + safe area (34)
  // Total is roughly 146. Let's start with 0 for now to let it span down, then add padding.
  // Actually, wait. The user wants it to span DOWN TO the mobile nav.
  // If we set bottom: MOBILE_NAV, it sits on top.
  // We'll set MOBILE_NAV_HEIGHT to a slightly smaller value to ensure overlap or flush fit.
  // Let's use 110. And remove extra safe area from bottom prop.

  // Also move paddingTop to header to fix the top issue.

  return (
    <Animated.View
      pointerEvents={isOpen ? 'auto' : 'none'}
      style={[
        styles.drawer,
        {
        width: drawerWidth,
          paddingTop: 0, // Removed padding here
          paddingBottom: 0, // Removed padding here
          bottom: MOBILE_NAV_HEIGHT, // Fixed flush with nav
        transform: [{ translateX: slide }],
          // Ensure we have a background that covers
        },
      ]}
    >
      <View style={styles.flex}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.headerTextGroup}>
            <View style={styles.headerTitleRow}>
              <MessageSquare size={18} color="#000" strokeWidth={3} style={styles.headerIcon} />
              <Text style={styles.headerTitle}>{channelName || 'Chat'}</Text>
            </View>
            <Text style={styles.headerMeta}>{onlineUsers?.length || 0} Online</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.8}>
            <X size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {onlineUsers && onlineUsers.length > 0 && (
          <View style={styles.ticker}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tickerContent}
            >
              {onlineUsers.map((user, index) => (
                <View 
                  key={user.id || index}
                  style={[
                    styles.tickerChip,
                    index % 2 === 0 ? styles.tickerChipLavender : styles.tickerChipMint,
                  ]}
                >
                  <Text style={styles.tickerText}>{user.username}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.messagesArea}>
          {isLoading ? (
            <NeoLoader />
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.messageListContent}
              renderItem={({ item }) => (
                <View style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>{item.username}</Text>
                    <Text style={styles.messageTime}>
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                  <Text style={styles.messageBody}>{item.text}</Text>
                  </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Dead Air</Text>
                  <Text style={styles.emptySubtitle}>Say something...</Text>
                </View>
              }
            />
          )}
          {readableError && <Text style={styles.errorText}>{readableError}</Text>}
        </View>

        <View style={[styles.inputSection, { marginBottom: keyboardOffset }]}>
          <View style={styles.inputRow}>
            <View style={styles.textFieldWrapper}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                placeholder="MESSAGE..."
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
                 {sending ? <NeoButtonLoader color="#000" /> : <Send size={20} color="#000" strokeWidth={3} />}
              </TouchableOpacity>
           </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FFFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#000',
    zIndex: 60,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 12,
  },
  header: {
    backgroundColor: '#FFD93D',
    borderBottomWidth: 4,
    borderColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { marginRight: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#000',
    letterSpacing: -0.5,
  },
  headerMeta: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#000',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticker: {
    borderBottomWidth: 3,
    borderColor: '#000',
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  tickerContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tickerChip: {
    borderWidth: 2,
    borderColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    transform: [{ rotate: '-2deg' }],
  },
  tickerChipLavender: { backgroundColor: '#C4B5FD' },
  tickerChipMint: {
    backgroundColor: '#A7F3D0',
    transform: [{ rotate: '2deg' }],
  },
  tickerText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#000',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loader: { marginTop: 40 },
  messageListContent: { paddingBottom: 24 },
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
    elevation: 4,
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
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#FF6B6B',
  },
  messageTime: {
    fontSize: 10,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) || 'System',
    color: '#6b7280',
  },
  messageBody: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    lineHeight: 20,
  },
  emptyState: {
    marginTop: 48,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#B91C1C',
    fontWeight: '700',
    textTransform: 'uppercase',
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
  },
  textInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 48,
    height: 48,
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
  },
});
