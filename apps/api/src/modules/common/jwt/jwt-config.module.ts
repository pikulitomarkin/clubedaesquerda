import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { decodePem } from "../../auth/crypto/pem.util";

// Configuração RS256 do access token compartilhada entre AuthModule
// (assinatura no login) e RealtimeModule (verificação na conexão
// WebSocket) — evita duplicar a leitura de chaves/expiração em dois
// lugares.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // decodePem: as chaves vêm em base64 no ambiente porque PEM é
        // multi-linha e .env/Docker Compose não carregam isso. Ver pem.util.
        privateKey: decodePem(config.getOrThrow<string>("JWT_ACCESS_PRIVATE_KEY")),
        publicKey: decodePem(config.getOrThrow<string>("JWT_ACCESS_PUBLIC_KEY")),
        signOptions: {
          algorithm: "RS256",
          expiresIn: config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m"),
        },
        verifyOptions: { algorithms: ["RS256"] },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class JwtConfigModule {}
