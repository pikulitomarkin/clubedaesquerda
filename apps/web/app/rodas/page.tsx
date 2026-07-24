"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BotaoVoltar } from "@/components/BotaoVoltar";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { CriarRodaModal } from "@/components/CriarRodaModal";
import { useAuth } from "@/lib/auth-context";
import { listRodasPublicas, type RodaPublica } from "@/lib/api";

// Página inicial das Rodas — diretório público, ordenado por número de
// integrantes (ver RodasService.listPublic). Rodas INVITE_ONLY não
// aparecem aqui.
export default function RodasIndexPage() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [rodas, setRodas] = useState<RodaPublica[] | null>(null);
  const [q, setQ] = useState("");
  const [showCriar, setShowCriar] = useState(false);

  function refresh() {
    if (!accessToken) return;
    listRodasPublicas(accessToken, { q: q || undefined })
      .then(setRodas)
      .catch(() => setRodas([]));
  }

  useEffect(refresh, [accessToken, q]);

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <BotaoVoltar />
      <EmbroideryLogo size="sm" />
      <div className="flex items-center gap-4">
        <h1 className="font-heading text-3xl">Rodas</h1>
        <EmbroideryButton threadColor="purple" size="sm" onClick={() => setShowCriar(true)}>
          Criar roda
        </EmbroideryButton>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar roda..."
        className="w-full max-w-md rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
      />

      <div className="w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-4">
        {rodas === null && <p className="font-body text-sm col-span-full text-center">Carregando...</p>}

        {rodas?.length === 0 && (
          <p className="font-body text-sm col-span-full text-center text-embroidery-gray">
            Nenhuma roda encontrada.
          </p>
        )}

        {rodas?.map((roda) => (
          <Link
            key={roda.id}
            href={`/rodas/${roda.slug}`}
            className="flex flex-col items-center gap-2 p-3 bg-white/60 rounded-lg shadow-embroidery hover:shadow-embroidery-3d border-2 border-transparent hover:border-terracotta-400 transition-all"
          >
            {roda.imageUrl ? (
              <img src={roda.imageUrl} alt={roda.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-linen-300 flex items-center justify-center text-2xl font-embroidery">
                {roda.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-embroidery text-xs text-center line-clamp-2">{roda.name}</p>
            <p className="text-[10px] font-body text-embroidery-gray">
              {roda._count.membros} {roda._count.membros === 1 ? "membro" : "membros"}
            </p>
          </Link>
        ))}
      </div>

      {showCriar && (
        <CriarRodaModal
          onClose={() => setShowCriar(false)}
          onCreated={(slug) => {
            setShowCriar(false);
            router.push(`/rodas/${slug}`);
          }}
        />
      )}
    </main>
  );
}
