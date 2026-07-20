import type { CustomEmoji } from "@/lib/api";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const SHORTCODE_REGEX = /:([a-z0-9_]+):/g;

// Renderiza o texto de uma mensagem TEXT: detecta links (linkify) e
// substitui shortcodes de emoji personalizado (:codigo:) pela imagem
// correspondente no catálogo — ver docs/contexto.md § "Mensagens:
// links, GIFs e emojis". Emojis unicode padrão não precisam de
// tratamento nenhum, já chegam como caracteres no texto.
export function MessageContent({ text, emojis }: { text: string; emojis: CustomEmoji[] }) {
  const emojiByCode = new Map(emojis.map((e) => [e.shortcode, e]));

  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all"
            >
              {part}
            </a>
          );
        }

        const segments = part.split(SHORTCODE_REGEX);
        return (
          <span key={i}>
            {segments.map((segment, j) => {
              const emoji = emojiByCode.get(segment);
              // índices ímpares de split() com grupo de captura são os
              // shortcodes; só renderiza como emoji se existir no catálogo,
              // senão mantém o texto literal ":segment:".
              if (j % 2 === 1 && emoji) {
                return (
                  <img
                    key={j}
                    src={emoji.imageUrl}
                    alt={`:${segment}:`}
                    title={`:${segment}:`}
                    className="inline-block h-5 w-5 align-text-bottom"
                  />
                );
              }
              return j % 2 === 1 ? <span key={j}>{`:${segment}:`}</span> : <span key={j}>{segment}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}
