import React from 'react';

interface ChatEmptyStateProps {
  variant?: 'no-room' | 'no-messages' | 'expired';
  title?: string;
  description?: string;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  variant = 'no-room',
  title,
  description,
}) => {
  const config = {
    'no-room': {
      title: title || 'No Conversation Selected',
      description: description || 'Select a ride chat room from the sidebar to start messaging your co-commuters.',
      icon: '💬',
    },
    'no-messages': {
      title: title || 'Start the Conversation',
      description: description || 'Be the first one to say something! Use the message box below to get started.',
      icon: '🚗',
    },
    expired: {
      title: title || 'Chat Room Closed',
      description: description || 'This chat room has expired. Chat rooms are available 24 hours after ride completion.',
      icon: '⏰',
    },
  }[variant];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-3xl shadow-inner">
        {config.icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-100">{config.title}</h3>
        <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{config.description}</p>
      </div>
    </div>
  );
};
