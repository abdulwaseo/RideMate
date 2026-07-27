import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatRoom, TypingUser } from '../types/chat';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { getAuthToken } from '../utils/token';
import { API_V1_URL } from '../config/api';

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  isLoading: boolean;
  replyingTo: ChatMessage | null;
  totalUnreadCount: number;
  setReplyingTo: (msg: ChatMessage | null) => void;
  selectRoom: (roomId: string | null) => void;
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
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/chat/rooms`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const rawRooms: ChatRoom[] = json.data || [];
        const uniqueRooms: ChatRoom[] = [];
        for (const r of rawRooms) {
          if (!uniqueRooms.some((existing) => existing.id === r.id || (existing.ride_id && existing.ride_id === r.ride_id))) {
            uniqueRooms.push(r);
          }
        }
        setRooms(uniqueRooms);
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

  const joinRoomRef = useRef(joinRoom);
  useEffect(() => { joinRoomRef.current = joinRoom; }, [joinRoom]);

  const leaveRoomRef = useRef(leaveRoom);
  useEffect(() => { leaveRoomRef.current = leaveRoom; }, [leaveRoom]);

  // Load message history from backend when active room changes
  useEffect(() => {
    if (!activeRoomId || !isAuthenticated) return;

    const fetchMessages = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_V1_URL}/chat/rooms/${activeRoomId}/messages?size=100`, {
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
    joinRoomRef.current(chatChannel);

    return () => {
      leaveRoomRef.current(chatChannel);
    };
  }, [activeRoomId, isAuthenticated]);

  // Ref-based stable values for WebSocket listeners
  const activeRoomIdRef = useRef(activeRoomId);
  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const refreshRoomsRef = useRef(refreshRooms);
  useEffect(() => { refreshRoomsRef.current = refreshRooms; }, [refreshRooms]);

  // Socket event listeners — registered once per WS connection
  useEffect(() => {
    if (!isConnected) return;

    const unsubRoomCreated = subscribe('room_created', () => {
      refreshRoomsRef.current();
    });

    const unsubBookingAccepted = subscribe('booking_accepted', () => {
      refreshRoomsRef.current();
    });

    const unsubBookingCancelled = subscribe('booking_cancelled', () => {
      refreshRoomsRef.current();
    });

    const unsubReceived = subscribe('message_received', (evt) => {
      const msg = evt.payload as ChatMessage & { client_temp_id?: string };
      if (!msg || !msg.chat_room_id) return;

      const roomId = msg.chat_room_id;
      setMessagesMap((prev) => {
        const existing = prev[roomId] || [];

        // 1. If real message ID is already present, do nothing
        if (existing.some((m) => m.id === msg.id)) return prev;

        // 2. Reconcile with optimistic message (by client_temp_id, temp_id, or matching content + sender)
        const tempIdx = existing.findIndex((m) => {
          if (m.id.startsWith('temp-') || m.temp_id || m.status === 'sending') {
            if (msg.client_temp_id && (m.id === msg.client_temp_id || m.temp_id === msg.client_temp_id)) {
              return true;
            }
            if (m.content === msg.content && (m.sender_id === msg.sender_id || m.sender_name === msg.sender_name)) {
              return true;
            }
          }
          return false;
        });

        if (tempIdx !== -1) {
          const updated = [...existing];
          updated[tempIdx] = { ...msg, status: 'sent' };
          return { ...prev, [roomId]: updated };
        }

        // 3. Otherwise append new incoming message
        return { ...prev, [roomId]: [...existing, { ...msg, status: 'sent' }] };
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
      const roomId = evt.room_id?.replace('chat:', '') || activeRoomIdRef.current;
      if (!roomId || !payload.user_id) return;

      const currentUser = userRef.current;
      const isSelfTyping = Boolean(
        (currentUser?.id && payload.user_id === currentUser.id) ||
        (currentUser?.mobileNumber && payload.user_id === currentUser.mobileNumber) ||
        (currentUser?.name && payload.user_name === currentUser.name)
      );

      if (isSelfTyping) return;

      setTypingMap((prev) => {
        const current = prev[roomId] || [];
        if (current.some((u) => u.user_id === payload.user_id)) return prev;
        return { ...prev, [roomId]: [...current, { user_id: payload.user_id, user_name: payload.user_name }] };
      });
    });

    const unsubTypingStop = subscribe('typing_stop', (evt) => {
      const payload = evt.payload as { user_id: string; user_name?: string };
      const roomId = evt.room_id?.replace('chat:', '') || activeRoomIdRef.current;
      if (!roomId || !payload.user_id) return;

      const currentUser = userRef.current;
      const isSelfTyping = Boolean(
        (currentUser?.id && payload.user_id === currentUser.id) ||
        (currentUser?.mobileNumber && payload.user_id === currentUser.mobileNumber) ||
        (currentUser?.name && (payload.user_name === currentUser.name || !payload.user_name))
      );

      if (isSelfTyping) return;

      setTypingMap((prev) => {
        const current = prev[roomId] || [];
        return { ...prev, [roomId]: current.filter((u) => u.user_id !== payload.user_id) };
      });
    });

    return () => {
      unsubRoomCreated();
      unsubBookingAccepted();
      unsubBookingCancelled();
      unsubReceived();
      unsubEdit();
      unsubDelete();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [isConnected, subscribe]);

  const selectRoom = useCallback((roomId: string | null) => {
    setActiveRoomId(roomId);
    setReplyingTo(null);
  }, []);

  const sendMessage = useCallback(async (content: string, replyToId?: string): Promise<boolean> => {
    if (!activeRoomId || !content.trim()) return false;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const currentUser = userRef.current;

    const optimisticMsg: ChatMessage = {
      id: tempId,
      temp_id: tempId,
      client_temp_id: tempId,
      chat_room_id: activeRoomId,
      sender_id: currentUser?.id || currentUser?.mobileNumber || '',
      sender_name: currentUser?.name || 'Me',
      message_type: 'TEXT',
      content: content.trim(),
      reply_to_message_id: replyToId,
      reply_to: replyingTo ? { id: replyingTo.id, sender_name: replyingTo.sender_name, content: replyingTo.content } : undefined,
      is_edited: false,
      is_deleted: false,
      read_count: 0,
      read_by_me: true,
      created_at: new Date().toISOString(),
      status: 'sending',
    };

    // 1. Immediately append optimistic message to local state
    setMessagesMap((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), optimisticMsg],
    }));
    setReplyingTo(null);

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;

    // 2. Attempt WebSocket send
    const sent = sendEvent({
      event_type: 'message_send',
      room_id: chatChannel,
      payload: {
        content: content.trim(),
        reply_to_message_id: replyToId,
        client_temp_id: tempId,
      },
    });

    if (sent) {
      return true;
    }

    // 3. Fallback to REST API if WS not connected
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/chat/rooms/${activeRoomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: content.trim(),
          reply_to_message_id: replyToId,
          client_temp_id: tempId,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const serverMsg = json.data as ChatMessage;
        setMessagesMap((prev) => {
          const list = prev[activeRoomId] || [];
          const idx = list.findIndex((m) => m.id === tempId || m.temp_id === tempId);
          if (idx !== -1) {
            const updated = [...list];
            updated[idx] = { ...serverMsg, status: 'sent', temp_id: tempId };
            return { ...prev, [activeRoomId]: updated };
          }
          if (list.some((m) => m.id === serverMsg.id)) return prev;
          return { ...prev, [activeRoomId]: [...list, { ...serverMsg, status: 'sent' }] };
        });
        return true;
      }
    } catch (err) {
      console.warn('[ChatContext] REST send message fallback error:', err);
    }

    // 4. Mark optimistic message as failed if both WS and REST send failed
    setMessagesMap((prev) => {
      const list = prev[activeRoomId] || [];
      const idx = list.findIndex((m) => m.id === tempId || m.temp_id === tempId);
      if (idx !== -1) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], status: 'failed' };
        return { ...prev, [activeRoomId]: updated };
      }
      return prev;
    });

    return false;
  }, [activeRoomId, sendEvent, replyingTo]);

  const editMessage = useCallback(async (messageId: string, newContent: string): Promise<boolean> => {
    if (!activeRoomId || !newContent.trim()) return false;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    const sent = sendEvent({
      event_type: 'message_edit',
      room_id: chatChannel,
      payload: { message_id: messageId, content: newContent.trim() },
    });

    if (sent) return true;

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/chat/rooms/${activeRoomId}/messages/${messageId}`, {
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
  }, [activeRoomId, sendEvent]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    if (!activeRoomId) return false;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    const sent = sendEvent({
      event_type: 'message_delete',
      room_id: chatChannel,
      payload: { message_id: messageId },
    });

    if (sent) return true;

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_V1_URL}/chat/rooms/${activeRoomId}/messages/${messageId}`, {
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
  }, [activeRoomId, sendEvent]);

  const markAsRead = useCallback((messageIds: string[]) => {
    if (!activeRoomId || messageIds.length === 0) return;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    sendEvent({
      event_type: 'message_read',
      room_id: chatChannel,
      payload: { message_ids: messageIds },
    });

    // REST fallback
    const token = getAuthToken();
    fetch(`${API_V1_URL}/chat/rooms/${activeRoomId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message_ids: messageIds }),
    }).catch(() => {});
  }, [activeRoomId, sendEvent]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!activeRoomId) return;

    const chatChannel = activeRoomId.startsWith('chat:') ? activeRoomId : `chat:${activeRoomId}`;
    sendEvent({
      event_type: isTyping ? 'typing_start' : 'typing_stop',
      room_id: chatChannel,
      payload: {},
    });

    if (isTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
      }, 3000);
    }
  }, [activeRoomId, sendEvent]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;
  const currentMessages = activeRoomId ? messagesMap[activeRoomId] || [] : [];
  const currentTypingUsers = activeRoomId ? typingMap[activeRoomId] || [] : [];
  const totalUnreadCount = rooms.reduce((acc, r) => acc + (r.unread_count || 0), 0);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoom,
        messages: currentMessages,
        typingUsers: currentTypingUsers,
        isLoading,
        replyingTo,
        totalUnreadCount,
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
