import { BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

// Extensão gravada em disco derivada DESTE mapa, nunca de
// `file.originalname` (que é controlado pelo cliente). `file.mimetype` é só
// o Content-Type declarado na parte multipart — trivialmente forjável —,
// então além de derivar a extensão daqui, o conteúdo nunca é servido de
// forma executável (ver main.ts e a rota de evidência).
export const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Dois diretórios com regimes de acesso DIFERENTES, ambos sob o volume
// `uploads` (persistido entre recriações do container):
//   - public/   → mídia que aparece no produto (foto de perfil, capa de
//                 roda, imagem de post). Servida por /uploads/ (main.ts).
//   - evidence/ → anexos de denúncia. NUNCA servidos estaticamente; só a
//                 rota autenticada GET /reports/:id/evidence/:index
//                 (ADMIN/MODERATOR + AuditLog) os lê. Ver contexto.md.
const UPLOADS_ROOT = resolve(process.cwd(), "uploads");
export const PUBLIC_UPLOAD_DIR = resolve(UPLOADS_ROOT, "public");
export const EVIDENCE_UPLOAD_DIR = resolve(UPLOADS_ROOT, "evidence");

// Opções de multer compartilhadas entre o upload público e o de evidência —
// mesma validação de tipo/tamanho, só muda o diretório de destino.
export function uploadInterceptorOptions(destination: string) {
  return {
    storage: diskStorage({
      destination,
      filename: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, name: string) => void) =>
        cb(null, `${randomUUID()}${MIME_EXTENSIONS[file.mimetype] ?? ".bin"}`),
    }),
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
    fileFilter: (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
      if (!MIME_EXTENSIONS[file.mimetype]) {
        return cb(new BadRequestException("Tipo de arquivo não permitido"), false);
      }
      cb(null, true);
    },
  };
}
