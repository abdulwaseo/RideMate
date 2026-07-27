import type { ConnectionStatus, WSEvent, WSEventType } from '../../types/websocket';
import { WS_BASE_URL } from '../../config/api';

type MessageCallback = (event: WSEvent) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export class SocketClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'DISCONNECTED';
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private statusListeners: Set<StatusCallback> = new Set();
  private subscribedRooms: Set<string> = new Set();

  constructor() {
    // Singleton client instance
  }

  public connect(token: string): void {
    if (this.ws && (this.status === 'CONNECTED' || this.status === 'CONNECTING')) {
      return;
    }

    this.token = token;
    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    const baseUrl = WS_BASE_URL.endsWith('/') ? WS_BASE_URL.slice(0, -1) : WS_BASE_URL;
    const wsUrl = `${baseUrl}/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.startHeartbeat();
        this.resubscribeRooms();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          this.handleIncomingEvent(parsed);
        } catch (e) {
          console.warn('[SocketClient] Received non-JSON frame:', event.data);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.status !== 'DISCONNECTED') {
          this.handleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[SocketClient] WebSocket error:', error);
      };
    } catch (err) {
      console.error('[SocketClient] Failed to establish WebSocket connection:', err);
      this.handleReconnect();
    }
  }

  public disconnect(): void {
    this.setStatus('DISCONNECTED');
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
  }

  public send(event: WSEvent): boolean {
    if (this.ws && this.status === 'CONNECTED') {
      this.ws.send(JSON.stringify(event));
      return true;
    }
    return false;
  }

  public joinRoom(roomId: string): void {
    this.subscribedRooms.add(roomId);
    this.send({
      event_type: 'join_room',
      room_id: roomId,
      payload: { room_id: roomId },
    });
  }

  public leaveRoom(roomId: string): void {
    this.subscribedRooms.delete(roomId);
    this.send({
      event_type: 'leave_room',
      room_id: roomId,
      payload: { room_id: roomId },
    });
  }

  public on(eventType: WSEventType | string, callback: MessageCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    return () => this.off(eventType, callback);
  }

  public off(eventType: WSEventType | string, callback: MessageCallback): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getSubscribedRooms(): string[] {
    return Array.from(this.subscribedRooms);
  }

  private setStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((cb) => cb(newStatus));
  }

  private handleIncomingEvent(event: WSEvent): void {
    const callbacks = this.listeners.get(event.event_type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }
    // Universal wildcard listener
    const globalCallbacks = this.listeners.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach((cb) => cb(event));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({
        event_type: 'heartbeat',
        payload: { type: 'ping' },
      });
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleReconnect(): void {
    if (!this.token || this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('DISCONNECTED');
      return;
    }

    this.reconnectAttempts++;
    this.setStatus('RECONNECTING');

    const backoffMs = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, backoffMs);
  }

  private resubscribeRooms(): void {
    this.subscribedRooms.forEach((roomId) => {
      this.send({
        event_type: 'join_room',
        room_id: roomId,
        payload: { room_id: roomId },
      });
    });
  }
}

export const socketClient = new SocketClient();
