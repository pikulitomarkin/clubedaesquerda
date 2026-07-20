import { Equals, IsBoolean, IsDateString, IsEmail, IsEnum, IsString, Length, Matches, MaxLength, MinLength } from "class-validator";
import { Gender } from "@clube/database";
import { Match } from "./match.decorator";

export class RegisterDto {
  @Matches(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF em formato inválido" })
  cpf!: string;

  // MaxLength evita DoS de CPU: Argon2id sobre uma senha de megabytes seria
  // arbitrariamente caro. 128 cobre qualquer passphrase legítima.
  @MinLength(10, { message: "A senha deve ter ao menos 10 caracteres" })
  @MaxLength(128, { message: "A senha deve ter no máximo 128 caracteres" })
  password!: string;

  @Match("password", { message: "A confirmação de senha não corresponde à senha" })
  confirmPassword!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsDateString()
  birthDate!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsString()
  @MinLength(2)
  city!: string;

  @Length(2, 2, { message: "UF deve ter 2 letras" })
  state!: string;

  // Consentimento explícito (LGPD): a UI deve exibir Termos e Política e só
  // habilitar o cadastro com ambos marcados. O registro em UserConsent é
  // feito a partir desses aceites — sem eles não há base legal auditável.
  @IsBoolean()
  @Equals(true, { message: "É necessário aceitar os Termos de Uso" })
  acceptTerms!: boolean;

  @IsBoolean()
  @Equals(true, { message: "É necessário aceitar a Política de Privacidade" })
  acceptPrivacy!: boolean;
}
