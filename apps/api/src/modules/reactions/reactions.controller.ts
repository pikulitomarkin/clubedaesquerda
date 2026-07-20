import { Body, Controller, Delete, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ReactionTarget } from "@clube/database";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { ReactionsService } from "./reactions.service";
import { ReactDto } from "./dto/react.dto";

@Controller("reactions")
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  react(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReactDto) {
    return this.reactionsService.react(user.id, dto);
  }

  @Delete(":targetId")
  unreact(
    @CurrentUser() user: AuthenticatedUser,
    @Param("targetId") targetId: string,
    @Query("targetType") targetType: ReactionTarget,
  ) {
    return this.reactionsService.unreact(user.id, targetType, targetId);
  }
}
