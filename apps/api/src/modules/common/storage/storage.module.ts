import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

// Global como PrismaModule/BlocksModule: limpeza de arquivos é usada pelos
// fluxos de expurgo (chats bloqueados, fechamento de roda).
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
