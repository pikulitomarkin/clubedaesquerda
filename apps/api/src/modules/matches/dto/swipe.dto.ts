import { IsBoolean, IsUUID } from "class-validator";

export class SwipeDto {
  @IsUUID()
  targetId!: string;

  @IsBoolean()
  liked!: boolean;
}
