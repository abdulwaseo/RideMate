import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatContext } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ChatEmptyState } from '../../components/chat/ChatEmptyState';

/**
 * ChatList — Full chat application layout with sidebar + active chat window.
 * Integrated with real-time WebSocket via ChatContext.
 */
export const ChatList: React.FC = () => {
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  const {
    rooms,
    activeRoom,
    messages,
    typingUsers,
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
  } = useChatContext();

  // Sync URL param → active room
  useEffect(() => {
    if (roomId) {
      selectRoom(roomId);
    } else {
      selectRoom(null);
    }
  }, [roomId, selectRoom]);

  // Refresh rooms on mount
  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const handleSelectRoom = (id: string) => {
    selectRoom(id);
    const rolePath = user?.role === 'driver' ? 'driver' : 'passenger';
    navigate(`/dashboard/${rolePath}/chat/${id}`);
  };

  return (
    <div className="h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-4rem)] flex overflow-hidden rounded-2xl border border-slate-200 shadow-2xl bg-brand-surface">
      {/* Sidebar — always visible on desktop, hidden on mobile when room is selected */}
      <div className={`w-full sm:w-80 flex-shrink-0 ${activeRoom ? 'hidden sm:flex' : 'flex'} flex-col`}>
        <ChatSidebar
          rooms={rooms}
          activeRoomId={activeRoom?.id}
          onSelectRoom={handleSelectRoom}
          isLoading={isLoading}
        />
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 min-w-0">
        {activeRoom ? (
          <ChatWindow
            room={activeRoom}
            messages={messages}
            typingUsers={typingUsers}
            replyingTo={replyingTo}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            onMarkRead={markAsRead}
            onSetReplyTo={setReplyingTo}
            onTyping={sendTyping}
          />
        ) : (
          <ChatEmptyState variant="no-room" />
        )}
      </div>
    </div>
  );
};
