import { IsUUID } from "class-validator";

export class RequestFriendshipDto {
  @IsUUID()
  addresseeId!: string;
}

export class BlockUserDto {
  @IsUUID()
  userId!: string;
}
