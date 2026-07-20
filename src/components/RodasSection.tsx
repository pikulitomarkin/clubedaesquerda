import React from 'react';
import type { Roda } from '@/types/public-profile';

interface RodasSectionProps {
  rodas: Roda[];
  onRodaClick?: (roda: Roda) => void;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  conversa: { label: 'Conversa', icon: '💬' },
  estudo: { label: 'Estudo', icon: '📖' },
  acao: { label: 'Ação', icon: '✊' },
  social: { label: 'Social', icon: '🎉' },
};

const frequencyLabels: Record<string, string> = {
  semanal: 'Semanalmente',
  quinzenal: 'Quinzenalmente',
  mensal: 'Mensalmente',
};

export const RodasSection: React.FC<RodasSectionProps> = ({
  rodas,
  onRodaClick,
}) => {
  if (rodas.length === 0) {
    return null;
  }

  return (
    <div className="bg-linen-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-heading text-3xl text-embroidery-black mb-2">
          Rodas Conectadas
        </h2>
        <p className="font-body text-embroidery-gray mb-8">
          {rodas.length} espaço{rodas.length !== 1 ? 's' : ''} de diálogo e
          ação que essa pessoa participa
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rodas.map((roda) => {
            const category = categoryLabels[roda.category];
            return (
              <button
                key={roda.id}
                onClick={() => onRodaClick?.(roda)}
                className={`
                  text-left p-6 rounded-lg border-2 border-linen-300
                  bg-white shadow-embroidery
                  transition-all duration-200
                  hover:border-terracotta-400 hover:shadow-lg
                  active:shadow-embroidery-pressed
                  group cursor-pointer
                `}
                type="button"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">
                    {roda.icon || category.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-embroidery text-sm text-embroidery-black group-hover:text-terracotta-600 transition-colors">
                      {roda.title}
                    </h3>
                    <p className="text-xs text-embroidery-gray mt-1">
                      {category.label}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="font-body text-xs text-embroidery-dark mb-3 line-clamp-2">
                  {roda.description}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-3 flex-wrap text-xs font-body text-embroidery-gray">
                  {roda.frequency && (
                    <span className="px-2 py-1 bg-linen-100 rounded-full">
                      📅 {frequencyLabels[roda.frequency]}
                    </span>
                  )}
                  {roda.participantCount && (
                    <span className="px-2 py-1 bg-linen-100 rounded-full">
                      👥 {roda.participantCount} participantes
                    </span>
                  )}
                </div>

                {/* Next Date */}
                {roda.nextDate && (
                  <div className="mt-3 pt-3 border-t border-linen-200">
                    <p className="text-xs font-embroidery text-terracotta-600">
                      📍 Próximo:{' '}
                      {new Date(roda.nextDate).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
