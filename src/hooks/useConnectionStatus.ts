import { useWebSocketContext } from '../contexts/WebSocketContext';

export const useConnectionStatus = () => {
  const { status, isConnected, activeRooms } = useWebSocketContext();
  return { status, isConnected, activeRooms };
};
