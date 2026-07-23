import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

// Campos da caixa de sugestões da home ("Eu sugiro que..." / "Porque...").
export class CreateSugestaoDto {
  @IsString()
  @MinLength(3, { message: "Conte um pouco mais da sua sugestão" })
  @MaxLength(1000)
  sugiro!: string;

  // "Porque..." é o complemento opcional — não bloqueia o envio.
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  porque?: string;
}
