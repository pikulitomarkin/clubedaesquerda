import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PUBLIC_UPLOAD_DIR, uploadInterceptorOptions } from "../common/uploads/upload.constants";

// Upload de mídia PÚBLICA (foto de perfil, capa de roda, imagem de post).
// Vai para uploads/public/, servido em /uploads/ (ver main.ts). Anexos de
// denúncia NÃO passam por aqui — usam POST /reports/evidence, que grava no
// diretório privado. Ver docs/contexto.md § "Upload e evidências".
@Controller("uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly config: ConfigService) {}

  // Throttle dedicado: com o limite global (100/min) um único usuário podia
  // gravar 100 arquivos de 10 MB por minuto — 1 GB/min de disco.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  @UseInterceptors(FileInterceptor("file", uploadInterceptorOptions(PUBLIC_UPLOAD_DIR)))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException("Nenhum arquivo enviado");

    const apiPublicUrl = this.config.get<string>("API_PUBLIC_URL", `http://localhost:${this.config.get("PORT", 3333)}`);
    return { url: `${apiPublicUrl}/uploads/${file.filename}` };
  }
}
