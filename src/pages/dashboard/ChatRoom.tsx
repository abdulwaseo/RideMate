import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../../contexts/ChatContext';
import { useAuth } from '../../hooks/useAuth';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ChatEmptyState } from '../../components/chat/ChatEmptyState';
import { ChevronLeft } from 'lucide-react';

/**
 * ChatRoom — Standalone route used for mobile deep-link navigation to a specific room.
 * On desktop, ChatList handles the full split layout.
 */
export const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    activeRoom,
    messages,
    typingUsers,
    replyingTo,
    setReplyingTo,
    selectRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    sendTyping,
  } = useChatContext();

  useEffect(() => {
    if (id) {
      selectRoom(id);
    }
  }, [id, selectRoom]);

  const handleBack = () => {
    const rolePath = user?.role === 'driver' ? 'driver' : 'passenger';
    navigate(`/dashboard/${rolePath}/chat`);
  };

  if (!activeRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-3 border-b border-slate-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Messages
        </button>
        <div className="flex-1 flex items-center justify-center">
          <ChatEmptyState
            variant="expired"
            title="Chat Room Not Found"
            description="The chat room may have expired or you don't have access."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Mobile back button */}
      <button
        onClick={handleBack}
        className="sm:hidden flex items-center gap-2 text-sm text-slate-400 hover:text-white px-4 py-2 bg-slate-900 border-b border-slate-800 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        All Chats
      </button>

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
    </div>
  );
};
