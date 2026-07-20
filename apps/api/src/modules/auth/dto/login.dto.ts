import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsString()
  cpf!: string;

  @MinLength(1)
  password!: string;
}
