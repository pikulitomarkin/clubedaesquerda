import { Controller, Delete, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":id")
  async findById(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.usersService.findById(id, viewer.id);
  }

  @Delete("me")
  async deleteMe(@CurrentUser() user: AuthenticatedUser) {
    await this.usersService.softDelete(user.id);
  }
}
