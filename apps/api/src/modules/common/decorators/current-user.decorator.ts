import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthenticatedUser {
  id: string;
  role: string;
}

// Extrai o usuário anexado pelo JwtAuthGuard (request.user) para uso
// direto nos handlers de controller, sem repetir "req.user" em todo lugar.
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
