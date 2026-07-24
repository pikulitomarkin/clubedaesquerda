"use client";

import { useEffect, useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { useAuth } from "@/lib/auth-context";
import { ApiError, listMyChats, sendConvite } from "@/lib/api";

// Botão "CONVIDAR": seleciona entre os contatos diretos existentes (mesmo
// critério usado na criação de roda de conversa — não há busca geral de
// usuários no produto, ver docs/contexto.md) e envia um convite para cada
// selecionado. Convites múltiplos para a mesma pessoa são permitidos de
// propósito no backend.
export function ConvidarModal({ eventoId, onClose }: { eventoId: string; onClose: () => void }) {
  const { accessToken } = useAuth();
  const [contatos, setContatos] = useState<Array<{ id: string; displayName: string }> | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [enviados, setEnviados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listMyChats(accessToken)
      .then((chats) =>
        setContatos(
          chats
            .filter((c) => c.type === "DIRECT" && c.otherUser)
            .map((c) => ({ id: c.otherUser!.id, displayName: c.otherUser!.profile?.displayName ?? "Alguém" })),
        ),
      )
      .catch(() => setContatos([]));
  }, [accessToken]);

  function toggle(id: string) {
    setSelecionados((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleEnviar() {
    if (!accessToken || selecionados.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      for (const inviteeId of selecionados) {
        await sendConvite(eventoId, inviteeId, accessToken);
      }
      setEnviados(selecionados);
      setSelecionados([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o convite");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Convidar"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="stitched w-full max-w-md rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Convidar</h2>

        {contatos === null && <p className="font-body text-sm text-center">Carregando...</p>}

        {contatos?.length === 0 && (
          <p className="font-body text-xs text-center text-embroidery-gray">
            Você ainda não tem conversas diretas para convidar.
          </p>
        )}

        <div className="max-h-52 overflow-y-auto flex flex-col gap-1 border border-linen-400 rounded-md p-2">
          {contatos?.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm font-body cursor-pointer p-1">
              <input
                type="checkbox"
                checked={selecionados.includes(c.id)}
                disabled={enviados.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              {c.displayName}
              {enviados.includes(c.id) && <span className="text-[10px] text-embroidery-gray">convite enviado</span>}
            </label>
          ))}
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <div className="flex gap-3">
          <EmbroideryButton onClick={handleEnviar} isLoading={enviando} disabled={selecionados.length === 0}>
            Enviar convite
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
