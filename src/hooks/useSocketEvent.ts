import { useEffect } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import type { WSEvent } from '../types/websocket';

export const useSocketEvent = <T = Record<string, any>>(
  eventType: string,
  callback: (event: WSEvent<T>) => void
) => {
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, callback as any);
    return () => {
      unsubscribe();
    };
  }, [eventType, callback, subscribe]);
};
