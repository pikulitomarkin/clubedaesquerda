"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { listFriends, type Friend } from "@/lib/api";

// Lista de amigos (amizade ACCEPTED) de um perfil — próprio ou de
// terceiros, mesmo padrão de RodasSection/EventosSection. A API já
// filtra bloqueios nos dois sentidos (ver FriendshipsService.listFriends).
export function FriendsSection({ profileUserId }: { profileUserId: string }) {
  const { accessToken } = useAuth();
  const [amigos, setAmigos] = useState<Friend[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    listFriends(profileUserId, accessToken)
      .then(setAmigos)
      .catch(() => setAmigos([]));
  }, [profileUserId, accessToken]);

  return (
    <section className="w-full max-w-md flex flex-col gap-3">
      <h2 className="font-heading text-2xl">Amigos</h2>

      {amigos.length === 0 ? (
        <p className="text-xs font-body text-embroidery-gray">Ainda não tem amigos por aqui.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {amigos.map((amigo) => (
            <Link
              key={amigo.id}
              href={`/perfil/${amigo.id}`}
              className="flex flex-col items-center gap-1 p-2 bg-white/60 rounded-lg shadow-embroidery hover:shadow-embroidery-3d border-2 border-transparent hover:border-terracotta-400 transition-all"
            >
              {amigo.profile?.photoUrl ? (
                <img
                  src={amigo.profile.photoUrl}
                  alt={amigo.profile.displayName}
                  className="w-14 h-14 rounded-full object-cover shadow-embroidery"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-linen-300 flex items-center justify-center text-xl font-embroidery text-embroidery-dark">
                  {(amigo.profile?.displayName ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <p className="font-embroidery text-[11px] text-center text-embroidery-black line-clamp-2">
                {amigo.profile?.displayName ?? "Alguém"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
