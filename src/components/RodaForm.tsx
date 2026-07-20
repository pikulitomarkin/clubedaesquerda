import React, { useState } from 'react';
import type { LinkMusica, CreateRodaDTO } from '@/types/rodas';

interface RodaFormProps {
  onSubmit: (data: CreateRodaDTO) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const RodaForm: React.FC<RodaFormProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagemCapa: '',
    gifLoop: '',
    musicas: [
      { id: '1', url: '', titulo: '', plataforma: 'youtube' as const },
      { id: '2', url: '', titulo: '', plataforma: 'spotify' as const },
      { id: '3', url: '', titulo: '', plataforma: 'youtube' as const },
    ],
    tags: '',
    categoria: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagemPreview, setImagemPreview] = useState('');
  const [gifPreview, setGifPreview] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMusicaChange = (
    index: number,
    field: keyof LinkMusica,
    value: string
  ) => {
    const newMusicas = [...formData.musicas];
    newMusicas[index] = {
      ...newMusicas[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      musicas: newMusicas as typeof formData.musicas,
    }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'capa' | 'gif'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Imagem não pode ser maior que 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (type === 'capa') {
          setImagemPreview(result);
          setFormData((prev) => ({
            ...prev,
            imagemCapa: result,
          }));
        } else {
          setGifPreview(result);
          setFormData((prev) => ({
            ...prev,
            gifLoop: result,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim() || !formData.descricao.trim()) {
      setError('Nome e descrição são obrigatórios');
      return;
    }

    if (formData.musicas.every((m) => !m.url.trim())) {
      setError('Adicione pelo menos um link de música');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        nome: formData.nome,
        descricao: formData.descricao,
        imagemCapa: formData.imagemCapa || undefined,
        gifLoop: formData.gifLoop || undefined,
        musicas: formData.musicas.filter((m) => m.url.trim()),
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : undefined,
        categoria: formData.categoria || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar roda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-96 overflow-y-auto pr-2">
      {error && (
        <div className="p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="font-embroidery text-lg text-embroidery-black">
          Informações Básicas
        </h3>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Nome da Roda *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
            placeholder="Ex: Feminismo e Trabalho"
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
            maxLength={500}
            className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400 resize-none"
            rows={3}
            placeholder="Descrição breve da roda..."
            required
          />
          <p className="text-xs text-embroidery-gray mt-1">
            {formData.descricao.length}/500 caracteres
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-1">
              Categoria (opcional)
            </label>
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
              placeholder="Ex: Educação"
            />
          </div>

          <div>
            <label className="block text-sm font-embroidery text-embroidery-black mb-1">
              Tags (opcional)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="w-full px-4 py-2 rounded-lg border-2 border-linen-300 font-body text-embroidery-black focus:outline-none focus:border-terracotta-400"
              placeholder="tag1, tag2, tag3"
            />
          </div>
        </div>
      </div>

      {/* Mídia */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-lg text-embroidery-black">Mídia</h3>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            Imagem de Capa (opcional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e, 'capa')}
            className="text-sm text-embroidery-gray"
          />
          {imagemPreview && (
            <img
              src={imagemPreview}
              alt="Preview Capa"
              className="mt-3 w-full h-24 object-cover rounded-lg"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-embroidery text-embroidery-black mb-1">
            GIF em Loop (opcional)
          </label>
          <input
            type="file"
            accept="image/*,.gif"
            onChange={(e) => handleImageChange(e, 'gif')}
            className="text-sm text-embroidery-gray"
          />
          {gifPreview && (
            <img
              src={gifPreview}
              alt="Preview GIF"
              className="mt-3 w-full h-24 object-cover rounded-lg animate-pulse"
            />
          )}
        </div>
      </div>

      {/* Músicas */}
      <div className="pt-4 border-t-2 border-linen-300 space-y-4">
        <h3 className="font-embroidery text-lg text-embroidery-black">Músicas (3)</h3>

        {formData.musicas.map((musica, index) => (
          <div key={musica.id} className="p-4 rounded-lg bg-linen-50 border-2 border-linen-300 space-y-2">
            <p className="font-embroidery text-sm text-embroidery-black">
              Música {index + 1}
            </p>

            <div>
              <label className="block text-xs font-embroidery text-embroidery-dark mb-1">
                Plataforma
              </label>
              <select
                value={musica.plataforma}
                onChange={(e) =>
                  handleMusicaChange(
                    index,
                    'plataforma',
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 rounded-lg border-2 border-linen-300 text-xs font-body focus:outline-none focus:border-terracotta-400"
              >
                <option value="youtube">YouTube</option>
                <option value="spotify">Spotify</option>
                <option value="soundcloud">SoundCloud</option>
                <option value="outra">Outra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-embroidery text-embroidery-dark mb-1">
                Título
              </label>
              <input
                type="text"
                value={musica.titulo}
                onChange={(e) => handleMusicaChange(index, 'titulo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-linen-300 text-xs font-body focus:outline-none focus:border-terracotta-400"
                placeholder="Título da música"
              />
            </div>

            <div>
              <label className="block text-xs font-embroidery text-embroidery-dark mb-1">
                Link
              </label>
              <input
                type="url"
                value={musica.url}
                onChange={(e) => handleMusicaChange(index, 'url', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-linen-300 text-xs font-body focus:outline-none focus:border-terracotta-400"
                placeholder="https://..."
              />
            </div>
          </div>
        ))}
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
