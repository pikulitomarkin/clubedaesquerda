import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import type { Conversa, Mensagem } from '@/types/chat';

interface ChatPanelProps {
  conversa: Conversa;
  messages: Mensagem[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onClose?: () => void;
  currentUserId: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'online':
      return 'text-green-600';
    case 'away':
      return 'text-yellow-600';
    case 'offline':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusDot = (status?: string) => {
  switch (status) {
    case 'online':
      return '🟢';
    case 'away':
      return '🟡';
    case 'offline':
      return '⚪';
    default:
      return '⚪';
  }
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  conversa,
  messages,
  isLoading,
  onSendMessage,
  onClose,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages]);

  const otherUser = conversa.participants.find(
    (p) => p.id !== currentUserId
  );

  const isOnline = otherUser?.status === 'online';
  const lastSeen = otherUser?.lastSeen
    ? new Date(otherUser.lastSeen).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="flex flex-col h-full bg-white border border-linen-300 rounded-lg overflow-hidden shadow-embroidery">
      {/* Header */}
      <div className="p-4 border-b border-linen-300 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-linen-50 to-white">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {conversa.avatar ? (
            <img
              src={conversa.avatar}
              alt={conversa.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linen-200 flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
          )}

          {/* Info */}
          <div>
            <h3 className="font-embroidery text-sm text-embroidery-black">
              {conversa.name}
            </h3>
            {conversa.type === 'individual' ? (
              <p className={`text-xs font-body ${getStatusColor(otherUser?.status)}`}>
                {getStatusDot(otherUser?.status)}{' '}
                {isOnline ? 'Online' : `Visto às ${lastSeen}`}
              </p>
            ) : (
              <p className="text-xs text-embroidery-gray font-body">
                {conversa.participants.length} participantes
              </p>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-embroidery-gray hover:text-terracotta-600 text-xl font-bold"
            type="button"
            title="Fechar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl mb-2">💬</p>
              <p className="font-body text-sm text-embroidery-gray">
                Carregando mensagens...
              </p>
            </div>
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-2xl mb-2">👋</p>
              <p className="font-body text-sm text-embroidery-gray">
                Nenhuma mensagem ainda. Comece a conversa!
              </p>
            </div>
          </div>
        ) : (
          <>
            {sortedMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.userId === currentUserId}
                showAvatar={conversa.type === 'grupo'}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        placeholder="Digite sua mensagem..."
      />
    </div>
  );
};
