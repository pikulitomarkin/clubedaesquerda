import { useState, useCallback, useEffect } from 'react';
import type { Conversa, Mensagem, Usuario, SendMessageData } from '@/types/chat';

const STORAGE_KEY = 'club_esquerda_messages';
const MAX_OPEN_CONVERSAS = 2;

export const useChat = (conversas: Conversa[], currentUser: Usuario) => {
  const [selectedConversas, setSelectedConversas] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, Mensagem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Carregar mensagens do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Converter timestamps de volta para Date
        const restored = Object.entries(parsed).reduce(
          (acc, [conversaId, msgs]: [string, any]) => {
            acc[conversaId] = msgs.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
            return acc;
          },
          {} as Record<string, Mensagem[]>
        );
        setMessages(restored);
      } catch (err) {
        console.error('Erro ao carregar mensagens:', err);
      }
    }
  }, []);

  // Persistir mensagens no localStorage
  const saveToStorage = useCallback((msgs: Record<string, Mensagem[]>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, []);

  // Abrir conversa
  const openConversa = useCallback((conversaId: string) => {
    setSelectedConversas((prev) => {
      if (prev.includes(conversaId)) {
        return prev;
      }

      if (prev.length >= MAX_OPEN_CONVERSAS) {
        // Remover a primeira e adicionar a nova
        return [...prev.slice(1), conversaId];
      }

      return [...prev, conversaId];
    });
  }, []);

  // Fechar conversa
  const closeConversa = useCallback((conversaId: string) => {
    setSelectedConversas((prev) => prev.filter((id) => id !== conversaId));
  }, []);

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(
    async (conversaId: string) => {
      // Se já temos mensagens em cache, não carregar novamente
      if (messages[conversaId]) {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Simular delay de API
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Simular mensagens do histórico
        const simulatedMessages: Mensagem[] = [
          {
            id: 'msg-load-1',
            conversaId,
            userId: 'user-1',
            userName: 'Marina Silva',
            userAvatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
            content: 'Oi! Tudo bem?',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            isRead: true,
          },
          {
            id: 'msg-load-2',
            conversaId,
            userId: 'user-current',
            userName: 'Você',
            content: 'Tudo certo! E contigo?',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            isRead: true,
          },
          {
            id: 'msg-load-3',
            conversaId,
            userId: 'user-1',
            userName: 'Marina Silva',
            userAvatar:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop',
            content: 'Bom, estou preparando material para próxima roda',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            isRead: true,
          },
        ];

        setMessages((prev) => ({
          ...prev,
          [conversaId]: simulatedMessages,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao carregar mensagens';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  // Enviar mensagem
  const sendMessage = useCallback(
    async ({ conversaId, content }: SendMessageData) => {
      if (!content.trim()) return;

      setError('');

      const newMessage: Mensagem = {
        id: `msg-${Date.now()}`,
        conversaId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        content: content.trim(),
        timestamp: new Date(),
        isRead: true,
      };

      try {
        // Atualizar estado localmente
        setMessages((prev) => {
          const updated = {
            ...prev,
            [conversaId]: [...(prev[conversaId] || []), newMessage],
          };
          saveToStorage(updated);
          return updated;
        });

        // Simular envio para API
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Aqui você faria POST /api/messages
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao enviar mensagem';
        setError(errorMessage);
        throw err;
      }
    },
    [currentUser, saveToStorage]
  );

  // Marcar conversa como lida
  const markAsRead = useCallback((conversaId: string) => {
    setMessages((prev) => {
      const updated = { ...prev };
      if (updated[conversaId]) {
        updated[conversaId] = updated[conversaId].map((msg) => ({
          ...msg,
          isRead: true,
        }));
        saveToStorage(updated);
      }
      return updated;
    });
  }, [saveToStorage]);

  // Buscar conversas
  const searchConversas = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return conversas.filter((conv) =>
        conv.name.toLowerCase().includes(lowerQuery)
      );
    },
    [conversas]
  );

  return {
    selectedConversas,
    messages,
    isLoading,
    error,
    openConversa,
    closeConversa,
    loadMessages,
    sendMessage,
    markAsRead,
    searchConversas,
  };
};
