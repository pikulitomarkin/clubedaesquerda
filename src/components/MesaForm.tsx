import React, { useState } from 'react';
import type { CreateMesaDTO } from '@/types/rodas';

interface MesaFormProps {
  rodaId: string;
  onSubmit: (data: CreateMesaDTO) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const MesaForm: React.FC<MesaFormProps> = ({
  rodaId,
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
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

    if (!formData.nome.trim() || !formData.descricao.trim()) {
      setError('Nome e descrição são obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rodaId,
        nome: formData.nome,
        descricao: formData.descricao,
      });
      setFormData({ nome: '', descricao: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar mesa');
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

      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Nome da Mesa *
        </label>
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
          placeholder="Ex: Mesa 1: Temática Principal"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Descrição *
        </label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={handleInputChange}
          maxLength={300}
          className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400 resize-none"
          rows={3}
          placeholder="Descrição breve do tema a ser discutido..."
          required
        />
        <p className="text-xs text-embroidery-gray mt-1">
          {formData.descricao.length}/300 caracteres
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="embroidery-button embroidery-thread-black flex-1 bg-gradient-to-b from-linen-300 to-linen-600 px-3 py-2 rounded-lg font-embroidery text-sm"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="embroidery-button embroidery-thread-white flex-1 bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-3 py-2 rounded-lg font-embroidery text-sm"
        >
          {isSubmitting || isLoading ? 'Criando...' : 'Criar Mesa'}
        </button>
      </div>
    </form>
  );
};
