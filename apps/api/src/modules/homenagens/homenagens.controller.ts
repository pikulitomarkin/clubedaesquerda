import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { HomenagensService } from "./homenagens.service";
import { CreateHomenagemDto } from "./dto/create-homenagem.dto";
import { SetVisibilityDto } from "./dto/set-visibility.dto";

@Controller()
@UseGuards(JwtAuthGuard)
export class HomenagensController {
  constructor(private readonly homenagensService: HomenagensService) {}

  @Post("homenagens")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHomenagemDto) {
    return this.homenagensService.create(user.id, dto);
  }

  @Get("users/:userId/homenagens")
  listForProfile(@Param("userId", ParseUUIDPipe) userId: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.homenagensService.listForProfile(userId, viewer.id);
  }

  @Patch("homenagens/:id/visibility")
  setVisibility(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetVisibilityDto,
  ) {
    return this.homenagensService.setVisibility(id, user.id, dto.visible);
  }
}
