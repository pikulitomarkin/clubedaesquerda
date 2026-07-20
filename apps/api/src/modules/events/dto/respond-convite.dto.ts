import { IsBoolean } from "class-validator";

export class RespondConviteDto {
  @IsBoolean()
  accept!: boolean;
}
