"use client";

import { useState } from "react";
import { EmbroideryButton } from "./EmbroideryButton";
import { FormTextarea } from "./FormTextarea";
import { useAuth } from "@/lib/auth-context";
import { ApiError, createReport, REPORT_CATEGORIES, uploadFile, type ReportCategory } from "@/lib/api";

export function ReportModal({
  reportedUserId,
  onClose,
}: {
  reportedUserId: string;
  onClose: () => void;
}) {
  const { accessToken } = useAuth();
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !accessToken) return;
    setSubmitting(true);
    setError(null);

    try {
      const evidenceUrls: string[] = [];
      if (files) {
        for (const file of Array.from(files)) {
          const { url } = await uploadFile(file, accessToken);
          evidenceUrls.push(url);
        }
      }

      await createReport(
        { reportedUserId, category, description: description || undefined, evidenceUrls },
        accessToken,
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a denúncia");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-embroidery-3d">
        {done ? (
          <>
            <h2 className="font-heading text-2xl mb-3">Denúncia enviada</h2>
            <p className="font-body text-sm mb-6">
              Nossa equipe de moderação vai analisar. Obrigado por ajudar a manter a comunidade
              segura.
            </p>
            <EmbroideryButton onClick={onClose}>Fechar</EmbroideryButton>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <h2 className="font-heading text-2xl">Denunciar de troll</h2>

            <fieldset className="flex flex-col gap-2">
              <legend className="font-body text-xs font-semibold mb-1">Motivo</legend>
              {REPORT_CATEGORIES.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm font-body">
                  <input
                    type="radio"
                    name="category"
                    value={opt.value}
                    checked={category === opt.value}
                    onChange={() => setCategory(opt.value)}
                    required
                  />
                  {opt.label}
                </label>
              ))}
            </fieldset>

            <FormTextarea
              label="Descreva o ocorrido (opcional)"
              maxLength={1000}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex flex-col gap-1">
              <label className="font-body text-xs font-semibold text-embroidery-dark">
                Provas (opcional): imagens ou PDF
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="text-xs font-body"
              />
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <div className="flex gap-3">
              <EmbroideryButton type="submit" isLoading={submitting} disabled={!category} threadColor="red">
                Enviar denúncia
              </EmbroideryButton>
              <button type="button" onClick={onClose} className="text-xs font-body underline">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
