import React, { useEffect } from 'react';
import { ConversationList } from '@/components/ConversationList';
import { ChatTabs } from '@/components/ChatTabs';
import { useChat } from '@/hooks/useChat';
import { CONVERSAS, USUARIOS } from '@/data/conversations';

export const ChatPage: React.FC = () => {
  const currentUser = USUARIOS['user-current'];
  const {
    selectedConversas,
    messages,
    isLoading,
    error,
    openConversa,
    closeConversa,
    sendMessage,
    loadMessages,
    markAsRead,
  } = useChat(CONVERSAS, currentUser);

  // Carregar mensagens quando uma conversa é aberta
  useEffect(() => {
    selectedConversas.forEach((conversaId) => {
      loadMessages(conversaId);
      markAsRead(conversaId);
    });
  }, [selectedConversas, loadMessages, markAsRead]);

  const handleSendMessage = async (conversaId: string, content: string) => {
    try {
      await sendMessage({ conversaId, content });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  return (
    <div className="min-h-screen bg-linen-texture flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white p-4 shadow-embroidery-3d">
        <h1 className="font-heading text-2xl">Mensagens Diretas</h1>
        <p className="text-sm opacity-90">
          Conecte-se com membros do Clube da Esquerda
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded-lg font-body text-sm">
          {error}
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Sidebar - Conversation List */}
        <div className="w-64 flex-shrink-0 rounded-lg overflow-hidden shadow-embroidery-3d">
          <ConversationList
            conversas={CONVERSAS}
            selectedIds={selectedConversas}
            onSelectConversa={openConversa}
          />
        </div>

        {/* Main Area - Chat Tabs */}
        <div className="flex-1 min-w-0">
          <ChatTabs
            conversas={CONVERSAS}
            selectedConversaIds={selectedConversas}
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onCloseConversa={closeConversa}
            currentUserId={currentUser.id}
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-linen-100 border-t border-linen-300 text-center font-body text-xs text-embroidery-gray">
        <p>
          💡 Dica: Você pode abrir até 2 conversas simultaneamente. Clique em uma conversa
          para fechar.
        </p>
      </div>
    </div>
  );
};
