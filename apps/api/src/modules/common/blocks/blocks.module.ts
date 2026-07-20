import { Global, Module } from "@nestjs/common";
import { BlocksService } from "./blocks.service";

// Global, como o PrismaModule: bloqueio é uma preocupação transversal
// (posts, chats, rodas, homenagens, reactions) e exigir o import em cada
// módulo consumidor só adicionaria ruído.
@Global()
@Module({
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
