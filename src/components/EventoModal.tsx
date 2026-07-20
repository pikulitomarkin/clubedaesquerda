import React from 'react';
import { EventoFormPresencial } from './EventoFormPresencial';
import { EventoFormOnline } from './EventoFormOnline';
import { EventoFormClube } from './EventoFormClube';
import { EventoFormAnalise } from './EventoFormAnalise';
import type { TipoEvento } from '@/types/eventos';

interface EventoModalProps {
  tipo: TipoEvento;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

const getTipoInfo = (tipo: TipoEvento) => {
  const info: Record<TipoEvento, { titulo: string; descricao: string; icone: string }> = {
    presencial: {
      titulo: 'Evento Presencial',
      descricao: 'Manifestação, ação ou encontro presencial',
      icone: '📍',
    },
    online: {
      titulo: 'Evento Online',
      descricao: 'Live, webinar ou reunião virtual',
      icone: '💻',
    },
    clube: {
      titulo: 'Roda de Conversa',
      descricao: 'Espaço de diálogo e troca comunitária',
      icone: '💬',
    },
    analise: {
      titulo: 'Análise Política',
      descricao: 'Círculo de estudos e análise coletiva',
      icone: '📚',
    },
  };
  return info[tipo];
};

export const EventoModal: React.FC<EventoModalProps> = ({
  tipo,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const info = getTipoInfo(tipo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-embroidery-3d max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white p-6 flex justify-between items-start">
          <div>
            <h2 className="font-heading text-2xl mb-1">
              {info.icone} {info.titulo}
            </h2>
            <p className="text-sm opacity-90">{info.descricao}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            type="button"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          {tipo === 'presencial' && (
            <EventoFormPresencial
              onSubmit={onSubmit}
              isLoading={isLoading}
              onCancel={onClose}
            />
          )}
          {tipo === 'online' && (
            <EventoFormOnline
              onSubmit={onSubmit}
              isLoading={isLoading}
              onCancel={onClose}
            />
          )}
          {tipo === 'clube' && (
            <EventoFormClube
              onSubmit={onSubmit}
              isLoading={isLoading}
              onCancel={onClose}
            />
          )}
          {tipo === 'analise' && (
            <EventoFormAnalise
              onSubmit={onSubmit}
              isLoading={isLoading}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
