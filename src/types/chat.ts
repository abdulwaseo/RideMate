export type MessageType = 'TEXT' | 'SYSTEM' | 'RIDE_UPDATE' | 'IMAGE' | 'FILE' | 'LOCATION';

export interface UserParticipant {
  id: string;
  name: string;
  role: string;
}

export interface ReplyMessageBrief {
  id: string;
  sender_name?: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id?: string;
  sender_name?: string;
  message_type: MessageType;
  content: string;
  reply_to_message_id?: string;
  reply_to?: ReplyMessageBrief;
  is_edited?: boolean;
  edited_at?: string;
  is_deleted?: boolean;
  read_count?: number;
  read_by_me?: boolean;
  created_at: string;
  status?: 'sending' | 'sent' | 'failed';
  temp_id?: string;
  client_temp_id?: string;
}

export interface ChatRoom {
  id: string;
  ride_id: string;
  created_by: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  participants: UserParticipant[];
  unread_count?: number;
  last_message?: ChatMessage;
}

export interface TypingUser {
  user_id: string;
  user_name: string;
}
