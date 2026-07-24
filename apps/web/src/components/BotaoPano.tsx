import Link from "next/link";
import React from "react";

// Botão no estilo da arte do cliente (IMAGENS PROJETO/Botões.png): retalho
// de tecido terracota com pesponto e o rótulo na letra cursiva bordada.
// A textura vem de um recorte real daquela arte — ver .btn-pano no CSS.
//
// Serve como <button> ou como link (basta passar `href`), para os dois usos
// que existem hoje: ações de formulário e navegação.
const BASE =
  "btn-pano inline-flex items-center justify-center text-center font-handwritten font-bold leading-none";

const TAMANHOS = {
  sm: "px-5 py-2 text-lg",
  md: "px-7 py-2.5 text-xl",
  lg: "px-9 py-3 text-2xl",
} as const;

type Tamanho = keyof typeof TAMANHOS;

export function BotaoPano({
  children,
  href,
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  size?: Tamanho;
}) {
  const classes = `${BASE} ${TAMANHOS[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
