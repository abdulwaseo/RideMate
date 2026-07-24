import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatRoom, TypingUser } from '../types/chat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  replyingTo: ChatMessage | null;
  setReplyingTo: (msg: ChatMessage | null) => void;
  selectRoom: (roomId: string) => void;
  sendMessage: (content: string, replyToId?: string) => Promise<boolean>;
  editMessage: (messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  markAsRead: (messageIds: string[]) => void;
  sendTyping: (isTyping: boolean) => void;
  refreshRooms: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { sendEvent, joinRoom, leaveRoom, subscribe, isConnected } = useWebSocket();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [typingMap, setTypingMap] = useState<Record<string, TypingUser[]>>({});
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const typingTimeoutRef = useRef<any>(null);

  // Fetch accessible chat rooms directly from backend REST API
  const refreshRooms = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch('/api/v1/chat/rooms', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setRooms(json.data || []);
      }
    } catch (err) {
      console.warn('[ChatContext] Error fetching chat rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      refreshRooms();
    } else {
      setRooms([]);
      setActiveRoomId(null);
      setMessagesMap({});
    }
  }, [isAuthenticated, refreshRooms]);

  // Load message history from backend when active room changes
  useEffect(() => {
    if (!activeRoomId || !isAuthenticated) return;

    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
        const res = await fetch(`/api/v1/chat/rooms/${activeRoomId}/messages?size=100`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          setMessagesMap((prev) => ({
            ...prev,
            [activeRoomId]: json.data || [],
          }));
        }
      } catch (err) {
        console.warn('[ChatContext] Error fetching messages for room:', activeRoomId, err);
      }
    };

    fetchMessages();

    // Subscribe socket to chat room
    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    joinRoom(chatChannel);

    return () => {
      leaveRoom(chatChannel);
    };
  }, [activeRoomId, isAuthenticated, joinRoom, leaveRoom]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    const unsubRoomCreated = subscribe('room_created', (evt) => {
      const room = evt.payload as ChatRoom;
      if (room && room.id) {
        setRooms((prev) => [room, ...prev.filter((r) => r.id !== room.id)]);
      }
    });

    const unsubReceived = subscribe('message_received', (evt) => {
      const msg = evt.payload as ChatMessage;
      if (!msg || !msg.chat_room_id) return;

      const roomId = msg.chat_room_id;
      setMessagesMap((prev) => {
        const existing = prev[roomId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [roomId]: [...existing, msg] };
      });

      // Update room last message preview
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, last_message: msg } : r))
      );
    });

    const unsubEdit = subscribe('message_edit', (evt) => {
      const msg = evt.payload as ChatMessage;
      if (!msg) return;
      setMessagesMap((prev) => {
        const list = prev[msg.chat_room_id] || [];
        return {
          ...prev,
          [msg.chat_room_id]: list.map((m) => (m.id === msg.id ? { ...m, ...msg } : m)),
        };
      });
    });

    const unsubDelete = subscribe('message_delete', (evt) => {
      const msg = evt.payload as ChatMessage;
      if (!msg) return;
      setMessagesMap((prev) => {
        const list = prev[msg.chat_room_id] || [];
        return {
          ...prev,
          [msg.chat_room_id]: list.map((m) => (m.id === msg.id ? { ...m, is_deleted: true, content: '[Message deleted]' } : m)),
        };
      });
    });

    const unsubRead = subscribe('message_read', (evt) => {
      const payload = evt.payload as { user_id: string; message_ids: string[] };
      if (!payload || !payload.message_ids) return;

      setMessagesMap((prev) => {
        const updated: Record<string, ChatMessage[]> = {};
        for (const [rId, list] of Object.entries(prev)) {
          updated[rId] = list.map((m) => {
            if (payload.message_ids.includes(m.id)) {
              return { ...m, read_count: (m.read_count || 0) + 1 };
            }
            return m;
          });
        }
        return updated;
      });
    });

    const unsubTypingStart = subscribe('typing_start', (evt) => {
      const payload = evt.payload as { user_id: string; user_name: string };
      const roomId = evt.room_id?.replace('chat:', '') || activeRoomId;
      if (!roomId || !payload.user_id || payload.user_id === user?.mobileNumber) return;

      setTypingMap((prev) => {
        const current = prev[roomId] || [];
        if (current.some((u) => u.user_id === payload.user_id)) return prev;
        return { ...prev, [roomId]: [...current, { user_id: payload.user_id, user_name: payload.user_name }] };
      });
    });

    const unsubTypingStop = subscribe('typing_stop', (evt) => {
      const payload = evt.payload as { user_id: string };
      const roomId = evt.room_id?.replace('chat:', '') || activeRoomId;
      if (!roomId || !payload.user_id) return;

      setTypingMap((prev) => {
        const current = prev[roomId] || [];
        return { ...prev, [roomId]: current.filter((u) => u.user_id !== payload.user_id) };
      });
    });

    return () => {
      unsubRoomCreated();
      unsubReceived();
      unsubEdit();
      unsubDelete();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [isConnected, subscribe, activeRoomId, user]);

  const selectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setReplyingTo(null);
  };

  const sendMessage = async (content: string, replyToId?: string): Promise<boolean> => {
    if (!activeRoomId || !content.trim()) return false;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;

    // Try socket send first
    const sent = sendEvent({
      event_type: 'message_send',
      room_id: chatChannel,
      payload: {
        room_id: chatChannel,
        content: content.trim(),
        reply_to_message_id: replyToId,
      },
    });

    if (sent) {
      setReplyingTo(null);
      sendTyping(false);
      return true;
    }

    // REST fallback
    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: content.trim(),
          reply_to_message_id: replyToId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const msg = json.data as ChatMessage;
        setMessagesMap((prev) => ({
          ...prev,
          [activeRoomId]: [...(prev[activeRoomId] || []), msg],
        }));
        setReplyingTo(null);
        sendTyping(false);
        return true;
      }
    } catch (err) {
      console.warn('[ChatContext] REST send message fallback:', err);
    }
    return false;
  };

  const editMessage = async (messageId: string, newContent: string): Promise<boolean> => {
    if (!activeRoomId || !newContent.trim()) return false;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    const sent = sendEvent({
      event_type: 'message_edit',
      room_id: chatChannel,
      payload: { room_id: chatChannel, message_id: messageId, content: newContent.trim() },
    });

    if (sent) return true;

    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/chat/rooms/${activeRoomId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newContent.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        const updated = json.data as ChatMessage;
        setMessagesMap((prev) => ({
          ...prev,
          [activeRoomId]: (prev[activeRoomId] || []).map((m) => (m.id === messageId ? updated : m)),
        }));
        return true;
      }
    } catch (err) {
      console.error('[ChatContext] Error editing message:', err);
    }
    return false;
  };

  const deleteMessage = async (messageId: string): Promise<boolean> => {
    if (!activeRoomId) return false;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    const sent = sendEvent({
      event_type: 'message_delete',
      room_id: chatChannel,
      payload: { room_id: chatChannel, message_id: messageId },
    });

    if (sent) return true;

    try {
      const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
      const res = await fetch(`/api/v1/chat/rooms/${activeRoomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setMessagesMap((prev) => ({
          ...prev,
          [activeRoomId]: (prev[activeRoomId] || []).map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, content: '[Message deleted]' } : m
          ),
        }));
        return true;
      }
    } catch (err) {
      console.error('[ChatContext] Error deleting message:', err);
    }
    return false;
  };

  const markAsRead = (messageIds: string[]) => {
    if (!activeRoomId || messageIds.length === 0) return;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    sendEvent({
      event_type: 'message_read',
      room_id: chatChannel,
      payload: { room_id: chatChannel, message_ids: messageIds },
    });

    // REST fallback
    const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
    fetch(`/api/v1/chat/rooms/${activeRoomId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message_ids: messageIds }),
    }).catch(() => {});
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeRoomId) return;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    sendEvent({
      event_type: isTyping ? 'typing_start' : 'typing_stop',
      room_id: chatChannel,
      payload: { room_id: chatChannel },
    });

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const currentMessages = activeRoomId ? messagesMap[activeRoomId] || [] : [];
  const currentTypingUsers = activeRoomId ? typingMap[activeRoomId] || [] : [];

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        messages: currentMessages,
        typingUsers: currentTypingUsers,
        isLoading,
        replyingTo,
        setReplyingTo,
        selectRoom,
        sendMessage,
        editMessage,
        deleteMessage,
        markAsRead,
        sendTyping,
        refreshRooms,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
