"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { listRodasForUser, type RodaMembership } from "@/lib/api";

// Rodas de que o perfil é membro, sempre com a imagem da roda — ver
// docs/contexto.md § "Entrada na Roda e imagem no perfil". Estilo
// inspirado no protótipo de UI gerado à parte (RodasSection.tsx),
// adaptado para os dados reais da API (a versão original não exibia
// `imageUrl`, só um ícone de categoria que não existe no nosso schema).
export function RodasSection({ profileUserId }: { profileUserId: string }) {
  const { accessToken } = useAuth();
  const [rodas, setRodas] = useState<RodaMembership[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    listRodasForUser(profileUserId, accessToken)
      .then(setRodas)
      .catch(() => setRodas([]));
  }, [profileUserId, accessToken]);

  if (rodas.length === 0) return null;

  return (
    <section className="w-full max-w-md flex flex-col gap-3">
      <h2 className="font-heading text-2xl">Rodas Conectadas</h2>
      <div className="grid grid-cols-2 gap-3">
        {rodas.map((roda) => (
          <Link
            key={roda.id}
            href={`/rodas/${roda.slug}`}
            className="flex flex-col items-center gap-2 p-3 bg-white/60 rounded-lg shadow-embroidery hover:shadow-embroidery-3d hover:border-terracotta-400 border-2 border-transparent transition-all"
          >
            {roda.imageUrl ? (
              <img
                src={roda.imageUrl}
                alt={roda.name}
                className="w-16 h-16 rounded-full object-cover shadow-embroidery"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-linen-300 flex items-center justify-center text-2xl font-embroidery text-embroidery-dark">
                {roda.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="font-embroidery text-xs text-center text-embroidery-black line-clamp-2">
              {roda.name}
            </p>
            {roda.role === "OWNER" && (
              <span className="text-[10px] font-body text-terracotta-700">criadora</span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
