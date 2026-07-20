import React, { useState } from 'react';
import type { Homenagem } from '@/types/public-profile';

interface HonorSectionProps {
  homenagens: Homenagem[];
  showHomenagens: boolean;
  onToggleVisibility?: (show: boolean) => void;
  isSelf?: boolean;
  onDeleteHomenagem?: (id: string) => void;
}

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  apoio: { label: 'Apoio', icon: '💪', color: 'bg-blue-100 text-blue-700' },
  reconhecimento: {
    label: 'Reconhecimento',
    icon: '⭐',
    color: 'bg-yellow-100 text-yellow-700',
  },
  agradecimento: {
    label: 'Agradecimento',
    icon: '🙏',
    color: 'bg-green-100 text-green-700',
  },
  solidariedade: {
    label: 'Solidariedade',
    icon: '🤝',
    color: 'bg-red-100 text-red-700',
  },
};

export const HonorSection: React.FC<HonorSectionProps> = ({
  homenagens,
  showHomenagens,
  onToggleVisibility,
  isSelf = false,
  onDeleteHomenagem,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleHomenagens = homenagens.filter((h) => h.isVisible);

  if (homenagens.length === 0) {
    return null;
  }

  return (
    <div className="bg-linen-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header with Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl text-embroidery-black mb-2">
              Homenagens
            </h2>
            <p className="font-body text-embroidery-gray">
              {visibleHomenagens.length}/{homenagens.length} mensagens de apoio
              e reconhecimento
            </p>
          </div>

          {isSelf && (
            <button
              onClick={() => onToggleVisibility?.(!showHomenagens)}
              className={`
                px-4 py-2 rounded-lg font-embroidery text-sm transition-all
                ${
                  showHomenagens
                    ? 'bg-terracotta-100 text-terracotta-700 border border-terracotta-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }
              `}
              type="button"
              title={showHomenagens ? 'Clique para ocultar' : 'Clique para mostrar'}
            >
              {showHomenagens ? '👁️ Visível' : '👁️‍🗨️ Oculto'}
            </button>
          )}
        </div>

        {/* Info Message */}
        {isSelf && !showHomenagens && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div className="text-sm text-blue-700 font-body">
              <p className="font-embroidery mb-1">
                Homenagens ocultas apenas para você
              </p>
              <p>Você pode mostrar as homenagens quando quiser</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {showHomenagens ? (
          visibleHomenagens.length > 0 ? (
            <div className="space-y-3">
              {visibleHomenagens.map((homenagem) => {
                const type = typeLabels[homenagem.type];
                const isExpanded = expandedId === homenagem.id;

                return (
                  <div
                    key={homenagem.id}
                    className="p-4 rounded-lg bg-white border-2 border-linen-300 shadow-embroidery transition-all duration-200 hover:border-terracotta-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {homenagem.fromUserAvatar && (
                            <img
                              src={homenagem.fromUserAvatar}
                              alt={homenagem.fromUserName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-embroidery text-sm text-embroidery-black">
                              {homenagem.fromUserName}
                            </p>
                            <p className="text-xs text-embroidery-gray">
                              {new Date(homenagem.createdAt).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`
                            inline-block text-xs px-2 py-1 rounded-full font-embroidery
                            ${type.color}
                          `}
                        >
                          {type.icon} {type.label}
                        </span>
                      </div>

                      {/* Delete Button */}
                      {isSelf && (
                        <button
                          onClick={() => onDeleteHomenagem?.(homenagem.id)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 text-lg"
                          type="button"
                          title="Remover"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Message */}
                    <div className="mt-3">
                      <p
                        className={`
                          font-body text-sm text-embroidery-dark leading-relaxed
                          ${isExpanded ? '' : 'line-clamp-2'}
                        `}
                      >
                        {homenagem.message}
                      </p>

                      {homenagem.message.length > 150 && (
                        <button
                          onClick={() =>
                            setExpandedId(
                              isExpanded ? null : homenagem.id
                            )
                          }
                          className="mt-2 text-xs text-terracotta-600 hover:text-terracotta-700 font-embroidery"
                          type="button"
                        >
                          {isExpanded ? 'Recolher' : 'Ler mais'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-lg border border-linen-300">
              <p className="text-sm text-embroidery-gray font-body">
                Nenhuma homenagem pública por enquanto
              </p>
            </div>
          )
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border-2 border-dashed border-linen-400">
            <p className="text-lg font-embroidery text-embroidery-black mb-2">
              Homenagens Ocultas
            </p>
            <p className="text-sm text-embroidery-gray font-body">
              {homenagens.length} homenagens estão ocultas. Apenas você pode vê-las.
            </p>
          </div>
        )}

        {/* Add Homenagem Button (if self) */}
        {isSelf && (
          <div className="mt-8 p-4 text-center bg-terracotta-50 rounded-lg border border-terracotta-200">
            <p className="font-body text-sm text-terracotta-700 mb-3">
              Receba mensagens de apoio da comunidade
            </p>
            <button
              className="embroidery-button embroidery-thread-white bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-6 py-2 text-sm rounded-lg font-embroidery"
              type="button"
            >
              ✉️ Compartilhar Link de Homenagem
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
