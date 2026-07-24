"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { searchGifs, type GifResult } from "@/lib/api";

export function GifPicker({
  onSelect,
  onClose,
}: {
  onSelect: (gif: GifResult) => void;
  onClose: () => void;
}) {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !query.trim()) return;
    setLoading(true);
    try {
      setResults(await searchGifs(query.trim(), accessToken));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute bottom-full mb-2 w-72 max-h-80 overflow-y-auto p-3 bg-white rounded-lg shadow-embroidery-3d border border-linen-400 z-10">
      <div className="flex items-center gap-2 mb-2">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar GIF..."
            className="flex-1 min-w-0 rounded-md border border-linen-600 px-2 py-1 text-xs font-body"
          />
          <button type="submit" className="text-xs font-body underline shrink-0">
            Buscar
          </button>
        </form>
        <button onClick={onClose} className="text-xs underline shrink-0">
          fechar
        </button>
      </div>

      {loading && <p className="text-xs font-body">Buscando...</p>}

      {!loading && results.length === 0 && query && (
        <p className="text-xs font-body text-embroidery-gray">
          Nenhum resultado (ou busca de GIF indisponível no momento).
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {results.map((gif) => (
          <button key={gif.id} type="button" onClick={() => onSelect(gif)} className="rounded overflow-hidden">
            <img src={gif.previewUrl} alt={gif.title} className="w-full h-20 object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
