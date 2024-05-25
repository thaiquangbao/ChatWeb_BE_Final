import { IsNotEmpty, IsString } from 'class-validator';
import { GroupRooms } from '../../entities/Groups';
import { MessagesGroup } from '../../entities/MessagesGroup';

export class CreateMessagesGroupsDTO {
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsNotEmpty()
  @IsString()
  groupsID: string;
}
export class GetMessagesGroupDTO {
  groupId: string;
}
export class MessagesGroupsUpdate {
  idMessages: string;
  messagesUpdate: MessagesGroup;
  groupsUpdate: GroupRooms;
}
