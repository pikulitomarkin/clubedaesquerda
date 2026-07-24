"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { LoginCardArte } from "@/components/LoginCardArte";
import { SugestaoModal } from "@/components/SugestaoModal";
import { useAuth } from "@/lib/auth-context";

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

            <EmbroideryButton threadColor="black" onClick={() => setSugestaoAberta(true)}>
              Sugira pra nós
            </EmbroideryButton>
          </div>
        </div>

        {/* "Se jogue na Roda!" — centralizado, na fonte de texto. */}
        <p className="max-w-3xl text-center font-body text-sm leading-relaxed text-embroidery-dark">
          {RODA}
        </p>
      </div>

      {sugestaoAberta && <SugestaoModal onClose={() => setSugestaoAberta(false)} />}
    </main>
  );
}

// Estado logado: a home vira o ponto de partida para as áreas do app —
// antes do login o usuário caía numa tela de feed vazia, sem navegação.
function JaLogado() {
  const { clearSession } = useAuth();
  const router = useRouter();

  return (
    <div className="stitched flex w-full max-w-sm flex-col gap-3 rounded-xl bg-linen-100/90 p-8 shadow-embroidery-3d">
      <h2 className="mb-1 text-center font-marker text-2xl text-embroidery-black">
        Você está na roda
      </h2>
      <Link href="/rodas/nova" className="text-center font-body text-sm underline">
        Criar uma roda
      </Link>
      <Link href="/eventos/novo" className="text-center font-body text-sm underline">
        Criar um evento
      </Link>
      <Link href="/perfil/editar" className="text-center font-body text-sm underline">
        Editar meu perfil
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
