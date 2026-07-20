import React, { useState } from 'react';
import type { LinkMusica } from '@/types/rodas';

interface MusicPlayerProps {
  musicas: LinkMusica[];
  gifLoop?: string;
  nomeDaRoda: string;
}

const getPlatformaIcon = (plataforma?: string) => {
  switch (plataforma) {
    case 'spotify':
      return '🎵';
    case 'youtube':
      return '📺';
    case 'soundcloud':
      return '☁️';
    default:
      return '🎶';
  }
};

const getPlatformaLabel = (plataforma?: string) => {
  switch (plataforma) {
    case 'spotify':
      return 'Spotify';
    case 'youtube':
      return 'YouTube';
    case 'soundcloud':
      return 'SoundCloud';
    default:
      return 'Link';
  }
};

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  musicas,
  gifLoop,
  nomeDaRoda,
}) => {
  const [musicaAtiva, setMusicaAtiva] = useState(0);

  if (musicas.length === 0) {
    return (
      <div className="p-6 text-center bg-linen-50 rounded-lg border border-linen-300">
        <p className="text-2xl mb-2">🎵</p>
        <p className="font-body text-embroidery-gray">Nenhuma música adicionada</p>
      </div>
    );
  }

  const musicaAtualizada = musicas[musicaAtiva];

  return (
    <div className="space-y-4">
      {/* GIF Loop */}
      {gifLoop && (
        <div className="rounded-lg overflow-hidden shadow-embroidery">
          <img
            src={gifLoop}
            alt="Animação da roda"
            className="w-full h-48 object-cover animate-pulse"
          />
        </div>
      )}

      {/* Player Info */}
      <div className="bg-gradient-to-b from-terracotta-50 to-linen-50 rounded-lg shadow-embroidery p-6 space-y-4">
        <div>
          <h3 className="font-embroidery text-lg text-embroidery-black mb-1">
            Tocando Agora
          </h3>
          <p className="font-body text-sm text-embroidery-gray">
            {nomeDaRoda}
          </p>
        </div>

        {/* Música Ativa */}
        <div className="p-4 rounded-lg bg-white border-2 border-terracotta-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">
              {getPlatformaIcon(musicaAtualizada.plataforma)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-embroidery text-sm text-embroidery-black truncate">
                {musicaAtualizada.titulo || 'Música sem título'}
              </p>
              <p className="text-xs text-embroidery-gray">
                {getPlatformaLabel(musicaAtualizada.plataforma)}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <a
            href={musicaAtualizada.url}
            target="_blank"
            rel="noopener noreferrer"
            className="embroidery-button embroidery-thread-white w-full bg-gradient-to-b from-terracotta-500 to-terracotta-700 px-4 py-2 text-sm rounded-lg font-embroidery"
          >
            ▶️ Abrir em {getPlatformaLabel(musicaAtualizada.plataforma)}
          </a>
        </div>

        {/* Playlist */}
        {musicas.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-embroidery text-sm text-embroidery-black">
              Playlist ({musicas.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {musicas.map((musica, index) => (
                <button
                  key={musica.id}
                  onClick={() => setMusicaAtiva(index)}
                  className={`
                    w-full text-left p-3 rounded-lg transition-all
                    flex items-center gap-3
                    ${
                      index === musicaAtiva
                        ? 'bg-terracotta-200 border border-terracotta-400'
                        : 'bg-white border border-linen-300 hover:border-linen-400'
                    }
                  `}
                  type="button"
                >
                  <span className="font-bold text-sm text-embroidery-black">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-embroidery text-embroidery-black truncate">
                      {musica.titulo || 'Sem título'}
                    </p>
                    <p className="text-xs text-embroidery-gray">
                      {getPlatformaLabel(musica.plataforma)}
                    </p>
                  </div>
                  <span className="text-lg flex-shrink-0">
                    {index === musicaAtiva ? '▶️' : getPlatformaIcon(musica.plataforma)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-embroidery-gray font-body p-3 rounded-lg bg-white border border-linen-300">
          <p>💡 Clique em qualquer música da playlist para trocar</p>
        </div>
      </div>
    </div>
  );
};
