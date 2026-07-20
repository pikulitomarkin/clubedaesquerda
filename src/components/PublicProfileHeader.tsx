import React, { useState } from 'react';

interface PublicProfileHeaderProps {
  name: string;
  photos: string[];
  followersCount?: number;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  isSelf?: boolean;
}

export const PublicProfileHeader: React.FC<PublicProfileHeaderProps> = ({
  name,
  photos,
  followersCount = 0,
  isFollowing = false,
  onFollowToggle,
  isSelf = false,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const mainPhoto = photos[selectedPhotoIndex] || null;

  return (
    <div className="bg-gradient-to-b from-linen-300 via-linen-200 to-white">
      {/* Main Photo */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Photo Display */}
          <div className="md:col-span-2">
            {mainPhoto ? (
              <div className="relative rounded-lg overflow-hidden shadow-embroidery-3d">
                <img
                  src={mainPhoto}
                  alt={name}
                  className="w-full h-96 object-cover"
                />

                {/* Photo Counter */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-embroidery">
                    {selectedPhotoIndex + 1}/{photos.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-96 bg-linen-200 rounded-lg shadow-embroidery flex items-center justify-center border-2 border-dashed border-linen-400">
                <span className="text-4xl">📸</span>
              </div>
            )}

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`
                      flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden
                      border-2 transition-all duration-200
                      ${
                        idx === selectedPhotoIndex
                          ? 'border-terracotta-500 shadow-embroidery'
                          : 'border-linen-300 hover:border-linen-400'
                      }
                    `}
                    type="button"
                    title={`Foto ${idx + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <h1 className="font-heading text-4xl text-embroidery-black mb-2">
                {name}
              </h1>
              <p className="text-sm text-embroidery-gray font-body">
                Membro do Clube da Esquerda
              </p>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-terracotta-50 border border-terracotta-200">
                <p className="text-xs font-embroidery text-terracotta-700 mb-1">
                  Seguidores
                </p>
                <p className="text-2xl font-heading text-terracotta-600">
                  {followersCount.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Follow Button */}
            {!isSelf && onFollowToggle && (
              <button
                onClick={onFollowToggle}
                className={`
                  w-full embroidery-button
                  px-6 py-3 rounded-lg font-embroidery text-sm
                  transition-all duration-200
                  ${
                    isFollowing
                      ? 'bg-gradient-to-b from-linen-300 to-linen-600 text-embroidery-dark embroidery-thread-black'
                      : 'bg-gradient-to-b from-terracotta-500 to-terracotta-700 text-white embroidery-thread-white'
                  }
                `}
                type="button"
              >
                {isFollowing ? '✓ Seguindo' : '+ Seguir'}
              </button>
            )}

            {/* Edit Profile Button */}
            {isSelf && (
              <button
                className="embroidery-button embroidery-thread-black w-full bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-6 py-3 rounded-lg font-embroidery text-sm"
                type="button"
              >
                ✏️ Editar Perfil
              </button>
            )}

            {/* Join Date */}
            <div className="p-3 rounded-lg bg-linen-100 border border-linen-300">
              <p className="text-xs font-embroidery text-linen-700 mb-1">
                Membro desde
              </p>
              <p className="text-sm font-body text-embroidery-black">
                Março de 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
