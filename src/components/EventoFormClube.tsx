import React, { useState } from 'react';
import { CamposEventoBase, EventoFormBase } from './EventoFormBase';
import type { Recorrencia } from '@/types/eventos';

interface EventoFormClubeProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const EventoFormClube: React.FC<EventoFormClubeProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const baseForm = EventoFormBase({ onSubmit, isLoading, onCancel });
  const [formData, setFormData] = useState({
    ...baseForm.formData,
    local: '',
    recorrencia: 'semanal' as Recorrencia,
    dataFim: '',
    facilitadores: [''],
    tema: '',
    objetivos: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFacilitadorChange = (index: number, value: string) => {
    const newFacilitadores = [...formData.facilitadores];
    newFacilitadores[index] = value;
    setFormData((prev) => ({
      ...prev,
      facilitadores: newFacilitadores,
    }));
  };

  const addFacilitador = () => {
    setFormData((prev) => ({
      ...prev,
      facilitadores: [...prev.facilitadores, ''],
    }));
  };

  const removeFacilitador = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      facilitadores: prev.facilitadores.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.organizador || !formData.data || !formData.horario) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.local) {
      setError('Local é obrigatório');
      return;
    }

    if (formData.facilitadores.some((f) => !f.trim())) {
      setError('Todos os facilitadores devem ter nomes');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {error && (
        <div className="p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      {/* Campos base */}
      <CamposEventoBase
        formData={formData}
        onChange={handleInputChange}
        onImageChange={baseForm.handleImageChange}
        imagemPreview={baseForm.imagemPreview}
        remainingChars={baseForm.remainingChars}
      />

      {/* Campos específicos clube */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-sm text-embroidery-black">
          Informações da Roda
        </h3>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Local *
          </label>
          <input
            type="text"
            name="local"
            value={formData.local}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Ex: Espaço Comunitário"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-1">
              Recorrência *
            </label>
            <select
              name="recorrencia"
              value={formData.recorrencia}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
              required
            >
              <option value="nenhuma">Sem recorrência</option>
              <option value="semanal">Semanal</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-1">
              Data Final (opcional)
            </label>
            <input
              type="date"
              name="dataFim"
              value={formData.dataFim}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Tema (opcional)
          </label>
          <input
            type="text"
            name="tema"
            value={formData.tema}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Ex: Feminismo e Trabalho"
          />
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Objetivos (opcional)
          </label>
          <textarea
            name="objetivos"
            value={formData.objetivos}
            onChange={handleInputChange}
            maxLength={200}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400 resize-none"
            rows={2}
            placeholder="Objetivos da roda..."
          />
        </div>

        {/* Facilitadores */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-embroidery text-embroidery-black">
              Facilitadores *
            </label>
            <button
              type="button"
              onClick={addFacilitador}
              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-embroidery"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {formData.facilitadores.map((facilitador, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={facilitador}
                  onChange={(e) => handleFacilitadorChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
                  placeholder="Nome do facilitador"
                  required
                />
                {formData.facilitadores.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFacilitador(index)}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-linen-300 sticky bottom-0 bg-white">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="embroidery-button embroidery-thread-black flex-1 bg-gradient-to-b from-linen-300 to-linen-600 px-4 py-2 rounded-lg font-embroidery text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="embroidery-button embroidery-thread-white flex-1 bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-4 py-2 rounded-lg font-embroidery text-sm"
        >
          {isSubmitting || isLoading ? 'Criando...' : 'Criar Roda'}
        </button>
      </div>
    </form>
  );
};
