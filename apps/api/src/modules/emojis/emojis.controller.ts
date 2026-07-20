import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { EmojisService } from "./emojis.service";
import { CreateEmojiDto } from "./dto/create-emoji.dto";

@Controller("emojis")
@UseGuards(JwtAuthGuard)
export class EmojisController {
  constructor(private readonly emojisService: EmojisService) {}

  @Get()
  findAll() {
    return this.emojisService.findAllActive();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  create(@Body() dto: CreateEmojiDto) {
    return this.emojisService.create(dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "MODERATOR")
  deactivate(@Param("id", ParseUUIDPipe) id: string) {
    return this.emojisService.deactivate(id);
  }
}
