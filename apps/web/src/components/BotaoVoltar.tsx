"use client";

import { useRouter } from "next/navigation";
import { EmbroideryButton } from "./EmbroideryButton";

// Botão "Voltar" padrão, presente em todas as telas (exceto a página
// inicial, que não tem para onde voltar dentro do app). Posição fixa no
// canto superior esquerdo — funciona em qualquer página sem precisar
// ajustar o layout dela (flex/relative) para acomodar o botão. Sem `href`,
// usa o histórico do navegador; com `href`, navega para uma rota fixa
// (útil quando a tela pode ser aberta por link direto, sem histórico prévio).
export function BotaoVoltar({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <EmbroideryButton
      type="button"
      size="sm"
      variant="secondary"
      threadColor="black"
      onClick={() => (href ? router.push(href) : router.back())}
      className="fixed top-[30px] left-[30px] z-40"
    >
      ← Voltar
    </EmbroideryButton>
  );
}
