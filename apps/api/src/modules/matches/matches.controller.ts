import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { MatchesService } from "./matches.service";
import { SwipeDto } from "./dto/swipe.dto";

@Controller("matches")
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post("swipe")
  async swipe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SwipeDto) {
    return this.matchesService.swipe(user.id, dto.targetId, dto.liked);
  }
}
