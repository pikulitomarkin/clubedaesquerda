import { IsBoolean, IsUUID } from "class-validator";

export class RequestFriendshipDto {
  @IsUUID()
  addresseeId!: string;
}

export class RespondFriendshipDto {
  @IsBoolean()
  accept!: boolean;
}

export class BlockUserDto {
  @IsUUID()
  userId!: string;
}
