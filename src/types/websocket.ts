export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export type WSEventType =
  | 'connect'
  | 'disconnect'
  | 'heartbeat'
  | 'join_room'
  | 'leave_room'
  | 'ride_update'
  | 'chat_placeholder'
  | 'notification_placeholder'
  | 'error'
  | 'ack';

export interface WSSender {
  user_id: string;
  role: string;
}

export interface WSEvent<T = Record<string, any>> {
  event_id?: string;
  event_type: WSEventType | string;
  timestamp?: string;
  payload: T;
  sender?: WSSender;
  room_id?: string;
}

export interface WSStats {
  active_connections: number;
  connected_drivers: number;
  connected_passengers: number;
  room_count: number;
  redis_connected: boolean;
  reconnect_count: number;
}
