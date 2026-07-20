import React, { useState } from 'react';

interface EventoFormBaseProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const EventoFormBase: React.FC<EventoFormBaseProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    organizador: '',
    data: '',
    horario: '',
    descricao: '',
    imagemCapa: '',
  });

  const [error, setError] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string>('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem não pode ser maior que 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagemPreview(result);
        setFormData((prev) => ({
          ...prev,
          imagemCapa: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const remainingChars = 200 - formData.descricao.length;

  return {
    formData,
    setFormData,
    error,
    setError,
    imagemPreview,
    setImagemPreview,
    handleInputChange,
    handleImageChange,
    remainingChars,
  };
};

// Componente renderizador de campos comuns
export const CamposEventoBase: React.FC<{
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagemPreview: string;
  remainingChars: number;
}> = ({
  formData,
  onChange,
  onImageChange,
  imagemPreview,
  remainingChars,
}) => {
  return (
    <div className="space-y-4">
      {/* Nome */}
      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Nome do Evento *
        </label>
        <input
          type="text"
          name="nome"
          value={formData.nome}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
          placeholder="Ex: Roda de Conversa sobre Feminismo"
          required
        />
      </div>

      {/* Organizador */}
      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Organizador *
        </label>
        <input
          type="text"
          name="organizador"
          value={formData.organizador}
          onChange={onChange}
          className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
          placeholder="Ex: Marina Silva"
          required
        />
      </div>

      {/* Data e Horário */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Data *
          </label>
          <input
            type="date"
            name="data"
            value={formData.data}
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Horário *
          </label>
          <input
            type="time"
            name="horario"
            value={formData.horario}
            onChange={onChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            required
          />
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Descrição ({remainingChars} caracteres restantes)
        </label>
        <textarea
          name="descricao"
          value={formData.descricao}
          onChange={onChange}
          maxLength={200}
          className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400 resize-none"
          rows={3}
          placeholder="Descrição breve do evento..."
        />
        <p className="text-xs text-embroidery-gray mt-1">
          {formData.descricao.length}/200 caracteres
        </p>
      </div>

      {/* Imagem de Capa */}
      <div>
        <label className="block text-sm font-embroidery text-embroidery-black mb-1">
          Imagem de Capa
        </label>
        <div className="flex gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="flex-1 text-sm text-embroidery-gray"
          />
        </div>
        {imagemPreview && (
          <img
            src={imagemPreview}
            alt="Preview"
            className="mt-3 w-full h-32 object-cover rounded-lg"
          />
        )}
      </div>
    </div>
  );
};
