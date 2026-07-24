import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ConnectionStatus, WSEvent } from '../types/websocket';
import { socketClient } from '../services/websocket/socketClient';
import { useAuth } from '../hooks/useAuth';

interface WebSocketContextType {
  status: ConnectionStatus;
  isConnected: boolean;
  activeRooms: string[];
  sendEvent: (event: WSEvent) => boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  subscribe: (eventType: string, callback: (event: WSEvent) => void) => () => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>(socketClient.getStatus());
  const [activeRooms, setActiveRooms] = useState<string[]>(socketClient.getSubscribedRooms());

  useEffect(() => {
    const unsubStatus = socketClient.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setActiveRooms(socketClient.getSubscribedRooms());
    });
    return unsubStatus;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const authToken =
        localStorage.getItem('ridemate_access_token') ||
        localStorage.getItem('access_token');
      if (authToken) {
        socketClient.connect(authToken);
      } else {
        socketClient.disconnect();
      }
    } else {
      socketClient.disconnect();
    }
  }, [isAuthenticated]);

  const sendEvent = (event: WSEvent): boolean => {
    return socketClient.send(event);
  };

  const joinRoom = (roomId: string): void => {
    socketClient.joinRoom(roomId);
    setActiveRooms(socketClient.getSubscribedRooms());
  };

  const leaveRoom = (roomId: string): void => {
    socketClient.leaveRoom(roomId);
    setActiveRooms(socketClient.getSubscribedRooms());
  };

  const subscribe = (eventType: string, callback: (event: WSEvent) => void): (() => void) => {
    return socketClient.on(eventType, callback);
  };

  const reconnect = (): void => {
    if (!isAuthenticated) return;
    const authToken =
      localStorage.getItem('ridemate_access_token') ||
      localStorage.getItem('access_token');
    if (authToken) {
      socketClient.connect(authToken);
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        status,
        isConnected: status === 'CONNECTED',
        activeRooms,
        sendEvent,
        joinRoom,
        leaveRoom,
        subscribe,
        reconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a SocketProvider');
  }
  return context;
};
