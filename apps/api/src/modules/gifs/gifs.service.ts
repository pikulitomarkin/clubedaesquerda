import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface GifResult {
  id: string;
  previewUrl: string;
  url: string;
  title: string;
}

// DECISÃO: a chave do provedor de GIFs (Tenor) fica só no backend — o
// client nunca a recebe, chama GET /gifs/search e recebe só os
// resultados já resolvidos. Isso evita expor uma credencial de API no
// bundle do frontend e permite trocar/limitar o provedor num único
// lugar. Sem TENOR_API_KEY configurada, retorna lista vazia (a busca
// de GIF fica indisponível, mas o resto do chat funciona normalmente)
// em vez de quebrar a request — ver docs/contexto.md.
@Injectable()
export class GifsService {
  private readonly logger = new Logger(GifsService.name);

  constructor(private readonly config: ConfigService) {}

  async search(query: string, limit = 20): Promise<GifResult[]> {
    const apiKey = this.config.get<string>("TENOR_API_KEY");
    if (!apiKey || !query.trim()) return [];

    const url = new URL("https://tenor.googleapis.com/v2/search");
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("client_key", "clube-da-esquerda");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("media_filter", "gif");
    url.searchParams.set("contentfilter", "medium");

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Tenor respondeu ${res.status}`);
      const body = (await res.json()) as { results?: TenorResult[] };

      return (body.results ?? [])
        .filter((item) => !!item.media_formats?.gif?.url)
        .map((item) => ({
          id: item.id,
          title: item.content_description ?? "",
          previewUrl: item.media_formats?.tinygif?.url ?? item.media_formats!.gif!.url,
          url: item.media_formats!.gif!.url,
        }));
    } catch (err) {
      this.logger.warn(`Falha ao buscar GIFs: ${(err as Error).message}`);
      return [];
    }
  }
}

interface TenorResult {
  id: string;
  content_description?: string;
  media_formats?: {
    gif?: { url: string };
    tinygif?: { url: string };
  };
}
