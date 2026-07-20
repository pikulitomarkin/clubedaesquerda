import React, { useState } from 'react';
import { PhotoUpload } from '@/components/PhotoUpload';
import { DescriptionInput } from '@/components/DescriptionInput';
import { BannerSelector } from '@/components/BannerSelector';
import { InterestSelector } from '@/components/InterestSelector';
import { EmbroideryButton } from '@/components/EmbroideryButton';
import { BANNERS } from '@/data/banners';
import { INTERESTS } from '@/data/interests';

export const ProfileCrudDemo: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [banners, setBanners] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [savedData, setSavedData] = useState<any>(null);

  const handleReset = () => {
    setPhotos([]);
    setDescription('');
    setBanners([]);
    setInterests([]);
    setSavedData(null);
  };

  const handleSave = () => {
    setSavedData({
      photos: photos.length,
      description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
      bannersCount: banners.length,
      interestsCount: interests.length,
      timestamp: new Date().toLocaleString('pt-BR'),
    });
  };

  return (
    <div className="min-h-screen bg-linen-texture">
      {/* Header */}
      <div className="bg-gradient-to-b from-linen-300 to-linen-100 shadow-embroidery p-8">
        <h1 className="font-heading text-4xl md:text-5xl text-embroidery-black">
          Demo: CRUD de Perfil
        </h1>
        <p className="font-subheading text-xl text-embroidery-gray mt-2">
          Experimente todos os componentes de perfil
        </p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photos */}
            <section className="bg-white/50 rounded-lg shadow-embroidery p-6">
              <PhotoUpload
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={3}
                maxFileSize={5}
              />
            </section>

            {/* Description */}
            <section className="bg-white/50 rounded-lg shadow-embroidery p-6">
              <DescriptionInput
                value={description}
                onChange={setDescription}
                maxCharacters={600}
              />
            </section>

            {/* Banners */}
            <section className="bg-white/50 rounded-lg shadow-embroidery p-6">
              <BannerSelector
                selectedBanners={banners}
                onChange={setBanners}
                maxSelections={8}
              />
            </section>

            {/* Interests */}
            <section className="bg-white/50 rounded-lg shadow-embroidery p-6">
              <InterestSelector
                selectedInterests={interests}
                onChange={setInterests}
                maxSelections={12}
              />
            </section>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <EmbroideryButton
                size="lg"
                threadColor="green"
                onClick={handleSave}
              >
                💾 Salvar Dados
              </EmbroideryButton>
              <EmbroideryButton
                size="lg"
                variant="secondary"
                threadColor="red"
                onClick={handleReset}
              >
                🔄 Limpar Tudo
              </EmbroideryButton>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-4">
            {/* Statistics */}
            <div className="bg-white/50 rounded-lg shadow-embroidery p-6 sticky top-4">
              <h3 className="font-embroidery text-lg text-embroidery-black mb-4">
                Resumo
              </h3>

              <div className="space-y-3">
                {/* Photos Count */}
                <div className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-200">
                  <p className="text-xs font-embroidery text-terracotta-700 mb-1">
                    Fotos
                  </p>
                  <p className="text-2xl font-heading text-terracotta-600">
                    {photos.length}/3
                  </p>
                </div>

                {/* Description Length */}
                <div className="p-3 rounded-lg bg-linen-100 border border-linen-300">
                  <p className="text-xs font-embroidery text-linen-700 mb-1">
                    Descrição
                  </p>
                  <p className="text-2xl font-heading text-linen-700">
                    {description.length}/600
                  </p>
                  <p className="text-xs text-embroidery-gray mt-1">
                    {description.length > 0 ? 'Preenchido ✓' : 'Vazio'}
                  </p>
                </div>

                {/* Banners Count */}
                <div className="p-3 rounded-lg bg-purple-100 border border-purple-300">
                  <p className="text-xs font-embroidery text-purple-700 mb-1">
                    Bandeiras
                  </p>
                  <p className="text-2xl font-heading text-purple-600">
                    {banners.length}/8
                  </p>
                </div>

                {/* Interests Count */}
                <div className="p-3 rounded-lg bg-green-100 border border-green-300">
                  <p className="text-xs font-embroidery text-green-700 mb-1">
                    Interesses
                  </p>
                  <p className="text-2xl font-heading text-green-600">
                    {interests.length}/12
                  </p>
                </div>

                {/* Completion */}
                <div className="p-3 rounded-lg bg-blue-100 border border-blue-300">
                  <p className="text-xs font-embroidery text-blue-700 mb-1">
                    Progresso
                  </p>
                  <div className="w-full h-3 rounded-full bg-blue-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${
                          ((photos.length > 0 ? 1 : 0) +
                            (description.length > 0 ? 1 : 0) +
                            (banners.length > 0 ? 1 : 0) +
                            (interests.length > 0 ? 1 : 0)) /
                          4 *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {Math.round(
                      ((photos.length > 0 ? 1 : 0) +
                        (description.length > 0 ? 1 : 0) +
                        (banners.length > 0 ? 1 : 0) +
                        (interests.length > 0 ? 1 : 0)) /
                        4 *
                        100
                    )}
                    % completo
                  </p>
                </div>
              </div>
            </div>

            {/* Last Save Info */}
            {savedData && (
              <div className="bg-green-50 rounded-lg shadow-embroidery p-6 border border-green-200">
                <h4 className="font-embroidery text-sm text-green-700 mb-2">
                  ✓ Último Salvamento
                </h4>
                <div className="space-y-1 text-xs text-green-700 font-body">
                  <p>
                    <strong>Fotos:</strong> {savedData.photos}
                  </p>
                  <p>
                    <strong>Descrição:</strong> {savedData.description}
                  </p>
                  <p>
                    <strong>Bandeiras:</strong> {savedData.bannersCount}
                  </p>
                  <p>
                    <strong>Interesses:</strong> {savedData.interestsCount}
                  </p>
                  <p className="mt-2 text-xs text-green-600">
                    {savedData.timestamp}
                  </p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg shadow-embroidery p-6 border border-blue-200">
              <h4 className="font-embroidery text-sm text-blue-700 mb-2">
                ℹ️ Informações
              </h4>
              <ul className="text-xs text-blue-700 font-body space-y-1 list-disc list-inside">
                <li>Máximo 3 fotos (5MB cada)</li>
                <li>Descrição até 600 caracteres</li>
                <li>8 bandeiras (21 opções)</li>
                <li>12 interesses (25 opções)</li>
                <li>Dados salvos localmente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/50 rounded-lg shadow-embroidery p-4 text-center">
            <span className="text-3xl mb-2 block">📸</span>
            <p className="font-embroidery text-sm text-embroidery-black">
              Upload de Fotos
            </p>
            <p className="text-xs text-embroidery-gray mt-1">
              Drag & drop com validação
            </p>
          </div>

          <div className="bg-white/50 rounded-lg shadow-embroidery p-4 text-center">
            <span className="text-3xl mb-2 block">📝</span>
            <p className="font-embroidery text-sm text-embroidery-black">
              Descrição
            </p>
            <p className="text-xs text-embroidery-gray mt-1">
              Contador de caracteres
            </p>
          </div>

          <div className="bg-white/50 rounded-lg shadow-embroidery p-4 text-center">
            <span className="text-3xl mb-2 block">🏳️‍🌈</span>
            <p className="font-embroidery text-sm text-embroidery-black">
              Bandeiras
            </p>
            <p className="text-xs text-embroidery-gray mt-1">
              21 opções com ícones
            </p>
          </div>

          <div className="bg-white/50 rounded-lg shadow-embroidery p-4 text-center">
            <span className="text-3xl mb-2 block">⭐</span>
            <p className="font-embroidery text-sm text-embroidery-black">
              Interesses
            </p>
            <p className="text-xs text-embroidery-gray mt-1">
              25 opções por categoria
            </p>
          </div>
        </div>

        {/* Data Tables */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Banners List */}
          <div className="bg-white/50 rounded-lg shadow-embroidery p-6">
            <h3 className="font-embroidery text-lg text-embroidery-black mb-4">
              Todas as Bandeiras (21)
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  className={`p-2 rounded-lg flex items-center gap-2 text-xs font-body ${
                    banners.includes(banner.id)
                      ? 'bg-terracotta-100 text-terracotta-700'
                      : 'bg-linen-50 text-embroidery-gray'
                  }`}
                >
                  <span className="text-lg">{banner.icon}</span>
                  <span>{banner.name}</span>
                  {banners.includes(banner.id) && (
                    <span className="ml-auto">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Interests List */}
          <div className="bg-white/50 rounded-lg shadow-embroidery p-6">
            <h3 className="font-embroidery text-lg text-embroidery-black mb-4">
              Todos os Interesses (25)
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {INTERESTS.map((interest) => (
                <div
                  key={interest.id}
                  className={`p-2 rounded-lg flex items-center gap-2 text-xs font-body ${
                    interests.includes(interest.id)
                      ? 'bg-terracotta-100 text-terracotta-700'
                      : 'bg-linen-50 text-embroidery-gray'
                  }`}
                >
                  <span className="text-lg">{interest.icon}</span>
                  <span>{interest.name}</span>
                  <span className="ml-auto text-xs opacity-60">
                    {interest.category}
                  </span>
                  {interests.includes(interest.id) && (
                    <span className="ml-auto">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
