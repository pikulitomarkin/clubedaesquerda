"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { LoginCardArte } from "@/components/LoginCardArte";
import { MinhasAtividadesSection } from "@/components/MinhasAtividadesSection";
import { SugestaoModal } from "@/components/SugestaoModal";
import { useAuth } from "@/lib/auth-context";
import { getUser, type UserProfile } from "@/lib/api";

const MANIFESTO =
  "Somos uma plataforma de conexão entre pessoas que tem a sede da reflexão crítica, do debate político e da construção da justiça pelo afeto. Aqui, todo mundo é bem-vinde e o respeito é de lei!";

const RODA =
  "Se jogue na Roda! Nada mais brasileiro, democrático, anarquista e futurista do que a roda. A roda é herança de nossos ancestrais, é perseverança na criação criativa e coletiva. Roda de samba, Samba de Roda, Rodas indígenas, Dança circular, Roda de amigxs, Roda de bar, Roda de debate, Mesa redonda, Aula em círculo, GTs rotativos. Na roda todo mundo se olha, na roda todo mundo se lembra, na roda todo mundo se movimenta.";

export default function HomePage() {
  const { accessToken } = useAuth();
  const [sugestaoAberta, setSugestaoAberta] = useState(false);

  return (
    <main className="min-h-screen bg-linen-texture p-[30px]">
      {/* Marca no canto superior esquerdo, a 30px da borda da página
          (o padding do <main>) — três voltas lentas ao carregar. */}
      <EmbroideryLogo size="brand" className="animate-spin-3" />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 pt-8">
        {/* Manifesto à esquerda; login/cadastro + sugestão à direita.
            items-center alinha o texto ao centro do bastidor de login. */}
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-14">
          <p className="font-subheading text-xl font-bold leading-relaxed text-embroidery-black sm:text-2xl">
            {MANIFESTO}
          </p>

          <div className="flex flex-col items-center gap-6">
            {accessToken ? <JaLogado /> : <LoginCardArte />}

            <EmbroideryButton onClick={() => setSugestaoAberta(true)}>Sugira pra nós</EmbroideryButton>
          </div>
        </div>

        {accessToken && <MinhasAtividadesSection />}

        {/* "Se jogue na Roda!" — centralizado, na fonte de texto. */}
        {/* Texto do rodapé em letra de mão (Dancing Script), como pedido —
            maior que a fonte de corpo para a cursiva ficar legível. */}
        <p className="max-w-3xl text-center font-handwritten text-[13px] leading-relaxed text-embroidery-dark">
          {RODA}
        </p>
      </div>

      {sugestaoAberta && <SugestaoModal onClose={() => setSugestaoAberta(false)} />}
    </main>
  );
}

// Estado logado: a home vira o ponto de partida para as áreas do app —
// antes do login o usuário caía numa tela de feed vazia, sem navegação.
// Mostra nome, foto principal, bandeiras e interesses do próprio usuário
// (mesmos dados exibidos no perfil público, ver GET /users/:id).
function JaLogado() {
  const { clearSession, accessToken, userId } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!accessToken || !userId) return;
    getUser(userId, accessToken)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [accessToken, userId]);

  const displayName = profile?.profile?.displayName;
  const photoUrl = profile?.profile?.photoUrl;
  const bandeiras = profile?.profile?.bandeiras ?? [];
  const interesses = profile?.profile?.interesses ?? [];

  return (
    <div className="stitched flex w-full max-w-sm flex-col gap-3 rounded-xl bg-linen-100/90 p-8 shadow-embroidery-3d">
      <div className="flex flex-col items-center gap-2 mb-1">
        {photoUrl ? (
          <img src={photoUrl} alt={displayName ?? "Você"} className="h-20 w-20 rounded-full object-cover shadow-embroidery-3d" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-linen-300 flex items-center justify-center text-2xl font-embroidery">
            {(displayName ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="text-center font-marker text-2xl text-embroidery-black">
          {displayName ? `Olá, ${displayName}!` : "Você está na roda"}
        </h2>
      </div>

      {bandeiras.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-[10px] uppercase tracking-wide text-embroidery-gray">Bandeiras</span>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {bandeiras.map((b) => (
              <div key={b.slug} className="flex flex-col items-center gap-1 w-16">
                {b.imageUrl && <img src={b.imageUrl} alt="" aria-hidden className="h-8 w-auto object-contain" />}
                <span className="font-body text-[9px] text-center leading-tight break-words">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {interesses.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="font-body text-[10px] uppercase tracking-wide text-embroidery-gray">Interesses</span>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2">
            {interesses.map((i) => (
              <div key={i.slug} className="flex flex-col items-center gap-1 w-16">
                {i.imageUrl && <img src={i.imageUrl} alt="" aria-hidden className="h-8 w-auto object-contain" />}
                <span className="font-body text-[9px] text-center leading-tight break-words">{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/rodas">
        <EmbroideryButton size="sm" className="w-full">
          Criar uma roda
        </EmbroideryButton>
      </Link>
      <Link href="/eventos">
        <EmbroideryButton size="sm" className="w-full">
          Criar um evento
        </EmbroideryButton>
      </Link>
      <Link href="/perfil/editar">
        <EmbroideryButton size="sm" className="w-full">
          Editar meu perfil
        </EmbroideryButton>
      </Link>
      <button
        type="button"
        onClick={() => {
          clearSession();
          router.refresh();
        }}
        className="mt-2 text-center font-body text-xs text-embroidery-gray underline"
      >
        Sair
      </button>
    </div>
  );
}
