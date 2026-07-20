import { Injectable, Logger } from "@nestjs/common";
import { unlink } from "node:fs/promises";
import { basename, resolve } from "node:path";

const UPLOADS_DIR = resolve(process.cwd(), "uploads");

// Remoção dos arquivos físicos referenciados por URLs de upload.
//
// Sem isto, apagar a linha do banco (Message, Post, Roda) deixava o
// arquivo órfão em ./uploads — servido estaticamente e sem autenticação —,
// de modo que o expurgo de 48h e o fechamento de roda removiam o registro
// mas não o dado sensível. Ver docs/contexto.md § "Retenção após bloqueio".
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  // Falha ao apagar nunca interrompe o chamador: o objetivo é não deixar
  // órfãos, não impedir a exclusão do registro. ENOENT é silencioso
  // (arquivo já removido, ou URL externa que passou pelo filtro).
  async deleteByUrls(urls: Array<string | null | undefined>) {
    const paths = [...new Set(urls.map((url) => this.resolveLocalPath(url)).filter((p): p is string => !!p))];

    for (const path of paths) {
      try {
        await unlink(path);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          this.logger.warn(`Falha ao apagar upload ${path}: ${code ?? "erro desconhecido"}`);
        }
      }
    }
  }

  // Aceita apenas URLs que apontem para /uploads/ desta API; qualquer outra
  // (ex.: GIF de provedor externo) devolve null e é ignorada. O basename
  // descarta qualquer componente de diretório, então uma URL manipulada não
  // consegue escapar de UPLOADS_DIR (path traversal).
  private resolveLocalPath(url?: string | null): string | null {
    if (!url) return null;

    const marker = "/uploads/";
    const index = url.indexOf(marker);
    if (index === -1) return null;

    const raw = url.slice(index + marker.length).split(/[?#]/)[0] ?? "";
    const name = basename(decodeURIComponent(raw));
    if (!name || name === "." || name === "..") return null;

    const full = resolve(UPLOADS_DIR, name);
    return full.startsWith(UPLOADS_DIR) ? full : null;
  }
}
