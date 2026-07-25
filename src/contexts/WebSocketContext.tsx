import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ConnectionStatus, WSEvent } from '../types/websocket';
import { socketClient } from '../services/websocket/socketClient';
import { useAuth } from '../hooks/useAuth';
import { getAuthToken } from '../utils/token';

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
      const authToken = getAuthToken();
      if (authToken) {
        socketClient.connect(authToken);
      } else {
        socketClient.disconnect();
      }
    } else {
      socketClient.disconnect();
    }
  }, [isAuthenticated]);

  const sendEvent = useCallback((event: WSEvent): boolean => {
    return socketClient.send(event);
  }, []);

  const joinRoom = useCallback((roomId: string): void => {
    socketClient.joinRoom(roomId);
    setActiveRooms(socketClient.getSubscribedRooms());
  }, []);

  const leaveRoom = useCallback((roomId: string): void => {
    socketClient.leaveRoom(roomId);
    setActiveRooms(socketClient.getSubscribedRooms());
  }, []);

  const subscribe = useCallback((eventType: string, callback: (event: WSEvent) => void): (() => void) => {
    return socketClient.on(eventType, callback);
  }, []);

  const reconnect = useCallback((): void => {
    if (!isAuthenticated) return;
    const authToken = getAuthToken();
    if (authToken) {
      socketClient.connect(authToken);
    }
  }, [isAuthenticated]);

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
