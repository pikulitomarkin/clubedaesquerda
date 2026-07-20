import Link from "next/link";
import { EmbroideryButton } from "@/components/EmbroideryButton";
import { EmbroideryLogo } from "@/components/EmbroideryLogo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-linen-texture flex flex-col items-center justify-center gap-8 p-8">
      <EmbroideryLogo size="lg" />
      <p className="font-subheading text-2xl text-center max-w-md">
        Encontros, rodas de conversa e comunidade para quem milita e organiza a esquerda.
      </p>
      <div className="flex gap-4">
        <Link href="/cadastro">
          <EmbroideryButton size="lg">Cadastrar</EmbroideryButton>
        </Link>
        <Link href="/login">
          <EmbroideryButton size="lg" variant="secondary" threadColor="black">
            Entrar
          </EmbroideryButton>
        </Link>
      </div>
    </main>
  );
}
