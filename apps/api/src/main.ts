import "reflect-metadata";
import cookieParser from "cookie-parser";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import type { ServerResponse } from "node:http";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  // Headers de segurança aplicados a TODA resposta da API. Escritos à mão
  // (em vez de helmet) para não introduzir dependência nova; se helmet
  // entrar no projeto depois, substitui este bloco inteiro.
  app.use((_req: unknown, res: ServerResponse, next: () => void) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    // A API só devolve JSON e arquivos baixáveis — nada precisa executar.
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Serve os arquivos de ./uploads (evidências de denúncia, mídia de
  // posts) em /uploads/<arquivo> — ver modules/uploads.
  //
  // Content-Disposition: attachment é a segunda barreira contra conteúdo
  // ativo servido na origem da API (a primeira é a extensão derivada do
  // MIME validado, ver UploadsController): mesmo que um arquivo carregue
  // HTML/JS no corpo, o browser baixa em vez de renderizar, então não há
  // execução same-origin capaz de chamar /auth/refresh e roubar sessão.
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
    setHeaders: (res) => {
      res.setHeader("Content-Disposition", "attachment");
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
