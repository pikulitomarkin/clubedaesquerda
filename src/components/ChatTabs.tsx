import React from 'react';
import { ChatPanel } from './ChatPanel';
import type { Conversa, Mensagem } from '@/types/chat';

interface ChatTabsProps {
  conversas: Conversa[];
  selectedConversaIds: string[];
  messages: Record<string, Mensagem[]>;
  isLoading: boolean;
  onSendMessage: (conversaId: string, content: string) => Promise<void>;
  onCloseConversa: (conversaId: string) => void;
  currentUserId: string;
}

export const ChatTabs: React.FC<ChatTabsProps> = ({
  conversas,
  selectedConversaIds,
  messages,
  isLoading,
  onSendMessage,
  onCloseConversa,
  currentUserId,
}) => {
  if (selectedConversaIds.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-linen-50 rounded-lg">
        <div className="text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-heading text-2xl text-embroidery-black mb-2">
            Selecione uma conversa
          </p>
          <p className="font-body text-embroidery-gray">
            Clique em uma conversa à esquerda para começar
          </p>
        </div>
      </div>
    );
  }

  const selectedConversas = conversas.filter((c) =>
    selectedConversaIds.includes(c.id)
  );

  return (
    <div
      className={`
        grid gap-4 flex-1
        ${selectedConversaIds.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}
      `}
    >
      {selectedConversas.map((conversa) => (
        <ChatPanel
          key={conversa.id}
          conversa={conversa}
          messages={messages[conversa.id] || []}
          isLoading={isLoading}
          onSendMessage={(content) =>
            onSendMessage(conversa.id, content)
          }
          onClose={() => onCloseConversa(conversa.id)}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
};
