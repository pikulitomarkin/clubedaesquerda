"use client";

import { useRouter } from "next/navigation";
import { EmbroideryButton } from "./EmbroideryButton";

// Botão "Voltar" padrão, presente em todas as telas (exceto a página
// inicial, que não tem para onde voltar dentro do app). Fixo no canto
// superior esquerdo, na mesma altura da marca/navbar e a 30px da lateral
// da página (mesma convenção da logo na home) — funciona em qualquer
// página sem precisar ajustar o layout dela (flex/relative) para acomodar
// o botão. Posição via `style` inline (não classe Tailwind): o CSS de
// .embroidery-button já define `position: relative`, e essa regra vencia
// a utilitária `.fixed` na cascata, deixando o botão preso ao fluxo normal
// (fixo por classe não tem prioridade sobre CSS externo com a mesma
// especificidade) — inline style sempre vence. Sem `href`, usa o
// histórico do navegador; com `href`, navega para uma rota fixa (útil
// quando a tela pode ser aberta por link direto, sem histórico prévio).
export function BotaoVoltar({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <EmbroideryButton
      type="button"
      size="sm"
      variant="secondary"
      threadColor="black"
      onClick={() => (href ? router.push(href) : router.back())}
      style={{ position: "fixed", top: 30, left: 30, zIndex: 40 }}
    >
      ← Voltar
    </EmbroideryButton>
  );
}
