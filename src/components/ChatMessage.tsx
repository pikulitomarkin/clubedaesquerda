import React from 'react';
import type { Mensagem } from '@/types/chat';

interface ChatMessageProps {
  message: Mensagem;
  isOwn: boolean;
  showAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isOwn,
  showAvatar = true,
}) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`
        flex gap-3 mb-4 items-end
        ${isOwn ? 'flex-row-reverse' : 'flex-row'}
      `}
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.userAvatar ? (
            <img
              src={message.userAvatar}
              alt={message.userName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linen-200 flex items-center justify-center text-xs">
              👤
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Name (if not own) */}
        {!isOwn && (
          <p className="text-xs font-embroidery text-embroidery-gray px-3">
            {message.userName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={`
            px-4 py-2 rounded-2xl break-words
            ${
              isOwn
                ? 'bg-terracotta-500 text-white rounded-br-none shadow-embroidery'
                : 'bg-linen-100 text-embroidery-black rounded-bl-none shadow-embroidery'
            }
          `}
        >
          <p className="font-body text-sm whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Edited indicator */}
          {message.edited && (
            <p className="text-xs opacity-70 mt-1">
              {isOwn ? '(editado)' : '(editado)'}
            </p>
          )}
        </div>

        {/* Time */}
        <p className="text-xs text-embroidery-gray px-3">
          {formatTime(message.timestamp)}
          {isOwn && message.isRead && ' ✓✓'}
        </p>
      </div>
    </div>
  );
};
