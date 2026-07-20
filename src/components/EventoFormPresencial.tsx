import React, { useState } from 'react';
import { CamposEventoBase, EventoFormBase } from './EventoFormBase';

interface EventoFormPresencialProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const EventoFormPresencial: React.FC<EventoFormPresencialProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const baseForm = EventoFormBase({ onSubmit, isLoading, onCancel });
  const [formData, setFormData] = useState({
    ...baseForm.formData,
    local: '',
    endereco: '',
    capacidade: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.organizador || !formData.data || !formData.horario) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.local || !formData.endereco) {
      setError('Local e endereço são obrigatórios para eventos presenciais');
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Campos específicos presencial */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-sm text-embroidery-black">
          Informações do Local
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
            placeholder="Ex: Praça da República"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Endereço Completo *
          </label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Rua, número, bairro, cidade, estado"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Capacidade (opcional)
          </label>
          <input
            type="number"
            name="capacidade"
            value={formData.capacidade}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Ex: 500"
            min="1"
          />
          <p className="text-xs text-embroidery-gray mt-1">
            Número máximo de participantes esperados
          </p>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-linen-300">
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
          {isSubmitting || isLoading ? 'Criando...' : 'Criar Evento'}
        </button>
      </div>
    </form>
  );
};
