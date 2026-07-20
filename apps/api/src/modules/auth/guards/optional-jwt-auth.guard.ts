import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Autentica quando há um token válido, mas NÃO rejeita a requisição quando
// não há token (ou ele é inválido): nesses casos segue com request.user
// indefinido.
//
// Existe para endpoints que continuam públicos mas precisam saber quem é o
// viewer para aplicar os filtros de bloqueio (ver BlocksService). Usar o
// JwtAuthGuard normal ali transformaria rotas públicas em autenticadas.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Sobrescreve o comportamento padrão (que lança UnauthorizedException
  // quando `user` é falsy): aqui a ausência de usuário é um resultado
  // válido, e não um erro.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}
