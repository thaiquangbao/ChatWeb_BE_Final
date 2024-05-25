import { ArrayMinSize, ArrayNotEmpty, IsString } from 'class-validator';
import { UsersPromise } from '../../auth/dtos/Users.dto';
import { User } from '../../entities/users';

export class CreateGroupsDto {
  @ArrayNotEmpty()
  @ArrayMinSize(3)
  @IsString({ each: true })
  participants: string[];
  creator: UsersPromise;
  nameGroups?: string;
  avtGroups?: string;
}
export class InvitedGroupsDto {
  participants: string[];
  groupId: string;
}
export class UpdateGroupsRooms {
  idGroups: string;
  nameGroups?: string;
  avtGroups?: string;
}
export class KickUser {
  idGroups: string;
  idUserKick: string;
}
export class Franchiser {
  idGroups: string;
  idUserFranchise: string;
}
export interface UserAttends {
  email: string;
  fullName: string;
  acceptCall: boolean;
}
export class CallGroups {
  id: string;
  participants: User[];
  callGroup: boolean;
  creator: User;
  attendCallGroup?: UserAttends[];
}
