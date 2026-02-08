import { create } from "zustand";

interface ChatNotificationState {
  unreadByChannel: Record<string, number>;
  lastReadByChannel: Record<string, string>;
  activeChannelId: string | null;
  incrementUnread: (channelId: string) => void;
  markRead: (channelId: string) => void;
  setActiveChannel: (channelId: string | null) => void;
  clearChannel: (channelId: string) => void;
  clearAll: () => void;
}

export const useChatNotificationStore = create<ChatNotificationState>((set, get) => ({
  unreadByChannel: {},
  lastReadByChannel: {},
  activeChannelId: null,

  incrementUnread: (channelId: string) => {
    const current = get().unreadByChannel[channelId] || 0;
    set({
      unreadByChannel: {
        ...get().unreadByChannel,
        [channelId]: current + 1,
      },
    });
  },

  markRead: (channelId: string) => {
    set({
      unreadByChannel: {
        ...get().unreadByChannel,
        [channelId]: 0,
      },
      lastReadByChannel: {
        ...get().lastReadByChannel,
        [channelId]: new Date().toISOString(),
      },
    });
  },

  setActiveChannel: (channelId: string | null) => {
    set({ activeChannelId: channelId });
  },

  clearChannel: (channelId: string) => {
    const unreadByChannel = { ...get().unreadByChannel };
    const lastReadByChannel = { ...get().lastReadByChannel };
    delete unreadByChannel[channelId];
    delete lastReadByChannel[channelId];
    set({ unreadByChannel, lastReadByChannel });
  },

  clearAll: () => {
    set({ unreadByChannel: {}, lastReadByChannel: {}, activeChannelId: null });
  },
}));
