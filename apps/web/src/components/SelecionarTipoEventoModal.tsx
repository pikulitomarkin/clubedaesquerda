"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { EVENTO_TIPOS } from "@/lib/api";

// Popup do botão "CRIAR EVENTO": primeiro passo é só escolher o tipo —
// o formulário específico de cada um abre depois, via "CRIAR AGORA".
export function SelecionarTipoEventoModal({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (tipo: string) => void;
}) {
  const [tipo, setTipo] = useState<string>("PRESENCIAL");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Criar evento"
      className="fixed inset-0 z-50 flex items-center justify-center bg-embroidery-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="stitched w-full max-w-sm rounded-xl bg-linen-100 p-6 shadow-embroidery-3d flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-marker text-2xl text-center">Criar evento</h2>

        <div className="flex flex-col gap-2">
          {EVENTO_TIPOS.map((t) => (
            <label
              key={t.value}
              className="flex items-center gap-2 text-sm font-body cursor-pointer p-2 rounded-md hover:bg-white/60"
            >
              <input type="radio" name="tipo-evento" checked={tipo === t.value} onChange={() => setTipo(t.value)} />
              {t.label}
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <EmbroideryButton threadColor="mustard" onClick={() => onSelect(tipo)}>
            Criar agora
          </EmbroideryButton>
          <button type="button" onClick={onClose} className="text-xs font-body underline">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
