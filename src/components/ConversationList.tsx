import React, { useState } from 'react';
import type { Conversa } from '@/types/chat';

interface ConversationListProps {
  conversas: Conversa[];
  selectedIds: string[];
  onSelectConversa: (conversaId: string) => void;
  searchQuery?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-gray-400';
    default:
      return 'bg-gray-300';
  }
};

export const ConversationList: React.FC<ConversationListProps> = ({
  conversas,
  selectedIds,
  onSelectConversa,
  searchQuery = '',
}) => {
  const [searchLocal, setSearchLocal] = useState(searchQuery);

  // Filtrar e ordenar conversas
  const filteredConversas = conversas
    .filter((conv) =>
      conv.name.toLowerCase().includes(searchLocal.toLowerCase())
    )
    .sort((a, b) => {
      // Fixadas primeiro
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      // Depois por data da última mensagem
      const aTime = a.lastMessageAt?.getTime() || 0;
      const bTime = b.lastMessageAt?.getTime() || 0;
      return bTime - aTime;
    });

  return (
    <div className="w-full h-full flex flex-col bg-white border-r-2 border-linen-300">
      {/* Header */}
      <div className="p-4 border-b border-linen-200 flex-shrink-0">
        <h2 className="font-embroidery text-lg text-embroidery-black mb-3">
          Mensagens
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar conversa..."
          value={searchLocal}
          onChange={(e) => setSearchLocal(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-linen-300 bg-linen-50 font-body text-embroidery-black placeholder-embroidery-gray focus:outline-none focus:border-terracotta-400"
        />
      </div>

      {/* Conversas List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversas.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredConversas.map((conversa) => {
              const isSelected = selectedIds.includes(conversa.id);
              const lastUser = conversa.lastMessage?.userName;
              const isLastFromYou =
                conversa.lastMessage?.userId === 'user-current';

              return (
                <button
                  key={conversa.id}
                  onClick={() => onSelectConversa(conversa.id)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all duration-200
                    relative group
                    ${
                      isSelected
                        ? 'bg-terracotta-100 border border-terracotta-300'
                        : 'bg-white hover:bg-linen-50 border border-transparent'
                    }
                  `}
                  type="button"
                >
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
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

                      {/* Status Dot */}
                      {conversa.type === 'individual' &&
                        conversa.participants[1] && (
                          <div
                            className={`
                              absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                              ${getStatusColor(conversa.participants[1].status)}
                            `}
                          />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-embroidery text-sm text-embroidery-black truncate">
                          {conversa.name}
                          {conversa.isPinned && ' 📌'}
                        </h3>
                        {conversa.lastMessageAt && (
                          <span className="text-xs text-embroidery-gray flex-shrink-0">
                            {new Date(conversa.lastMessageAt).toLocaleTimeString(
                              'pt-BR',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        )}
                      </div>

                      {/* Last Message Preview */}
                      {conversa.lastMessage ? (
                        <p className="text-xs text-embroidery-gray truncate">
                          <span className="font-embroidery">
                            {isLastFromYou ? 'Você: ' : `${lastUser?.split(' ')[0]}: `}
                          </span>
                          {conversa.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-embroidery-gray italic">
                          Nenhuma mensagem ainda
                        </p>
                      )}
                    </div>

                    {/* Unread Badge */}
                    {conversa.unreadCount > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {conversa.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 text-center">
            <div>
              <p className="text-2xl mb-2">💬</p>
              <p className="font-body text-sm text-embroidery-gray">
                Nenhuma conversa encontrada
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-linen-200 flex-shrink-0 space-y-2">
        <button
          className="embroidery-button embroidery-thread-black w-full bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-4 py-2 text-sm rounded-lg font-embroidery"
          type="button"
        >
          ✉️ Nova Conversa
        </button>
      </div>
    </div>
  );
};
