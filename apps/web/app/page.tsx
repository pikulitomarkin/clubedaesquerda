"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { LoginCardArte } from "@/components/LoginCardArte";
import { MinhasAtividadesSection } from "@/components/MinhasAtividadesSection";
import { FeedDescoberta } from "@/components/FeedDescoberta";
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

      {accessToken ? (
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 pt-4">
          {/* Perfil reduzido a um resumo no canto superior direito — a
              versão anterior (card cheio, com bandeiras/interesses e todos
              os botões) empurrava o feed para muito abaixo da dobra.
              O feed de descoberta é o que a pessoa vem ver ao logar, então
              sobe para logo abaixo da marca; o manifesto desce para depois
              dele. */}
          <div className="flex w-full justify-end">
            <PerfilResumo onSugerir={() => setSugestaoAberta(true)} />
          </div>

          <div className="w-full max-w-5xl flex flex-col items-center gap-8">
            <MinhasAtividadesSection />

            {/* Feed de descoberta: rodas e eventos de OUTRAS pessoas, para
                entrar/participar — sem isso, logar não mostrava nada além
                do que o próprio usuário já tinha criado. Prévia de 8 itens
                por seção; "/feed" tem a lista completa. */}
            <div className="w-full flex flex-col items-center gap-3">
              <FeedDescoberta limit={8} />
              <Link href="/feed" className="font-body text-xs underline text-embroidery-gray">
                ver feed completo
              </Link>
            </div>
          </div>

          <p className="max-w-3xl text-center font-subheading text-xl font-bold leading-relaxed text-embroidery-black sm:text-2xl">
            {MANIFESTO}
          </p>

          {/* "Se jogue na Roda!" — centralizado, na fonte de texto. */}
          {/* Texto do rodapé em letra de mão (Dancing Script), como pedido —
              maior que a fonte de corpo para a cursiva ficar legível. */}
          <p className="max-w-3xl text-center font-handwritten text-[13px] leading-relaxed text-embroidery-dark">
            {RODA}
          </p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 pt-8">
          {/* Manifesto à esquerda; login/cadastro + sugestão à direita.
              items-center alinha o texto ao centro do bastidor de login. */}
          <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-14">
            <p className="font-subheading text-xl font-bold leading-relaxed text-embroidery-black sm:text-2xl">
              {MANIFESTO}
            </p>

            <div className="flex flex-col items-center gap-6">
              <LoginCardArte />

              <EmbroideryButton onClick={() => setSugestaoAberta(true)}>Sugira pra nós</EmbroideryButton>
            </div>
          </div>

          <p className="max-w-3xl text-center font-handwritten text-[13px] leading-relaxed text-embroidery-dark">
            {RODA}
          </p>
        </div>
      )}

      {sugestaoAberta && <SugestaoModal onClose={() => setSugestaoAberta(false)} />}
    </main>
  );
}

// Resumo compacto do usuário logado, ancorado no canto superior direito —
// substitui o antigo card cheio (foto grande + bandeiras/interesses +
// botões grandes), que empurrava o feed para muito abaixo da dobra.
// Mostra só o essencial (nome, foto) e os mesmos atalhos como links curtos.
function PerfilResumo({ onSugerir }: { onSugerir: () => void }) {
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

  return (
    <div className="stitched flex w-fit flex-col items-end gap-2 rounded-xl bg-linen-100/90 p-3 shadow-embroidery-3d">
      <div className="flex items-center gap-2">
        <span className="font-marker text-sm text-embroidery-black whitespace-nowrap">
          {displayName ? `Olá, ${displayName}!` : "Você está na roda"}
        </span>
        {photoUrl ? (
          <img src={photoUrl} alt={displayName ?? "Você"} className="h-10 w-10 rounded-full object-cover shadow-embroidery-3d" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-linen-300 flex items-center justify-center text-sm font-embroidery">
            {(displayName ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
        <Link href="/rodas" className="font-body text-[11px] underline text-embroidery-gray">
          Criar roda
        </Link>
        <Link href="/eventos" className="font-body text-[11px] underline text-embroidery-gray">
          Criar evento
        </Link>
        <Link href="/perfil/editar" className="font-body text-[11px] underline text-embroidery-gray">
          Editar perfil
        </Link>
        {/* Lista de amigos vive no próprio perfil (FriendsSection) — este
            é o único ponto de acesso a ela a partir da home. */}
        {userId && (
          <Link href={`/perfil/${userId}`} className="font-body text-[11px] underline text-embroidery-gray">
            Amigos
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            clearSession();
            router.refresh();
          }}
          className="font-body text-[11px] underline text-embroidery-gray"
        >
          Sair
        </button>
      </div>

      {/* Botão de chat na tela inicial — leva à inbox de conversas
          (mesma página do "Roda de Conversa" no perfil), sem precisar
          passar pelo perfil pra chegar lá. 10px mais baixo que o padrão:
          `.embroidery-button` fixa padding: 0.75rem (12px) por cima das
          classes de `size`, então só um override inline garante o corte
          exato (-5px em cada lado = -10px de altura total). */}
      <Link href="/chats" className="w-full">
        <EmbroideryButton
          variant="secondary"
          threadColor="blue"
          size="sm"
          className="w-full"
          style={{ paddingTop: "calc(0.75rem - 5px)", paddingBottom: "calc(0.75rem - 5px)" }}
        >
          Chat
        </EmbroideryButton>
      </Link>

      <EmbroideryButton size="sm" onClick={onSugerir}>
        Sugira pra nós
      </EmbroideryButton>
    </div>
  );
}
