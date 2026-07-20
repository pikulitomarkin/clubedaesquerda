import React, { useState } from 'react';
import type { Roda, Mesa } from '@/types/rodas';
import { MusicPlayer } from './MusicPlayer';
import { MesaForm } from './MesaForm';
import type { CreateMesaDTO } from '@/types/rodas';

interface RodaDetailProps {
  roda: Roda;
  onAddMesa?: (mesa: Mesa) => Promise<void>;
  onDeleteMesa?: (mesaId: string) => Promise<void>;
  onBack?: () => void;
}

export const RodaDetail: React.FC<RodaDetailProps> = ({
  roda,
  onAddMesa,
  onDeleteMesa,
  onBack,
}) => {
  const [showMesaForm, setShowMesaForm] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>(roda.mesas);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddMesa = async (data: CreateMesaDTO) => {
    const novaMesa: Mesa = {
      id: `mesa-${Date.now()}`,
      ...data,
      criadorId: 'user-current',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      ordem: mesas.length + 1,
    };

    try {
      if (onAddMesa) {
        await onAddMesa(novaMesa);
      }
      setMesas((prev) => [...prev, novaMesa]);
      setShowMesaForm(false);
    } catch (error) {
      console.error('Erro ao adicionar mesa:', error);
    }
  };

  const handleDeleteMesa = async (mesaId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta mesa?')) return;

    setDeletingId(mesaId);
    try {
      if (onDeleteMesa) {
        await onDeleteMesa(mesaId);
      }
      setMesas((prev) => prev.filter((m) => m.id !== mesaId));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="embroidery-button embroidery-thread-black text-sm px-3 py-1 rounded-lg bg-linen-200 hover:bg-linen-300"
          >
            ← Voltar
          </button>
        )}

        <div>
          <h1 className="font-embroidery text-3xl text-embroidery-black mb-2">
            {roda.nome}
          </h1>
          {roda.categoria && (
            <p className="text-sm font-embroidery text-embroidery-gray">
              {roda.categoria}
            </p>
          )}
        </div>

        <p className="font-body text-embroidery-black leading-relaxed max-w-2xl">
          {roda.descricao}
        </p>

        {/* Status e Meta */}
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-embroidery ${
              roda.ativo
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}>
              {roda.ativo ? '✓ Ativa' : '○ Inativa'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>👥</span>
            <span className="font-body">{roda.participantesCount || 0} participantes</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>📅</span>
            <span className="font-body">Criada em {formatDate(roda.criadoEm)}</span>
          </div>
        </div>

        {/* Tags */}
        {roda.tags && roda.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {roda.tags.map((tag) => (
              <span
                key={tag}
                className="inline-block px-3 py-1 text-xs rounded-full bg-terracotta-100 text-terracotta-700 font-body"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Imagem e Player */}
      {(roda.imagemCapa || roda.musicas.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-3">
          {roda.musicas.length > 0 && (
            <div className="lg:col-span-1">
              <MusicPlayer
                musicas={roda.musicas}
                gifLoop={roda.gifLoop}
                nomeDaRoda={roda.nome}
              />
            </div>
          )}

          {roda.imagemCapa && (
            <div className={`${roda.musicas.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <img
                src={roda.imagemCapa}
                alt={roda.nome}
                className="w-full rounded-lg shadow-embroidery object-cover max-h-80"
              />
            </div>
          )}
        </div>
      )}

      {/* Mesas */}
      <div className="pt-6 border-t-2 border-linen-300 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-embroidery text-2xl text-embroidery-black">
            Mesas de Discussão ({mesas.length})
          </h2>
          {onAddMesa && (
            <button
              onClick={() => setShowMesaForm(!showMesaForm)}
              className="embroidery-button embroidery-thread-white bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-4 py-2 rounded-lg font-embroidery text-sm"
            >
              {showMesaForm ? '✕ Fechar' : '+ Nova Mesa'}
            </button>
          )}
        </div>

        {/* Formulário de Nova Mesa */}
        {showMesaForm && (
          <div className="p-6 bg-gradient-to-b from-linen-50 to-white rounded-lg border-2 border-linen-300">
            <MesaForm
              rodaId={roda.id}
              onSubmit={handleAddMesa}
              onCancel={() => setShowMesaForm(false)}
            />
          </div>
        )}

        {/* Lista de Mesas */}
        {mesas.length === 0 ? (
          <div className="p-12 text-center bg-linen-50 rounded-lg border-2 border-dashed border-linen-300">
            <p className="text-2xl mb-2">🎤</p>
            <p className="font-embroidery text-embroidery-black">
              Nenhuma mesa criada ainda
            </p>
            <p className="text-sm text-embroidery-gray">
              Adicione uma mesa de discussão para iniciar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mesas
              .sort((a, b) => a.ordem - b.ordem)
              .map((mesa) => (
                <div
                  key={mesa.id}
                  className="p-6 bg-white rounded-lg border-2 border-linen-300 hover:shadow-embroidery transition-shadow space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-embroidery text-lg text-embroidery-black">
                        {mesa.nome}
                      </h3>
                      <p className="font-body text-sm text-embroidery-gray mt-1">
                        {mesa.descricao}
                      </p>
                    </div>
                    {onDeleteMesa && (
                      <button
                        onClick={() => handleDeleteMesa(mesa.id)}
                        disabled={deletingId === mesa.id}
                        className="embroidery-button embroidery-thread-red flex-shrink-0 bg-gradient-to-b from-red-100 to-red-300 px-3 py-2 rounded-lg font-embroidery text-xs hover:from-red-200 hover:to-red-400 disabled:opacity-50"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-embroidery-gray space-y-1 pt-2 border-t border-linen-300">
                    <p>
                      Criada em{' '}
                      {formatDate(mesa.criadoEm)} por user-{mesa.criadorId}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
