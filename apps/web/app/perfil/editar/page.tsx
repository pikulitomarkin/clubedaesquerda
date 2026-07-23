"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { FormField } from "@/components/FormField";
import { MultiSelectGrid } from "@/components/MultiSelectGrid";
import { useAuth } from "@/lib/auth-context";
import {
  ApiError,
  getMyProfile,
  listBandeiras,
  listInteresses,
  updateMyProfile,
  uploadFile,
  type CatalogItem,
} from "@/lib/api";

// Limites do spec do cliente (espelham os do UpdateProfileDto na API).
const BIO_MAX = 600;
const MAX_FOTOS = 3;
const MAX_BANDEIRAS = 8;
const MAX_INTERESSES = 12;

export default function EditarPerfilPage() {
  const router = useRouter();
  const { accessToken, userId } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [bandeiraIds, setBandeiraIds] = useState<string[]>([]);
  const [interesseIds, setInteresseIds] = useState<string[]>([]);

  const [bandeiras, setBandeiras] = useState<CatalogItem[]>([]);
  const [interesses, setInteresses] = useState<CatalogItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([getMyProfile(accessToken), listBandeiras(accessToken), listInteresses(accessToken)])
      .then(([profile, bandeirasList, interessesList]) => {
        setDisplayName(profile.displayName);
        setBio(profile.bio ?? "");
        setCity(profile.city ?? "");
        setState(profile.state ?? "");
        // Perfis antigos só têm photoUrl; a galeria começa a partir dela.
        setPhotos(profile.photos?.length ? profile.photos : profile.photoUrl ? [profile.photoUrl] : []);
        setBandeiraIds(profile.bandeiraIds);
        setInteresseIds(profile.interesseIds);
        setBandeiras(bandeirasList);
        setInteresses(interessesList);
      })
      .catch(() => setError("Não foi possível carregar seu perfil"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Zera o input para permitir reenviar o mesmo arquivo depois de remover.
    e.target.value = "";
    if (!file || !accessToken) return;

    if (photos.length >= MAX_FOTOS) {
      setError(`Você pode ter até ${MAX_FOTOS} fotos`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A foto não pode ser maior que 5MB");
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const { url } = await uploadFile(file, accessToken);
      setPhotos((atuais) => [...atuais, url].slice(0, MAX_FOTOS));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar a foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function removerFoto(url: string) {
    setPhotos((atuais) => atuais.filter((p) => p !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyProfile(
        {
          displayName,
          bio,
          photos,
          city: city || undefined,
          state: state || undefined,
          bandeiraIds,
          interesseIds,
        },
        accessToken,
      );
      router.push(`/perfil/${userId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o perfil");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-linen-texture flex items-center justify-center p-8">
        <p className="font-body">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center gap-6 p-8">
      <EmbroideryLogo size="sm" />

      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-6">
        <section className="flex flex-col items-center gap-3 p-6 bg-white/80 rounded-lg shadow-embroidery">
          {/* Até 3 fotos: a primeira é a principal (vira o avatar). */}
          <div className="flex flex-wrap justify-center gap-3">
            {photos.map((url, i) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="h-28 w-28 rounded-full object-cover shadow-embroidery-3d"
                />
                {i === 0 && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-terracotta-600 px-1.5 py-0.5 text-[10px] font-body text-white">
                    principal
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removerFoto(url)}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-embroidery-black/70 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-linen-300 text-3xl">
                📸
              </div>
            )}
          </div>

          <p className="font-body text-xs text-embroidery-gray">
            {photos.length}/{MAX_FOTOS} fotos
          </p>

          <label
            className={`text-xs font-embroidery underline ${
              photos.length >= MAX_FOTOS
                ? "cursor-not-allowed text-embroidery-gray"
                : "cursor-pointer text-terracotta-700"
            }`}
          >
            {uploadingPhoto
              ? "Enviando..."
              : photos.length >= MAX_FOTOS
                ? "Limite de fotos atingido"
                : "Adicionar foto"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              disabled={uploadingPhoto || photos.length >= MAX_FOTOS}
              onChange={handlePhotoChange}
            />
          </label>
        </section>

        <section className="flex flex-col gap-4 p-6 bg-white/80 rounded-lg shadow-embroidery">
          <h2 className="font-heading text-2xl">Sobre você</h2>

          <FormField label="Nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />

          <div className="flex flex-col gap-1">
            <label className="font-body text-xs font-semibold text-embroidery-dark">Descrição</label>
            <textarea
              value={bio}
              maxLength={BIO_MAX}
              rows={4}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-md border border-linen-600 bg-white/80 px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-terracotta-400"
              placeholder="Fale um pouco sobre você, suas causas e o que te move..."
            />
            <span className="text-xs font-body text-embroidery-gray text-right">
              {bio.length}/{BIO_MAX}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <FormField label="UF" value={state} maxLength={2} onChange={(e) => setState(e.target.value.toUpperCase())} />
          </div>
        </section>

        <section className="flex flex-col gap-3 p-6 bg-white/80 rounded-lg shadow-embroidery">
          <h2 className="font-heading text-2xl">Bandeiras</h2>
          <MultiSelectGrid
            items={bandeiras}
            selectedIds={bandeiraIds}
            onChange={setBandeiraIds}
            maxSelections={MAX_BANDEIRAS}
          />
        </section>

        <section className="flex flex-col gap-3 p-6 bg-white/80 rounded-lg shadow-embroidery">
          <h2 className="font-heading text-2xl">Interesses</h2>
          <MultiSelectGrid
            items={interesses}
            selectedIds={interesseIds}
            onChange={setInteresseIds}
            maxSelections={MAX_INTERESSES}
          />
        </section>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <EmbroideryButton type="submit" isLoading={saving}>
          Salvar perfil
        </EmbroideryButton>
      </form>
    </main>
  );
}
