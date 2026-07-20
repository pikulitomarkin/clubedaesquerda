import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateHomenagemDto {
  @IsUUID()
  recipientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  content!: string;
}
