import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { EmailModule } from "../email/email.module";
import { JwtConfigModule } from "../common/jwt/jwt-config.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [PassportModule, EmailModule, JwtConfigModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
