import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { PostsService } from "./posts.service";
import { CreatePostDto } from "./dto/create-post.dto";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // Continua pública, mas com auth opcional: se houver token válido, o
  // viewer é identificado para aplicar a ocultação de bloqueados e
  // devolver a própria reação já dada.
  @Get("rodas/:rodaId")
  @UseGuards(OptionalJwtAuthGuard)
  listByRoda(
    @Param("rodaId") rodaId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
    @Query("cursor") cursor?: string,
  ) {
    return this.postsService.listByRoda(rodaId, viewer?.id, cursor);
  }

  // Posts nas Mesas — ver docs/contexto.md § "Posts nas Mesas".
  @Get("mesas/:mesaId")
  @UseGuards(OptionalJwtAuthGuard)
  listByMesa(
    @Param("mesaId") mesaId: string,
    @CurrentUser() viewer?: AuthenticatedUser,
    @Query("cursor") cursor?: string,
  ) {
    return this.postsService.listByMesa(mesaId, viewer?.id, cursor);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.postsService.softDelete(id, user.id);
  }
}
