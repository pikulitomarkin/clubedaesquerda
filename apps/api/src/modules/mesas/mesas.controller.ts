import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { MesasService } from "./mesas.service";
import { CreateMesaDto } from "./dto/create-mesa.dto";

@Controller("mesas")
@UseGuards(JwtAuthGuard)
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.mesasService.findById(id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMesaDto) {
    return this.mesasService.create(user.id, dto);
  }

  @Post(":id/participantes")
  join(@Param("id") mesaId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mesasService.joinMesa(mesaId, user.id);
  }
}
