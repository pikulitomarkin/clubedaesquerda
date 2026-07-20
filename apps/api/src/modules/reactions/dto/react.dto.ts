import { IsEnum, IsUUID } from "class-validator";
import { ReactionTarget, ReactionType } from "@clube/database";

export class ReactDto {
  @IsEnum(ReactionTarget)
  targetType!: ReactionTarget;

  @IsUUID()
  targetId!: string;

  @IsEnum(ReactionType)
  type!: ReactionType;
}
