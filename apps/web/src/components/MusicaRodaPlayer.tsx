"use client";

import { useEffect, useRef, useState } from "react";

// Player simples para "Link de 3 músicas da roda": a maioria dos links
// colados pelos usuários tende a ser do YouTube, então usamos a IFrame API
// dele (play/pause/próxima de verdade via postMessage). Link de arquivo de
// áudio direto (.mp3 etc.) cai num <audio> nativo. Qualquer outro provedor
// (Spotify, SoundCloud...) não dá pra controlar sem SDK próprio — mostramos
// só um link para abrir em outra aba.
function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const embedMatch = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

function isDirectAudio(url: string) {
  return /\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(url);
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YoutubePlayerInstance;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YoutubePlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  loadVideoById(id: string): void;
}

let youtubeApiPromise: Promise<void> | null = null;
function loadYoutubeApi(): Promise<void> {
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  });
  return youtubeApiPromise;
}

export function MusicaRodaPlayer({ urls }: { urls: string[] }) {
  const validUrls = urls.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayerInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = validUrls[index] ?? null;
  const youtubeId = current ? parseYoutubeId(current) : null;

  useEffect(() => {
    if (!youtubeId || !containerRef.current) return;
    let cancelled = false;

    loadYoutubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      if (!playerRef.current) {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: youtubeId,
          events: {
            onStateChange: (e: { data: number }) => {
              if (window.YT && e.data === window.YT.PlayerState.ENDED) handleNext();
            },
          },
        });
      } else {
        playerRef.current.loadVideoById(youtubeId);
        if (!playing) playerRef.current.pauseVideo();
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  function handlePlayPause() {
    if (youtubeId) {
      if (!playerRef.current) return;
      if (playing) playerRef.current.pauseVideo();
      else playerRef.current.playVideo();
      setPlaying(!playing);
    } else if (audioRef.current) {
      if (playing) audioRef.current.pause();
      else void audioRef.current.play();
      setPlaying(!playing);
    }
  }

  function handleNext() {
    setPlaying(false);
    setIndex((i) => (i + 1) % validUrls.length);
  }

  if (validUrls.length === 0 || !current) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {youtubeId ? (
        <div ref={containerRef} className="w-full aspect-video rounded-md overflow-hidden" />
      ) : isDirectAudio(current) ? (
        <audio ref={audioRef} src={current} onEnded={handleNext} className="w-full" />
      ) : (
        <a href={current} target="_blank" rel="noopener noreferrer" className="text-xs font-body underline text-center">
          Abrir música {index + 1} ↗
        </a>
      )}

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!youtubeId && !isDirectAudio(current)}
          className="font-embroidery text-xs uppercase tracking-wide text-terracotta-700 disabled:opacity-40"
        >
          {playing ? "Pausar" : "Play"}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={validUrls.length < 2}
          className="font-embroidery text-xs uppercase tracking-wide text-terracotta-700 disabled:opacity-40"
        >
          Avançar ▶▶
        </button>
      </div>
      <p className="text-[10px] font-body text-center text-embroidery-gray">
        Música {index + 1} de {validUrls.length}
      </p>
    </div>
  );
}
