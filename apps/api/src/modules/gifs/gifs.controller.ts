import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GifsService } from "./gifs.service";

@Controller("gifs")
@UseGuards(JwtAuthGuard)
export class GifsController {
  constructor(private readonly gifsService: GifsService) {}

  // Throttle dedicado: este endpoint é um proxy para o Tenor e consome a
  // cota da nossa chave — sem limite próprio, um usuário esgota a cota de
  // todo mundo. Busca de GIF é digitação, não automação: 30/min basta.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get("search")
  search(@Query("q") query: string) {
    return this.gifsService.search(query ?? "");
  }
}
