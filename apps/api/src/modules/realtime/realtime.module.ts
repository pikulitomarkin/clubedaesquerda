import { Global, Module } from "@nestjs/common";
import { JwtConfigModule } from "../common/jwt/jwt-config.module";
import { ChatsModule } from "../chats/chats.module";
import { RealtimeGateway } from "./realtime.gateway";

// Global: outros módulos (matches, friendships) injetam RealtimeGateway
// diretamente sem precisar importar este módulo — só precisa estar
// registrado uma vez no AppModule. Ver docs/architecture.md.
@Global()
@Module({
  imports: [JwtConfigModule, ChatsModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
