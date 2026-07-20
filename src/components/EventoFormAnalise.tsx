import React, { useState } from 'react';
import { CamposEventoBase, EventoFormBase } from './EventoFormBase';
import type { Recorrencia } from '@/types/eventos';

interface EventoFormAnaliseProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const EventoFormAnalise: React.FC<EventoFormAnaliseProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const baseForm = EventoFormBase({ onSubmit, isLoading, onCancel });
  const [formData, setFormData] = useState({
    ...baseForm.formData,
    local: '',
    recorrencia: 'quinzenal' as Recorrencia,
    dataFim: '',
    facilitadores: [''],
    textosPrepara: [''],
    questoesChave: [''],
    metodologia: '',
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

  const handleArrayChange = (
    field: 'facilitadores' | 'textosPrepara' | 'questoesChave',
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  const addItem = (field: 'facilitadores' | 'textosPrepara' | 'questoesChave') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeItem = (
    field: 'facilitadores' | 'textosPrepara' | 'questoesChave',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
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

      {/* Campos específicos análise */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-sm text-embroidery-black">
          Informações da Análise
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
            placeholder="Ex: Sala de Estudos"
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
            Metodologia (opcional)
          </label>
          <textarea
            name="metodologia"
            value={formData.metodologia}
            onChange={handleInputChange}
            maxLength={200}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400 resize-none"
            rows={2}
            placeholder="Método de análise, dinâmica..."
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
              onClick={() => addItem('facilitadores')}
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
                  onChange={(e) => handleArrayChange('facilitadores', index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
                  placeholder="Nome do facilitador"
                  required
                />
                {formData.facilitadores.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem('facilitadores', index)}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Textos para Preparar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-embroidery text-embroidery-black">
              Textos para Preparar (opcional)
            </label>
            <button
              type="button"
              onClick={() => addItem('textosPrepara')}
              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-embroidery"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {formData.textosPrepara.map((texto, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => handleArrayChange('textosPrepara', index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
                  placeholder="Ex: Marx - O Capital, cap. 1"
                />
                {formData.textosPrepara.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeItem('textosPrepara', index)}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Questões-chave */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-embroidery text-embroidery-black">
              Questões-chave (opcional)
            </label>
            <button
              type="button"
              onClick={() => addItem('questoesChave')}
              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-embroidery"
            >
              + Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {formData.questoesChave.map((questao, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={questao}
                  onChange={(e) => handleArrayChange('questoesChave', index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
                  placeholder="Questão norteadora"
                />
                {formData.questoesChave.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeItem('questoesChave', index)}
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
          {isSubmitting || isLoading ? 'Criando...' : 'Criar Análise'}
        </button>
      </div>
    </form>
  );
};
