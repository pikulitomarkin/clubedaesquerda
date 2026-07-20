import React, { useMemo, useState } from 'react';
import type { Evento, TipoEvento, FiltrosEvento } from '@/types/eventos';

interface EventoListProps {
  eventos: Evento[];
  onEventoClick?: (evento: Evento) => void;
  onNovoEvento?: (tipo: TipoEvento) => void;
}

const getTipoInfo = (tipo: TipoEvento) => {
  const info: Record<TipoEvento, { label: string; icone: string; cor: string }> = {
    presencial: { label: 'Presencial', icone: '📍', cor: 'bg-blue-100 text-blue-700' },
    online: { label: 'Online', icone: '💻', cor: 'bg-purple-100 text-purple-700' },
    clube: { label: 'Roda', icone: '💬', cor: 'bg-green-100 text-green-700' },
    analise: { label: 'Análise', icone: '📚', cor: 'bg-orange-100 text-orange-700' },
  };
  return info[tipo];
};

export const EventoList: React.FC<EventoListProps> = ({
  eventos,
  onEventoClick,
  onNovoEvento,
}) => {
  const [filtros, setFiltros] = useState<FiltrosEvento>({
    busca: '',
    tipo: undefined,
    apenas_ativos: true,
  });

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((evento) => {
      if (filtros.apenas_ativos && !evento.ativo) return false;
      if (filtros.tipo && evento.tipo !== filtros.tipo) return false;
      if (
        filtros.busca &&
        !evento.nome.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [eventos, filtros]);

  const handleFiltroChange = (key: keyof FiltrosEvento, value: any) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-embroidery p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-embroidery text-lg text-embroidery-black">Filtros</h2>
          {(filtros.busca || filtros.tipo) && (
            <button
              onClick={() =>
                setFiltros({ busca: '', tipo: undefined, apenas_ativos: true })
              }
              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-embroidery"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filtros.busca}
              onChange={(e) => handleFiltroChange('busca', e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            />
          </div>

          {/* Tipo */}
          <div>
            <select
              value={filtros.tipo || ''}
              onChange={(e) =>
                handleFiltroChange('tipo', e.target.value || undefined)
              }
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            >
              <option value="">Todos os tipos</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="clube">Roda de Conversa</option>
              <option value="analise">Análise Política</option>
            </select>
          </div>

          {/* Apenas ativos */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="apenas-ativos"
              checked={filtros.apenas_ativos}
              onChange={(e) => handleFiltroChange('apenas_ativos', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="apenas-ativos" className="font-body text-sm text-embroidery-black">
              Apenas eventos ativos
            </label>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs text-embroidery-gray font-body">
          Mostrando {eventosFiltrados.length} de {eventos.length} evento
          {eventos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Botões de ação rápida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { tipo: 'presencial' as TipoEvento, label: 'Novo Presencial', icone: '📍' },
          { tipo: 'online' as TipoEvento, label: 'Novo Online', icone: '💻' },
          { tipo: 'clube' as TipoEvento, label: 'Nova Roda', icone: '💬' },
          { tipo: 'analise' as TipoEvento, label: 'Nova Análise', icone: '📚' },
        ].map(({ tipo, label, icone }) => (
          <button
            key={tipo}
            onClick={() => onNovoEvento?.(tipo)}
            className="embroidery-button embroidery-thread-white bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-4 py-2 rounded-lg font-embroidery text-sm"
            type="button"
          >
            {icone} {label}
          </button>
        ))}
      </div>

      {/* Lista de eventos */}
      <div className="space-y-3">
        {eventosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-linen-50 rounded-lg border border-linen-300">
            <p className="text-2xl mb-2">📭</p>
            <p className="font-body text-embroidery-gray">
              Nenhum evento encontrado com os filtros selecionados
            </p>
          </div>
        ) : (
          eventosFiltrados.map((evento) => {
            const tipoInfo = getTipoInfo(evento.tipo);
            const dataEvento = new Date(evento.data);
            const dataFormatada = dataEvento.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long',
            });

            return (
              <button
                key={evento.id}
                onClick={() => onEventoClick?.(evento)}
                className="w-full text-left p-4 rounded-lg border-2 border-linen-300 bg-white shadow-embroidery hover:border-terracotta-400 hover:shadow-lg transition-all active:shadow-embroidery-pressed"
                type="button"
              >
                <div className="flex gap-4">
                  {/* Imagem */}
                  {evento.imagemCapa && (
                    <img
                      src={evento.imagemCapa}
                      alt={evento.nome}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-embroidery text-sm text-embroidery-black">
                        {evento.nome}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-embroidery whitespace-nowrap flex-shrink-0 ${tipoInfo.cor}`}
                      >
                        {tipoInfo.icone} {tipoInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-embroidery-gray font-body mb-2">
                      👤 {evento.organizador}
                    </p>

                    <p className="text-xs text-embroidery-dark font-body line-clamp-2 mb-2">
                      {evento.descricao}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-embroidery-gray font-body">
                      <span>📅 {dataFormatada}</span>
                      <span>🕐 {evento.horario}</span>

                      {evento.tipo === 'presencial' && 'local' in evento && (
                        <span>📍 {evento.local}</span>
                      )}
                      {evento.tipo === 'online' && 'plataforma' in evento && (
                        <span>💻 {evento.plataforma}</span>
                      )}
                      {(evento.tipo === 'clube' || evento.tipo === 'analise') &&
                        'recorrencia' in evento && (
                          <span>🔄 {evento.recorrencia}</span>
                        )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
