"use client";

import { useRouter } from "next/navigation";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";
import { LoginCardArte } from "@/components/LoginCardArte";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-linen-texture flex items-center justify-center p-6 sm:p-8">
      {/* Marca à esquerda e container "Entre na Roda" à direita (empilha no
          mobile). O bastidor "pula": a elipse abaixo encolhe/clareia em
          sincronia, criando a leitura de chão — ver keyframes hop/hopShadow. */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 lg:gap-20">
        <div className="flex shrink-0 flex-col items-center">
          <EmbroideryLogo size="xl" className="animate-hop" />
          <span
            aria-hidden="true"
            className="mt-3 h-3.5 w-52 rounded-[50%] bg-embroidery-black/30 blur-[4px] animate-hop-shadow"
          />
        </div>

        <LoginCardArte onLogado={() => router.push("/")} />
      </div>
    </main>
  );
}
