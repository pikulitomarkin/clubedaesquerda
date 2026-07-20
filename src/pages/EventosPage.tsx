import React, { useState } from 'react';
import { EventoList } from '@/components/EventoList';
import { EventoModal } from '@/components/EventoModal';
import { TODOS_EVENTOS } from '@/data/eventos-exemplos';
import type { TipoEvento, Evento } from '@/types/eventos';

export const EventosPage: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>(TODOS_EVENTOS);
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoEvento>('presencial');
  const [isLoading, setIsLoading] = useState(false);
  const [notificacao, setNotificacao] = useState('');

  const handleAbrirModal = (tipo: TipoEvento) => {
    setTipoSelecionado(tipo);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
  };

  const handleSubmitEvento = async (data: any) => {
    setIsLoading(true);
    try {
      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Criar novo evento
      const novoEvento: Evento = {
        id: `evento-${Date.now()}`,
        tipo: tipoSelecionado,
        nome: data.nome,
        organizador: data.organizador,
        data: new Date(data.data),
        horario: data.horario,
        descricao: data.descricao,
        imagemCapa: data.imagemCapa,
        criadorId: 'user-current',
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        ativo: true,
        ...data,
      };

      setEventos((prev) => [novoEvento, ...prev]);
      setModalAberto(false);

      // Mostrar notificação
      setNotificacao(`${data.nome} criado com sucesso!`);
      setTimeout(() => setNotificacao(''), 3000);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      setNotificacao('Erro ao criar evento. Tente novamente.');
      setTimeout(() => setNotificacao(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventoClick = (evento: Evento) => {
    // Aqui você poderia abrir um modal de detalhes ou navegar para página do evento
    console.log('Evento clicado:', evento);
  };

  return (
    <div className="min-h-screen bg-linen-texture">
      {/* Header */}
      <div className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white p-6 shadow-embroidery-3d">
        <h1 className="font-heading text-3xl md:text-4xl mb-2">Eventos</h1>
        <p className="text-sm md:text-base opacity-90">
          Descubra rodas, análises, lives e manifestações do Clube da Esquerda
        </p>
      </div>

      {/* Notificação */}
      {notificacao && (
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-embroidery font-body text-sm">
            {notificacao}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tipo: 'presencial', label: 'Presenciais', icone: '📍', count: eventos.filter((e) => e.tipo === 'presencial' && e.ativo).length },
            { tipo: 'online', label: 'Online', icone: '💻', count: eventos.filter((e) => e.tipo === 'online' && e.ativo).length },
            { tipo: 'clube', label: 'Rodas', icone: '💬', count: eventos.filter((e) => e.tipo === 'clube' && e.ativo).length },
            { tipo: 'analise', label: 'Análises', icone: '📚', count: eventos.filter((e) => e.tipo === 'analise' && e.ativo).length },
          ].map(({ tipo, label, icone, count }) => (
            <div
              key={tipo}
              className="p-4 rounded-lg bg-white shadow-embroidery text-center"
            >
              <p className="text-2xl mb-1">{icone}</p>
              <p className="font-heading text-2xl text-embroidery-black">{count}</p>
              <p className="font-body text-xs text-embroidery-gray">{label}</p>
            </div>
          ))}
        </div>

        {/* Lista e Filtros */}
        <EventoList
          eventos={eventos}
          onEventoClick={handleEventoClick}
          onNovoEvento={handleAbrirModal}
        />
      </div>

      {/* Modais */}
      <EventoModal
        tipo={tipoSelecionado}
        isOpen={modalAberto}
        onClose={handleFecharModal}
        onSubmit={handleSubmitEvento}
        isLoading={isLoading}
      />

      {/* Footer spacing */}
      <div className="h-12" />
    </div>
  );
};
