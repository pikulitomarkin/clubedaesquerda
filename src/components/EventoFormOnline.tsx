import React, { useState } from 'react';
import { CamposEventoBase, EventoFormBase } from './EventoFormBase';

interface EventoFormOnlineProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const EventoFormOnline: React.FC<EventoFormOnlineProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const baseForm = EventoFormBase({ onSubmit, isLoading, onCancel });
  const [formData, setFormData] = useState({
    ...baseForm.formData,
    linkMeeting: '',
    plataforma: 'meet' as 'zoom' | 'meet' | 'jitsi' | 'outra',
    senhaOuToken: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome || !formData.organizador || !formData.data || !formData.horario) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.linkMeeting) {
      setError('Link da reunião é obrigatório');
      return;
    }

    // Validar URL
    try {
      new URL(formData.linkMeeting);
    } catch {
      setError('Link da reunião deve ser uma URL válida');
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

      {/* Campos específicos online */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-sm text-embroidery-black">
          Informações da Reunião
        </h3>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Plataforma *
          </label>
          <select
            name="plataforma"
            value={formData.plataforma}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            required
          >
            <option value="meet">Google Meet</option>
            <option value="zoom">Zoom</option>
            <option value="jitsi">Jitsi</option>
            <option value="outra">Outra</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Link da Reunião *
          </label>
          <input
            type="url"
            name="linkMeeting"
            value={formData.linkMeeting}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="https://meet.google.com/abc-def-ghi"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Senha ou Token (opcional)
          </label>
          <input
            type="text"
            name="senhaOuToken"
            value={formData.senhaOuToken}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Se necessário para acesso"
          />
          <p className="text-xs text-embroidery-gray mt-1">
            Deixe em branco se não necessário
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
