import React, { useState, useMemo } from 'react';
import type { Roda, FiltrosRoda } from '@/types/rodas';

interface RodaListProps {
  rodas: Roda[];
  onSelectRoda?: (roda: Roda) => void;
  onDeleteRoda?: (rodaId: string) => Promise<void>;
  isLoading?: boolean;
}

export const RodaList: React.FC<RodaListProps> = ({
  rodas,
  onSelectRoda,
  onDeleteRoda,
  isLoading = false,
}) => {
  const [filtros, setFiltros] = useState<FiltrosRoda>({
    busca: '',
    categoria: '',
    apenas_ativas: false,
    ordenar: 'recentes',
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const cats = new Set(rodas.map((r) => r.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [rodas]);

  const rodasFiltradas = useMemo(() => {
    let resultado = rodas;

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.nome.toLowerCase().includes(termo) ||
          r.descricao.toLowerCase().includes(termo) ||
          r.tags?.some((t) => t.toLowerCase().includes(termo))
      );
    }

    if (filtros.categoria) {
      resultado = resultado.filter((r) => r.categoria === filtros.categoria);
    }

    if (filtros.apenas_ativas) {
      resultado = resultado.filter((r) => r.ativo);
    }

    if (filtros.ordenar === 'nome') {
      resultado.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (filtros.ordenar === 'populares') {
      resultado.sort((a, b) => (b.participantesCount || 0) - (a.participantesCount || 0));
    } else {
      resultado.sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime());
    }

    return resultado;
  }, [rodas, filtros]);

  const handleDeleteRoda = async (rodaId: string) => {
    if (!onDeleteRoda) return;
    if (!confirm('Tem certeza que deseja deletar esta roda?')) return;

    setDeletingId(rodaId);
    try {
      await onDeleteRoda(rodaId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-gradient-to-b from-linen-50 to-white rounded-lg p-6 border-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-lg text-embroidery-black">Filtros</h3>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-2">
            Buscar
          </label>
          <input
            type="text"
            value={filtros.busca}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                busca: e.target.value,
              }))
            }
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Buscar por nome, descrição ou tags..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-2">
              Categoria
            </label>
            <select
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  categoria: e.target.value,
                }))
              }
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-2">
              Ordenar por
            </label>
            <select
              value={filtros.ordenar}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  ordenar: e.target.value as FiltrosRoda['ordenar'],
                }))
              }
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            >
              <option value="recentes">Mais recentes</option>
              <option value="nome">Nome (A-Z)</option>
              <option value="populares">Mais participantes</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={filtros.apenas_ativas}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    apenas_ativas: e.target.checked,
                  }))
                }
                className="w-5 h-5 rounded border-2 border-linen-300 focus:ring-2 focus:ring-terracotta-400"
              />
              <span className="font-embroidery text-sm text-embroidery-black">
                Apenas ativas
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={() =>
            setFiltros({
              busca: '',
              categoria: '',
              apenas_ativas: false,
              ordenar: 'recentes',
            })
          }
          className="embroidery-button embroidery-thread-black bg-gradient-to-b from-linen-300 to-linen-600 px-4 py-2 rounded-lg font-embroidery text-sm"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Resultados */}
      <div>
        <h3 className="font-embroidery text-lg text-embroidery-black mb-4">
          Rodas ({rodasFiltradas.length})
        </h3>

        {rodasFiltradas.length === 0 ? (
          <div className="p-12 text-center bg-linen-50 rounded-lg border-2 border-dashed border-linen-300">
            <p className="text-2xl mb-2">🎭</p>
            <p className="font-embroidery text-embroidery-black">
              Nenhuma roda encontrada
            </p>
            <p className="text-sm text-embroidery-gray">
              Tente ajustar os filtros ou criar uma nova roda
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rodasFiltradas.map((roda) => (
              <div
                key={roda.id}
                className="bg-white rounded-lg border-2 border-linen-300 overflow-hidden hover:shadow-embroidery transition-shadow"
              >
                {/* Imagem */}
                {roda.imagemCapa && (
                  <div className="relative w-full h-32 overflow-hidden bg-linen-100">
                    <img
                      src={roda.imagemCapa}
                      alt={roda.nome}
                      className="w-full h-full object-cover"
                    />
                    {!roda.ativo && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="font-embroidery text-white text-sm">
                          Inativa
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Conteúdo */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-embroidery text-embroidery-black line-clamp-2">
                      {roda.nome}
                    </h4>
                    {roda.categoria && (
                      <p className="text-xs text-embroidery-gray font-embroidery">
                        {roda.categoria}
                      </p>
                    )}
                  </div>

                  <p className="font-body text-sm text-embroidery-black line-clamp-2">
                    {roda.descricao}
                  </p>

                  {/* Tags */}
                  {roda.tags && roda.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {roda.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 text-xs rounded-full bg-terracotta-100 text-terracotta-700 font-body"
                        >
                          {tag}
                        </span>
                      ))}
                      {roda.tags.length > 2 && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-linen-200 text-embroidery-gray font-body">
                          +{roda.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="pt-2 border-t border-linen-300 space-y-1 text-xs text-embroidery-gray">
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span className="font-body">
                        {roda.participantesCount || 0} participantes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📚</span>
                      <span className="font-body">
                        {roda.mesas.length} mesa{roda.mesas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onSelectRoda?.(roda)}
                      className="embroidery-button embroidery-thread-white flex-1 bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-3 py-2 rounded-lg font-embroidery text-xs"
                    >
                      Ver Detalhes
                    </button>
                    {onDeleteRoda && (
                      <button
                        onClick={() => handleDeleteRoda(roda.id)}
                        disabled={deletingId === roda.id}
                        className="embroidery-button embroidery-thread-red flex-shrink-0 bg-gradient-to-b from-red-100 to-red-300 px-3 py-2 rounded-lg font-embroidery text-xs hover:from-red-200 hover:to-red-400 disabled:opacity-50"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
