import React, { useState, useEffect } from 'react';
import { RodaList } from '@/components/RodaList';
import { RodaDetail } from '@/components/RodaDetail';
import { RodaForm } from '@/components/RodaForm';
import { useRodas } from '@/hooks/useRodas';
import { RODAS_EXEMPLO } from '@/data/rodas-exemplos';
import type { CreateRodaDTO, Mesa } from '@/types/rodas';

export const RodasPage: React.FC = () => {
  const rodas = useRodas(RODAS_EXEMPLO);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleCreateRoda = async (data: CreateRodaDTO) => {
    try {
      await rodas.createRoda(data);
      setShowForm(false);
      setNotification({
        type: 'success',
        message: '✓ Roda criada com sucesso!',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao criar roda',
      });
    }
  };

  const handleSelectRoda = (roda: typeof rodas.rodas[0]) => {
    rodas.selectRoda(roda);
  };

  const handleDeleteRoda = async (rodaId: string) => {
    try {
      await rodas.deleteRoda(rodaId);
      setNotification({
        type: 'success',
        message: '✓ Roda deletada',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao deletar roda',
      });
    }
  };

  const handleAddMesa = async (mesa: Mesa) => {
    try {
      await rodas.addMesa(mesa);
      setNotification({
        type: 'success',
        message: '✓ Mesa criada',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao criar mesa',
      });
    }
  };

  const handleDeleteMesa = async (mesaId: string) => {
    try {
      await rodas.deleteMesa(mesaId);
      setNotification({
        type: 'success',
        message: '✓ Mesa deletada',
      });
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro ao deletar mesa',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-linen-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-700 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-embroidery text-4xl mb-2">
            Rodas de Discussão
          </h1>
          <p className="font-body text-terracotta-100 max-w-2xl">
            Organize e participe de rodas de conversa para discutir temas importantes.
            Cada roda contém múltiplas mesas de discussão e uma trilha sonora.
          </p>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {rodas.selectedRoda ? (
          /* Detalhes de uma Roda */
          <div>
            <RodaDetail
              roda={rodas.selectedRoda}
              onAddMesa={handleAddMesa}
              onDeleteMesa={handleDeleteMesa}
              onBack={() => rodas.selectRoda(null)}
            />
          </div>
        ) : (
          /* Lista de Rodas */
          <div className="space-y-8">
            {/* Botão Criar Nova Roda */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(!showForm)}
                className="embroidery-button embroidery-thread-white bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-6 py-3 rounded-lg font-embroidery text-lg"
              >
                {showForm ? '✕ Fechar' : '+ Criar Roda'}
              </button>
            </div>

            {/* Formulário */}
            {showForm && (
              <div className="bg-white rounded-lg border-2 border-linen-300 p-8 shadow-embroidery">
                <h2 className="font-embroidery text-2xl text-embroidery-black mb-6">
                  Nova Roda
                </h2>
                <RodaForm
                  onSubmit={handleCreateRoda}
                  isLoading={rodas.isLoading}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Lista */}
            <RodaList
              rodas={rodas.rodas}
              onSelectRoda={handleSelectRoda}
              onDeleteRoda={handleDeleteRoda}
              isLoading={rodas.isLoading}
            />
          </div>
        )}
      </div>

      {/* Notificação */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg font-body text-sm font-bold ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};
