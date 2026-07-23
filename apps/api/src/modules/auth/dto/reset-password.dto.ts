import { IsString, MaxLength, MinLength } from "class-validator";
import { Match } from "./match.decorator";

export class ResetPasswordDto {
  @IsString()
  token!: string;

  // Mesma política de senha do cadastro (RegisterDto).
  @MinLength(10, { message: "A senha deve ter ao menos 10 caracteres" })
  @MaxLength(128, { message: "A senha deve ter no máximo 128 caracteres" })
  password!: string;

  @Match("password", { message: "A confirmação de senha não corresponde à senha" })
  confirmPassword!: string;
}
