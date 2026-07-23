import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";

const REFRESH_COOKIE = "refresh_token";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/auth",
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, { ip: req.ip });
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, emailVerified } = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
    return { accessToken, emailVerified };
  }

  @Post("verify-email")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { verified: true };
  }

  @Post("resend-verification")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 5 * 60_000 } })
  async resendVerification(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.resendVerificationEmail(user.id);
  }

  // "Esqueci minha senha": dispara o e-mail de recuperação. Resposta SEMPRE
  // 200 genérica (não revela se o e-mail existe). Throttle apertado por IP —
  // é um gerador de e-mail, alvo típico de abuso.
  @Post("forgot-password")
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 15 * 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { message: "Se houver uma conta com este e-mail, enviamos as instruções de recuperação." };
  }

  // Redefine a senha a partir do token do e-mail. Consome o token, revoga
  // todas as sessões ativas e zera o lockout.
  @Post("reset-password")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: "Senha redefinida com sucesso. Faça login com a nova senha." };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(refreshToken, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, REFRESH_COOKIE_OPTS);
    return { accessToken: tokens.accessToken };
  }

  @Post("logout")
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTS);
  }
}
