import React from 'react';
import type { Evento } from '@/types/public-profile';

interface EventosSectionProps {
  eventos: Evento[];
  onEventoClick?: (evento: Evento) => void;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  manifestacao: { label: 'Manifestação', icon: '🪧' },
  debate: { label: 'Debate', icon: '🗣️' },
  formacao: { label: 'Formação', icon: '🎓' },
  cultural: { label: 'Cultural', icon: '🎭' },
  social: { label: 'Social', icon: '🎉' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  agendado: { label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
  'em-andamento': { label: 'Em Andamento', color: 'bg-green-100 text-green-700' },
  finalizado: { label: 'Finalizado', color: 'bg-gray-100 text-gray-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export const EventosSection: React.FC<EventosSectionProps> = ({
  eventos,
  onEventoClick,
}) => {
  if (eventos.length === 0) {
    return null;
  }

  // Separar eventos por status
  const agenados = eventos.filter((e) => e.status === 'agendado');
  const emAndamento = eventos.filter((e) => e.status === 'em-andamento');
  const finalizados = eventos.filter((e) => e.status === 'finalizado');

  const renderEventos = (eventosToRender: Evento[], title: string) => {
    if (eventosToRender.length === 0) return null;

    return (
      <div key={title} className="mb-12">
        <h3 className="font-embroidery text-lg text-embroidery-black mb-4">
          {title} ({eventosToRender.length})
        </h3>
        <div className="space-y-3">
          {eventosToRender.map((evento) => {
            const category = categoryLabels[evento.category];
            const status = statusLabels[evento.status];
            const eventDate = new Date(evento.startDate);

            return (
              <button
                key={evento.id}
                onClick={() => onEventoClick?.(evento)}
                className={`
                  w-full text-left p-4 rounded-lg border-2 border-linen-300
                  bg-white shadow-embroidery
                  transition-all duration-200
                  hover:border-terracotta-400 hover:shadow-lg
                  active:shadow-embroidery-pressed
                  group cursor-pointer
                `}
                type="button"
              >
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 text-center py-2 px-3 rounded-lg bg-terracotta-50 border border-terracotta-200">
                    <p className="font-bold text-terracotta-700 text-lg">
                      {eventDate.getDate()}
                    </p>
                    <p className="text-xs text-terracotta-600 font-embroidery">
                      {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-embroidery text-sm text-embroidery-black group-hover:text-terracotta-600 transition-colors flex-1">
                        {evento.title}
                      </h4>
                      <span
                        className={`
                          text-xs font-embroidery px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0
                          ${status.color}
                        `}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 text-xs text-embroidery-gray font-body mb-2">
                      <span>{category.icon} {category.label}</span>
                      {evento.location && (
                        <>
                          <span>•</span>
                          <span className="truncate">📍 {evento.location}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="font-body text-xs text-embroidery-dark line-clamp-2">
                      {evento.description}
                    </p>

                    {/* Participants */}
                    {evento.participantCount && (
                      <div className="mt-2 pt-2 border-t border-linen-200">
                        <p className="text-xs text-embroidery-gray">
                          👥 {evento.participantCount.toLocaleString('pt-BR')}{' '}
                          pessoas interessadas
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-heading text-3xl text-embroidery-black mb-2">
          Eventos
        </h2>
        <p className="font-body text-embroidery-gray mb-8">
          {eventos.length} evento{eventos.length !== 1 ? 's' : ''} que essa
          pessoa está envolvida
        </p>

        <div>
          {renderEventos(agenados, 'Próximos Eventos')}
          {renderEventos(emAndamento, 'Em Andamento')}
          {renderEventos(finalizados, 'Eventos Passados')}
        </div>

        {eventos.length === 0 && (
          <div className="p-8 text-center bg-linen-50 rounded-lg border border-linen-300">
            <p className="text-sm text-embroidery-gray font-body">
              Sem eventos registrados
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
