import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRide } from './RideContext';

export interface Participant {
  id: string; // mobileNumber
  name: string;
  avatar?: string;
  role: 'driver' | 'passenger';
}

export type ChatMessageType = 'Text' | 'System' | 'Update';

export interface ChatMessage {
  id: string;
  senderId?: string; // empty for system messages
  senderName?: string;
  senderRole?: 'driver' | 'passenger';
  text: string;
  timestamp: string;
  type: ChatMessageType;
}

export interface ChatRoom {
  id: string; // rideId
  pickupArea: string;
  destination: string;
  date: string;
  time: string;
  rideStatus: 'Upcoming' | 'Active' | 'Full' | 'Completed' | 'Cancelled';
  driver: Participant;
  participants: Participant[];
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
  lastActivity: string;
}

export type NotificationCategory = 'Ride' | 'Booking' | 'System' | 'Chat' | 'General';

export interface Notification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface CommunicationContextType {
  rooms: ChatRoom[];
  notifications: Notification[];
  unreadCount: number;
  sendMessage: (roomId: string, text: string) => Promise<boolean>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addNotification: (category: NotificationCategory, title: string, description: string, actionUrl?: string) => void;
}

const CommunicationContext = createContext<CommunicationContextType | undefined>(undefined);

export const CommunicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { bookingRequests } = useRide();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Track processed booking request states to avoid duplicate notifications
  const processedRequestsRef = useRef<Set<string>>(new Set());

  // Fetch notifications directly from backend API
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/api/v1/notifications', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const items = json.data || [];
          const mapped: Notification[] = items.map((n: any) => ({
            id: n.id,
            category: n.type || 'General',
            title: n.title,
            description: n.body || n.description,
            timestamp: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: n.is_read || false,
            actionUrl: n.action_url,
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.warn('[CommunicationContext] Error fetching notifications:', err);
      }
    };
    fetchNotifications();
  }, [user]);

  const saveNotifications = (updated: Notification[]) => {
    setNotifications(updated);
  };

  // Helper to append a notification
  const addNotification = (
    category: NotificationCategory,
    title: string,
    description: string,
    actionUrl?: string
  ) => {
    const newNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      category,
      title,
      description,
      timestamp: 'Just now',
      isRead: false,
      actionUrl,
    };
    saveNotifications([newNotif, ...notifications]);
  };

  // 1. Reactive Syncing of Chat Rooms from Backend API
  useEffect(() => {
    const fetchBackendRooms = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem('ridemate_access_token') || localStorage.getItem('access_token');
        const res = await fetch('/api/v1/chat/rooms', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          const backendRooms = (json.data || []).map((r: any) => ({
            id: r.id,
            pickupArea: r.ride_id || 'Commute Route',
            destination: 'Dilkusha Towers',
            date: new Date().toISOString().split('T')[0],
            time: '08:30 AM',
            rideStatus: r.is_active ? 'Upcoming' : 'Completed',
            driver: r.participants.find((p: any) => p.role === 'Driver') || { id: r.created_by, name: 'Driver', role: 'driver' },
            participants: r.participants || [],
            messages: [],
            unreadCount: r.unread_count || 0,
            lastMessage: r.last_message ? { id: r.last_message.id, text: r.last_message.content, timestamp: r.last_message.created_at, type: 'Text' } : null,
            lastActivity: 'Just now',
          }));
          setRooms(backendRooms);
        }
      } catch (err) {
        console.warn('[CommunicationContext] Error syncing chat rooms:', err);
      }
    };

    fetchBackendRooms();
  }, [user]);

  // 2. Single-Trigger Reactive Notification State Machine
  useEffect(() => {
    bookingRequests.forEach((req) => {
      const trackingKey = `${req.id}-${req.status}`;
      
      // If we haven't processed this request state yet
      if (!processedRequestsRef.current.has(trackingKey)) {
        processedRequestsRef.current.add(trackingKey);
        
        // Suppress initial notifications on first mount (ignore old prehydrated lists)
        const isInitialMount = processedRequestsRef.current.size < 3;
        
        if (!isInitialMount) {
          // A: New request submitted -> notify Driver
          if (req.status === 'Pending') {
            // If current user is the driver for this request
            if (user && user.mobileNumber === req.ride.driverId) {
              addNotification(
                'Booking',
                'Ride Request Received',
                `${req.passengerName} has requested a seat on your ride from ${req.ride.pickupArea}.`,
                '/dashboard/driver/requests'
              );
            }
          }
          // B: Request Accepted -> notify Passenger
          else if (req.status === 'Accepted') {
            if (user && user.mobileNumber === req.passengerId) {
              addNotification(
                'Ride',
                'Carpool Request Approved',
                `Your seat request for ride from ${req.ride.pickupArea} has been approved by ${req.ride.driver.name}!`,
                '/dashboard/passenger/requests'
              );
            }
          }
          // C: Request Rejected -> notify Passenger
          else if (req.status === 'Rejected') {
            if (user && user.mobileNumber === req.passengerId) {
              addNotification(
                'Ride',
                'Request Declined',
                `Your seat request for ride from ${req.ride.pickupArea} was declined by ${req.ride.driver.name}.`,
                '/dashboard/passenger/requests'
              );
            }
          }
          // D: Request Cancelled -> notify Driver if accepted before
          else if (req.status === 'Cancelled') {
            if (user && user.mobileNumber === req.ride.driverId) {
              addNotification(
                'Booking',
                'Booking Cancelled',
                `${req.passengerName} has cancelled their booking for your ride from ${req.ride.pickupArea}.`,
                '/dashboard/driver/requests'
              );
            }
          }
        }
      }
    });
  }, [bookingRequests, user]);

  const sendMessage = async (roomId: string, text: string): Promise<boolean> => {
    if (!user) return false;
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newMessage: ChatMessage = {
      id: `msg-${Math.random().toString(36).substr(2, 9)}`,
      senderId: user.mobileNumber,
      senderName: user.name,
      senderRole: user.role as 'driver' | 'passenger',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'Text',
    };

    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === roomId) {
          // Increment unread count for other participants (simulated)
          return {
            ...room,
            messages: [...room.messages, newMessage],
            lastMessage: newMessage,
            lastActivity: 'Just now',
          };
        }
        return room;
      })
    );

    // Trigger notification to other room participants (mock)
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      const recipient = room.participants.find((p) => p.id !== user.mobileNumber);
      if (recipient && user.mobileNumber !== recipient.id) {
        // mock incoming msg alert
      }
    }

    return true;
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    saveNotifications(updated);
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <CommunicationContext.Provider
      value={{
        rooms,
        notifications,
        unreadCount,
        sendMessage,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
};

export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
