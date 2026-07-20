import { IsString, IsUrl, Matches, MaxLength } from "class-validator";

export class CreateEmojiDto {
  @IsString()
  @MaxLength(40)
  @Matches(/^[a-z0-9_]+$/, { message: "shortcode deve conter apenas letras minúsculas, números e _" })
  shortcode!: string;

  @IsUrl({ require_protocol: true })
  imageUrl!: string;
}
